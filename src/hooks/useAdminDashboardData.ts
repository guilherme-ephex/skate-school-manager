import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    DashboardStats,
    WeeklyAttendanceData,
    ClassDistribution,
    RecentActivity,
    DateRange,
} from '../types/dashboard';
import { getStudentsAtRisk, formatRelativeTime } from '../utils/attendanceUtils';
import { ClassLevel } from '../types/database';

interface UseAdminDashboardDataReturn {
    loading: boolean;
    error: string | null;
    stats: DashboardStats;
    weeklyAttendance: WeeklyAttendanceData[];
    classDistribution: ClassDistribution[];
    recentActivities: RecentActivity[];
    dateRange: DateRange;
    totalActivities: number;
    currentPage: number;
    itemsPerPage: number;
    setCurrentPage: (page: number) => void;
}

const LEVEL_COLORS: Record<ClassLevel, string> = {
    Iniciante: '#3b82f6',
    Intermediário: '#8b5cf6',
    Avançado: '#10b981',
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function useAdminDashboardData(): UseAdminDashboardDataReturn {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        newStudentsThisMonth: 0,
        totalStudents: 0,
        activeClasses: 0,
        riskStudents: 0,
        monthAttendanceRate: 0,
    });
    const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendanceData[]>([]);
    const [classDistribution, setClassDistribution] = useState<ClassDistribution[]>([]);
    const [allActivities, setAllActivities] = useState<RecentActivity[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [
                statsData,
                weeklyData,
                distributionData,
                activitiesData,
            ] = await Promise.all([
                fetchStats(),
                fetchWeeklyAttendance(),
                fetchClassDistribution(),
                fetchRecentActivities(),
            ]);

            setStats(statsData);
            setWeeklyAttendance(weeklyData.data);
            setDateRange(weeklyData.range);
            setClassDistribution(distributionData);
            setAllActivities(activitiesData);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    }

    async function fetchStats(): Promise<DashboardStats> {
        // Get current month start
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch all stats in parallel
        const [
            { count: totalStudents },
            { count: newStudentsThisMonth },
            { count: activeClasses },
            studentsAtRisk,
            monthAttendance,
        ] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthStart),
            supabase.from('classes').select('*', { count: 'exact', head: true }),
            getStudentsAtRisk(),
            fetchMonthAttendanceRate(monthStart),
        ]);

        return {
            totalStudents: totalStudents || 0,
            newStudentsThisMonth: newStudentsThisMonth || 0,
            activeClasses: activeClasses || 0,
            riskStudents: studentsAtRisk.length,
            monthAttendanceRate: monthAttendance,
        };
    }

    async function fetchMonthAttendanceRate(monthStart: string): Promise<number> {
        const { data, error } = await supabase
            .from('attendance')
            .select('status')
            .gte('date', monthStart);

        if (error || !data || data.length === 0) return 0;

        const presentCount = data.filter((record) => record.status === 'present').length;
        const rate = (presentCount / data.length) * 100;

        return Math.round(rate);
    }

    async function fetchWeeklyAttendance(): Promise<{
        data: WeeklyAttendanceData[];
        range: DateRange;
    }> {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const { data, error } = await supabase
            .from('attendance')
            .select('date, status')
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .lte('date', today.toISOString().split('T')[0]);

        if (error || !data) {
            return {
                data: [],
                range: { start: '', end: '' },
            };
        }

        // Group by date
        const groupedByDate: Record<string, { presentes: number; faltas: number }> = {};

        data.forEach((record) => {
            const date = record.date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = { presentes: 0, faltas: 0 };
            }

            if (record.status === 'present') {
                groupedByDate[date].presentes++;
            } else {
                groupedByDate[date].faltas++;
            }
        });

        // Create array for last 7 days
        const weeklyData: WeeklyAttendanceData[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = DAY_NAMES[date.getDay()];

            weeklyData.push({
                name: dayName,
                date: dateStr,
                presentes: groupedByDate[dateStr]?.presentes || 0,
                faltas: groupedByDate[dateStr]?.faltas || 0,
            });
        }

        return {
            data: weeklyData,
            range: {
                start: sevenDaysAgo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                end: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            },
        };
    }

    async function fetchClassDistribution(): Promise<ClassDistribution[]> {
        const { data, error } = await supabase
            .from('classes')
            .select('level');

        if (error || !data) return [];

        // Count by level
        const counts: Record<string, number> = {};
        data.forEach((cls) => {
            counts[cls.level] = (counts[cls.level] || 0) + 1;
        });

        return Object.entries(counts).map(([level, count]) => ({
            name: level,
            value: count,
            color: LEVEL_COLORS[level as ClassLevel] || '#94a3b8',
        }));
    }

    async function fetchRecentActivities(): Promise<RecentActivity[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // For attendance logs, fetch additional details
        const attendanceLogIds = data
            .filter(log => log.entity_type === 'attendance' && log.entity_id)
            .map(log => log.entity_id);

        let attendanceDetails: Record<string, any> = {};
        if (attendanceLogIds.length > 0) {
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select(`
                    id,
                    date,
                    class_id,
                    created_by,
                    classes (
                        name
                    ),
                    profiles:created_by (
                        full_name
                    )
                `)
                .in('id', attendanceLogIds);

            if (attendanceData) {
                attendanceDetails = attendanceData.reduce((acc: Record<string, any>, att: any) => {
                    acc[att.id] = att;
                    return acc;
                }, {});
            }
        }

        const activities = data
            .map((log) => {
                let type: RecentActivity['type'] = 'alert';
                let text = '';
                let icon = 'info';
                let color = 'bg-gray-100 text-gray-600';

                // Parse details if it's a string
                let details = log.details;
                if (typeof details === 'string') {
                    try {
                        details = JSON.parse(details);
                    } catch (e) {
                        details = {};
                    }
                }

                // Get name from details or use fallback
                const getName = () => {
                    if (details?.full_name) return details.full_name;
                    if (details?.name) return details.name;
                    if (log.user_email) return log.user_email.split('@')[0];
                    return null;
                };

                const name = getName();

                // Map entity types and actions to user-friendly messages
                if (log.entity_type === 'students') {
                    if (log.action === 'INSERT') {
                        type = 'enrollment';
                        text = name ? `Aluno registrado: ${name}` : 'Novo aluno registrado';
                        icon = 'person_add';
                        color = 'bg-green-100 text-green-600';
                    } else if (log.action === 'UPDATE') {
                        type = 'student';
                        text = name ? `Dados do aluno ${name} atualizados` : 'Dados de aluno atualizados';
                        icon = 'edit';
                        color = 'bg-blue-100 text-blue-600';
                    } else if (log.action === 'DELETE') {
                        type = 'student';
                        text = name ? `Aluno ${name} removido` : 'Aluno removido do sistema';
                        icon = 'person_remove';
                        color = 'bg-red-100 text-red-600';
                    }
                } else if (log.entity_type === 'classes') {
                    if (log.action === 'INSERT') {
                        type = 'class';
                        text = name ? `Nova turma criada: ${name}` : 'Nova turma criada';
                        icon = 'add_box';
                        color = 'bg-purple-100 text-purple-600';
                    } else if (log.action === 'UPDATE') {
                        type = 'class';
                        text = name ? `Turma ${name} atualizada` : 'Turma atualizada';
                        icon = 'edit';
                        color = 'bg-blue-100 text-blue-600';
                    } else if (log.action === 'DELETE') {
                        type = 'class';
                        text = name ? `Turma ${name} removida` : 'Turma removida';
                        icon = 'delete';
                        color = 'bg-red-100 text-red-600';
                    }
                } else if (log.entity_type === 'profiles') {
                    if (log.action === 'INSERT') {
                        type = 'enrollment';
                        text = name ? `Novo usuário: ${name}` : 'Novo usuário cadastrado';
                        icon = 'person_add';
                        color = 'bg-green-100 text-green-600';
                    } else if (log.action === 'UPDATE') {
                        type = 'student';
                        text = name ? `Perfil de ${name} atualizado` : 'Perfil atualizado';
                        icon = 'edit';
                        color = 'bg-blue-100 text-blue-600';
                    }
                } else if (log.entity_type === 'enrollments') {
                    if (log.action === 'INSERT') {
                        type = 'enrollment';
                        text = name ? `${name} matriculado em turma` : 'Nova matrícula realizada';
                        icon = 'how_to_reg';
                        color = 'bg-green-100 text-green-600';
                    } else if (log.action === 'DELETE') {
                        type = 'alert';
                        text = name ? `${name} removido de turma` : 'Matrícula cancelada';
                        icon = 'person_remove';
                        color = 'bg-orange-100 text-orange-600';
                    }
                } else if (log.entity_type === 'attendance') {
                    type = 'alert';
                    icon = 'fact_check';
                    color = 'bg-blue-100 text-blue-600';
                    
                    // Get detailed attendance information
                    const attDetails = attendanceDetails[log.entity_id];
                    if (attDetails) {
                        const teacherName = attDetails.profiles?.full_name || log.user_email?.split('@')[0] || 'Professor';
                        const className = attDetails.classes?.name || 'Turma';
                        const dateFormatted = new Date(attDetails.date).toLocaleDateString('pt-BR');
                        
                        text = `Chamada registrada: ${className} (${dateFormatted}) por ${teacherName}`;
                    } else {
                        text = 'Chamada registrada';
                    }
                } else {
                    // Generic fallback for unknown types
                    const entityMap: Record<string, string> = {
                        'role_permissions': 'Permissões',
                        'notices': 'Avisos',
                        'audit_logs': 'Logs',
                    };

                    const actionMap: Record<string, string> = {
                        'INSERT': 'criado',
                        'UPDATE': 'atualizado',
                        'DELETE': 'removido',
                    };

                    const entityName = entityMap[log.entity_type] || log.entity_type;
                    const actionName = actionMap[log.action] || log.action.toLowerCase();

                    text = `${entityName} ${actionName}`;
                    icon = 'info';
                    color = 'bg-gray-100 text-gray-600';
                }

                // Skip if no text was generated
                if (!text) {
                    return null;
                }

                return {
                    id: log.id,
                    type,
                    text,
                    time: formatRelativeTime(log.created_at),
                    icon,
                    color,
                };
            })
            .filter((activity): activity is RecentActivity => activity !== null);

        return activities;
    }

    // Calculate paginated activities
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedActivities = allActivities.slice(startIndex, endIndex);

    return {
        loading,
        error,
        stats,
        weeklyAttendance,
        classDistribution,
        recentActivities: paginatedActivities,
        dateRange,
        totalActivities: allActivities.length,
        currentPage,
        itemsPerPage,
        setCurrentPage,
    };
}
