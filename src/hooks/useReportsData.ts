import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../../lib/supabase';
import { Student, Attendance } from '../types/database';
import { startOfMonth, endOfMonth, format, eachWeekOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface StudentReport {
    student: Student;
    classes: { id: string; name: string; level: string }[];
    totalAbsences: number;
    attendanceRate: number;
    consecutiveAbsencesGlobal: number;
    consecutiveAbsencesByClass: { classId: string; className: string; count: number }[];
    status: 'regular' | 'warning' | 'risk';
}

export interface RiskStudent {
    student: Student;
    classes: string[];
    consecutiveAbsences: number;
    parentName: string;
    parentPhone: string;
    history: ('present' | 'absent' | 'justified')[];
}

export interface WeeklyStats {
    name: string;
    presentes: number;
    faltas: number;
}

export interface ClassAttendanceData {
    date: string;
    className: string;
    presences: number;
    absences: number;
    total: number;
    percentage: number;
}

export const useReportsData = (selectedMonth: Date) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
    const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
    const [classAttendanceData, setClassAttendanceData] = useState<ClassAttendanceData[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const monthStart = startOfMonth(selectedMonth);
                const monthEnd = endOfMonth(selectedMonth);
                const monthStartStr = format(monthStart, 'yyyy-MM-dd');
                const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

                // Fetch all students with their enrollments
                const studentsData = await api.getAllStudentsWithAttendance();
                
                // Fetch ALL attendance (for consecutive absences - full history)
                const { data: allAttendance, error: allAttendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .order('date', { ascending: false });

                if (allAttendanceError) throw allAttendanceError;

                // Fetch attendance for selected month (for statistics)
                const monthAttendance = await api.getAttendanceForPeriod(monthStartStr, monthEndStr);

                // Process student reports
                const reports: StudentReport[] = [];
                const risks: RiskStudent[] = [];

                for (const studentData of studentsData as any[]) {
                    const student = {
                        id: studentData.id,
                        full_name: studentData.full_name,
                        date_of_birth: studentData.date_of_birth,
                        parent_name: studentData.parent_name,
                        parent_email: studentData.parent_email,
                        parent_phone: studentData.parent_phone,
                        contact_info: studentData.contact_info,
                        email: studentData.email,
                        phone: studentData.phone,
                        medical_info: studentData.medical_info,
                        avatar_url: studentData.avatar_url,
                        status: studentData.status,
                        created_at: studentData.created_at,
                        updated_at: studentData.updated_at
                    } as Student;

                    const classes = studentData.enrollments?.map((e: any) => e.class) || [];
                    
                    // Get student's attendance from month
                    const studentMonthAttendance = monthAttendance.filter(a => a.student_id === student.id);
                    const totalAbsences = studentMonthAttendance.filter(a => a.status === 'absent').length;
                    const totalPresences = studentMonthAttendance.filter(a => a.status === 'present').length;
                    const attendanceRate = studentMonthAttendance.length > 0 
                        ? Math.round((totalPresences / studentMonthAttendance.length) * 100) 
                        : 100;

                    // Calculate consecutive absences GLOBALLY (full history)
                    const studentAllAttendance = (allAttendance as Attendance[])
                        .filter(a => a.student_id === student.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    let consecutiveGlobal = 0;
                    for (const record of studentAllAttendance) {
                        if (record.status === 'absent') {
                            consecutiveGlobal++;
                        } else {
                            break;
                        }
                    }

                    // Calculate consecutive absences BY CLASS
                    const consecutiveByClass: { classId: string; className: string; count: number }[] = [];
                    for (const cls of classes) {
                        const classAttendance = (allAttendance as Attendance[])
                            .filter(a => a.student_id === student.id && a.class_id === cls.id)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        
                        let consecutive = 0;
                        for (const record of classAttendance) {
                            if (record.status === 'absent') {
                                consecutive++;
                            } else {
                                break;
                            }
                        }
                        
                        if (consecutive > 0) {
                            consecutiveByClass.push({
                                classId: cls.id,
                                className: cls.name,
                                count: consecutive
                            });
                        }
                    }

                    // Determine status
                    let status: 'regular' | 'warning' | 'risk' = 'regular';
                    if (consecutiveGlobal >= 3) {
                        status = 'risk';
                    } else if (attendanceRate < 75 || consecutiveGlobal === 2) {
                        status = 'warning';
                    }

                    reports.push({
                        student,
                        classes,
                        totalAbsences,
                        attendanceRate,
                        consecutiveAbsencesGlobal: consecutiveGlobal,
                        consecutiveAbsencesByClass: consecutiveByClass,
                        status
                    });

                    // Add to risk list if needed
                    if (consecutiveGlobal >= 3) {
                        const history = studentAllAttendance.slice(0, 10).map(a => a.status);
                        risks.push({
                            student,
                            classes: classes.map((c: any) => c.name),
                            consecutiveAbsences: consecutiveGlobal,
                            parentName: student.parent_name || 'Não informado',
                            parentPhone: student.parent_phone || 'Não informado',
                            history
                        });
                    }
                }

                // Calculate weekly stats for the selected month
                const weeks = eachWeekOfInterval(
                    { start: monthStart, end: monthEnd },
                    { weekStartsOn: 0 }
                );

                const weeklyData: WeeklyStats[] = weeks.map((weekStart, idx) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
                    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
                    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

                    const weekAttendance = monthAttendance.filter(a => 
                        a.date >= weekStartStr && a.date <= weekEndStr
                    );

                    const presentes = weekAttendance.filter(a => a.status === 'present').length;
                    const faltas = weekAttendance.filter(a => a.status === 'absent').length;

                    return {
                        name: `Semana ${idx + 1}`,
                        presentes,
                        faltas
                    };
                });

                // Calculate class attendance by date
                const classAttendanceMap = new Map<string, ClassAttendanceData>();
                
                for (const record of monthAttendance) {
                    // Get class name
                    const classData = await supabase
                        .from('classes')
                        .select('name')
                        .eq('id', record.class_id)
                        .single();
                    
                    if (!classData.data) continue;
                    
                    const key = `${record.date}-${record.class_id}`;
                    
                    if (!classAttendanceMap.has(key)) {
                        classAttendanceMap.set(key, {
                            date: record.date,
                            className: classData.data.name,
                            presences: 0,
                            absences: 0,
                            total: 0,
                            percentage: 0
                        });
                    }
                    
                    const entry = classAttendanceMap.get(key)!;
                    entry.total++;
                    
                    if (record.status === 'present') {
                        entry.presences++;
                    } else if (record.status === 'absent') {
                        entry.absences++;
                    }
                    
                    entry.percentage = entry.total > 0 
                        ? Math.round((entry.presences / entry.total) * 100) 
                        : 0;
                }

                const classAttendanceArray = Array.from(classAttendanceMap.values())
                    .sort((a, b) => b.date.localeCompare(a.date));

                setStudentReports(reports.sort((a, b) => a.student.full_name.localeCompare(b.student.full_name)));
                setRiskStudents(risks);
                setWeeklyStats(weeklyData);
                setClassAttendanceData(classAttendanceArray);
            } catch (err) {
                console.error('Error loading reports data:', err);
                setError('Falha ao carregar dados dos relatórios');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedMonth]);

    return {
        loading,
        error,
        studentReports,
        riskStudents,
        weeklyStats,
        classAttendanceData
    };
};

