export type UserRole = 'ADMIN' | 'TEACHER';
export type ClassLevel = 'Iniciante' | 'Intermediário' | 'Avançado';
export type AttendanceStatus = 'present' | 'absent' | 'justified';

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    avatar_url: string | null;
    specialty: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
}

export interface Student {
    id: string;
    full_name: string;
    date_of_birth: string | null;
    parent_name: string | null;
    contact_info: string | null; // Keeping for backward compatibility or generic info
    email: string | null;
    phone: string | null;
    parent_email: string | null;
    parent_phone: string | null;
    medical_info: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Class {
    id: string;
    name: string;
    level: ClassLevel;
    teacher_id: string | null;
    capacity: number;
    days: string[] | null;
    time: string | null;
    location: string | null;
    created_at: string;
    updated_at: string;
}

export interface Enrollment {
    id: string;
    student_id: string;
    class_id: string;
    status: string;
    joined_at: string;
}

export interface Attendance {
    id: string;
    class_id: string;
    student_id: string;
    date: string;
    status: AttendanceStatus;
    justification: string | null;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    user_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: any;
    ip_address: string | null;
    created_at: string;
}
