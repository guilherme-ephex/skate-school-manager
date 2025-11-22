export interface DashboardStats {
    newStudentsThisMonth: number;
    totalStudents: number;
    activeClasses: number;
    riskStudents: number;
    monthAttendanceRate: number;
}

export interface WeeklyAttendanceData {
    name: string; // Day name (Seg, Ter, etc)
    date: string; // Actual date
    presentes: number;
    faltas: number;
}

export interface ClassDistribution {
    name: string; // Iniciante, Intermediário, Avançado
    value: number; // Number of classes
    color: string;
}

export interface RecentActivity {
    id: string;
    type: 'enrollment' | 'class' | 'student' | 'alert';
    text: string;
    time: string;
    icon: string;
    color: string;
}

export interface DateRange {
    start: string;
    end: string;
}
