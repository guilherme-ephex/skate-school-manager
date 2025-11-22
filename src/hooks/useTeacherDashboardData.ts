import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Class, Notice, Student, Attendance } from '../types/database';
import { startOfDay, endOfDay, isSameDay, subDays, format, parseISO, getDay, startOfMonth, eachDayOfInterval, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardStats {
    classesToday: number;
    studentsExpected: number;
    attendanceRate: number;
    attendanceTrend: number; // percentage change
}

export interface RiskStudent {
    student: Student;
    className: string;
    consecutiveAbsences: number;
}

export interface ScheduleItem {
    id: string;
    time: string;
    endTime: string; // inferred or fixed duration
    name: string;
    location: string;
    status: 'active' | 'pending' | 'finished';
    studentCount: number;
}

export interface PendingClass {
    classId: string;
    className: string;
    date: string;
    dateFormatted: string;
    dayOfWeek: string;
}

export const useTeacherDashboardData = () => {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [stats, setStats] = useState<DashboardStats>({
        classesToday: 0,
        studentsExpected: 0,
        attendanceRate: 0,
        attendanceTrend: 0
    });
    
    const [classes, setClasses] = useState<(Class & { student_count: number })[]>([]);
    const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [pendingAttendance, setPendingAttendance] = useState<{ className: string, date: string, count: number } | null>(null);
    const [pendingClasses, setPendingClasses] = useState<PendingClass[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!session?.user) return;

            try {
                setLoading(true);
                const teacherId = session.user.id; // In a real app, this might be profile.id, assuming they are same

                // Parallel data fetching
                const [
                    fetchedClasses,
                    fetchedNotices,
                    attendanceHistory,
                    teacherStudents
                ] = await Promise.all([
                    api.getTeacherClasses(teacherId),
                    api.getNotices(),
                    api.getTeacherAttendanceHistory(teacherId),
                    api.getTeacherStudents(teacherId)
                ]);

                setClasses(fetchedClasses);
                setNotices(fetchedNotices);

                // --- Process Stats ---
                const today = new Date();
                const todayDayName = format(today, 'EEEE', { locale: ptBR }).toLowerCase(); // e.g., 'segunda-feira'
                
                // Map English DB days to Portuguese for comparison if needed, or standardise. 
                // Assuming DB stores days as ['Monday', 'Wednesday'] or ['Segunda', 'Quarta']
                // Let's try to match loosely.
                
                const dayMap: Record<number, string[]> = {
                    0: ['domingo', 'sunday'],
                    1: ['segunda', 'monday'],
                    2: ['terça', 'tuesday'],
                    3: ['quarta', 'wednesday'],
                    4: ['quinta', 'thursday'],
                    5: ['sexta', 'friday'],
                    6: ['sábado', 'saturday']
                };
                
                const currentDayOfWeek = getDay(today);
                const possibleDayNames = dayMap[currentDayOfWeek];

                const classesToday = fetchedClasses.filter(c => 
                    c.days?.some(d => possibleDayNames.some(pd => d.toLowerCase().includes(pd)))
                );
                
                const studentsExpected = classesToday.reduce((acc, curr) => acc + (curr.student_count || 0), 0);

                // Attendance Rate (Last 30 days)
                const last30DaysAttendance = attendanceHistory.filter(a => 
                    new Date(a.date) >= subDays(today, 30)
                );
                
                const totalRecords = last30DaysAttendance.length;
                const presentRecords = last30DaysAttendance.filter(a => a.status === 'present').length;
                const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

                // --- Process Risk Students ---
                const risks: RiskStudent[] = [];
                // Group attendance by student
                const studentAttendance: Record<string, Attendance[]> = {};
                attendanceHistory.forEach(a => {
                    if (!studentAttendance[a.student_id]) studentAttendance[a.student_id] = [];
                    studentAttendance[a.student_id].push(a);
                });

                Object.keys(studentAttendance).forEach(studentId => {
                    // Sort by date desc
                    const records = studentAttendance[studentId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    let consecutive = 0;
                    for (const record of records) {
                        if (record.status === 'absent') {
                            consecutive++;
                        } else {
                            break;
                        }
                    }

                    if (consecutive >= 3) {
                        const studentInfo = teacherStudents.find(s => s.student.id === studentId);
                        if (studentInfo) {
                            risks.push({
                                student: studentInfo.student,
                                className: studentInfo.class.name,
                                consecutiveAbsences: consecutive
                            });
                        }
                    }
                });

                setRiskStudents(risks);

                // --- Process Schedule ---
                const todaysSchedule: ScheduleItem[] = classesToday.map(c => {
                    const startTime = c.time || '00:00';
                    // Mock end time as +1 hour
                    const [hours, minutes] = startTime.split(':').map(Number);
                    const endTime = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    
                    // Determine status
                    const now = new Date();
                    const classTime = new Date();
                    classTime.setHours(hours, minutes, 0, 0);
                    
                    let status: 'active' | 'pending' | 'finished' = 'pending';
                    if (now > classTime && now.getTime() - classTime.getTime() < 3600000) {
                        status = 'active';
                    } else if (now > classTime) {
                        status = 'finished';
                    }

                    return {
                        id: c.id,
                        name: c.name,
                        time: startTime,
                        endTime,
                        location: c.location || 'Pista Principal',
                        status,
                        studentCount: c.student_count
                    };
                }).sort((a, b) => a.time.localeCompare(b.time));

                setSchedule(todaysSchedule);
                
                setStats({
                    classesToday: classesToday.length,
                    studentsExpected,
                    attendanceRate,
                    attendanceTrend: 0 // TODO: Calculate trend if needed
                });

                // --- Process Pending Attendance ---
                // Check all days in the current month up to today
                const monthStart = startOfMonth(today);
                const daysInMonth = eachDayOfInterval({ start: monthStart, end: today });

                const pendingList: PendingClass[] = [];

                // For each day that has passed in the current month
                for (const day of daysInMonth) {
                    // Skip today (aulas de hoje ainda podem acontecer)
                    if (isSameDay(day, today)) continue;

                    const dayOfWeek = getDay(day);
                    const dayStr = format(day, 'yyyy-MM-dd');

                    // Find classes that should have occurred on this day
                    const classesOnDay = fetchedClasses.filter(c => 
                        c.days?.some(d => dayMap[dayOfWeek].some(pd => d.toLowerCase().includes(pd)))
                    );

                    for (const cls of classesOnDay) {
                        // Check if attendance was registered for this class on this day
                        const attendanceForClass = attendanceHistory.filter(a => 
                            a.class_id === cls.id && 
                            (a.date === dayStr || a.date.startsWith(dayStr))
                        );

                        const hasAttendance = attendanceForClass.length > 0;
                        const wasCancelled = attendanceForClass.some(a => a.is_cancelled === true);

                        // Add to pending list only if:
                        // 1. No attendance registered at all
                        // 2. OR attendance exists but was NOT cancelled (shouldn't happen, but defensive)
                        // Skip if: attendance exists AND was cancelled
                        if (!hasAttendance) {
                            pendingList.push({
                                classId: cls.id,
                                className: cls.name,
                                date: dayStr,
                                dateFormatted: format(day, 'dd/MM/yyyy'),
                                dayOfWeek: format(day, 'EEEE', { locale: ptBR })
                            });
                        } else if (hasAttendance && !wasCancelled) {
                            // This case shouldn't normally happen - attendance exists but not cancelled
                            // It means there's real attendance data, so don't show as pending
                            continue;
                        }
                        // If wasCancelled is true, we skip entirely (don't add to pending)
                    }
                }

                setPendingClasses(pendingList);

                // Set the most recent pending class or show total count
                if (pendingList.length > 0) {
                    const mostRecent = pendingList[pendingList.length - 1];
                    setPendingAttendance({
                        className: mostRecent.className,
                        date: format(parseISO(mostRecent.date), 'dd/MM'),
                        count: pendingList.length
                    });
                } else {
                    setPendingAttendance(null);
                } 

            } catch (err) {
                console.error('Error loading teacher dashboard data:', err);
                setError('Falha ao carregar dados do dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [session]);

    return {
        loading,
        error,
        stats,
        classes,
        riskStudents,
        schedule,
        notices,
        pendingAttendance,
        pendingClasses
    };
};

