import { supabase } from '../../lib/supabase';
import { Profile, Student, Class, Enrollment, Attendance, AttendanceStatus, Notice, ContactLog, AppSettings } from '../types/database';

export const api = {
    // Profiles
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data as Profile;
    },

    // Students
    getStudents: async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('status', 'active')
            .order('full_name');
        if (error) throw error;
        return data as Student[];
    },

    createStudent: async (student: Partial<Student>) => {
        const { data, error } = await supabase
            .from('students')
            .insert(student)
            .select()
            .single();
        if (error) throw error;
        return data as Student;
    },

    updateStudent: async (studentId: string, student: Partial<Student>) => {
        const { data, error } = await supabase
            .from('students')
            .update(student)
            .eq('id', studentId)
            .select()
            .single();
        if (error) throw error;
        return data as Student;
    },

    uploadAvatar: async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    },

    // Classes
    getClasses: async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('*, teacher:profiles(full_name)')
            .order('name');
        if (error) throw error;
        return data as (Class & { teacher: { full_name: string } })[];
    },

    createClass: async (classData: Partial<Class>) => {
        const { data, error } = await supabase
            .from('classes')
            .insert(classData)
            .select()
            .single();
        if (error) throw error;
        return data as Class;
    },

    // Enrollments
    enrollStudent: async (studentId: string, classId: string) => {
        const { data, error } = await supabase
            .from('enrollments')
            .insert({ student_id: studentId, class_id: classId })
            .select()
            .single();
        if (error) throw error;
        return data as Enrollment;
    },

    getClassStudents: async (classId: string) => {
        const { data, error } = await supabase
            .from('enrollments')
            .select('student:students(*)')
            .eq('class_id', classId);

        if (error) throw error;
        return data.map((d: any) => d.student) as Student[];
    },

    // Attendance
    getAttendance: async (classId: string, date: string) => {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', classId)
            .eq('date', date);
        if (error) throw error;
        return data as Attendance[];
    },

    saveAttendance: async (records: { student_id: string; class_id: string; date: string; status: AttendanceStatus; justification?: string }[]) => {
        const { data, error } = await supabase
            .from('attendance')
            .upsert(records, { onConflict: 'student_id,class_id,date' })
            .select();
        if (error) throw error;
        return data as Attendance[];
    },

    getStudentClasses: async (studentId: string) => {
        const { data, error } = await supabase
            .from('enrollments')
            .select('class:classes(*)')
            .eq('student_id', studentId);
        if (error) throw error;
        return data.map((d: any) => d.class) as Class[];
    },

    unenrollStudent: async (studentId: string, classId: string) => {
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('student_id', studentId)
            .eq('class_id', classId);
        if (error) throw error;
    },

    // Teacher Dashboard
    getNotices: async () => {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Notice[];
    },

    getTeacherClasses: async (teacherId: string) => {
        const { data, error } = await supabase
            .from('classes')
            .select('*, enrollments(count)')
            .eq('teacher_id', teacherId);
        
        if (error) throw error;
        
        // Map the count correctly
        return data.map(cls => ({
            ...cls,
            student_count: cls.enrollments?.[0]?.count || 0
        })) as (Class & { student_count: number })[];
    },

    getTeacherStudents: async (teacherId: string) => {
        // Get all classes for the teacher first
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacherId);
            
        if (classError) throw classError;
        const classIds = classes.map(c => c.id);
        
        if (classIds.length === 0) return [];

        // Get students enrolled in these classes
        const { data, error } = await supabase
            .from('enrollments')
            .select('student:students(*), class:classes(name, time)')
            .in('class_id', classIds);
            
        if (error) throw error;
        return data as { student: Student, class: { name: string, time: string } }[];
    },

    getTeacherAttendanceHistory: async (teacherId: string) => {
        // Get classes first
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacherId);

        if (classError) throw classError;
        const classIds = classes.map(c => c.id);

        if (classIds.length === 0) return [];

        // Get attendance for these classes
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .in('class_id', classIds)
            .order('date', { ascending: false });

        if (error) throw error;
        return data as Attendance[];
    },

    // Admin - User Management
    createUser: async (userData: {
        email: string;
        password: string;
        full_name: string;
        role: 'ADMIN' | 'TEACHER';
        phone?: string;
        specialty?: string;
        avatar_url?: string;
    }) => {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Você precisa estar autenticado');
        }

        // Call the Edge Function with the correct structure
        const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/super-endpoint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                action: 'createUser',
                data: userData
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erro ao criar usuário');
        }

        return result.profile as Profile;
    },

    getAllProfiles: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Profile[];
    },

    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data as Profile;
    },

    deleteProfile: async (userId: string) => {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        if (error) throw error;
    },

    // Audit Logs
    getAuditLogs: async (limit: number = 100, offset: number = 0) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data;
    },

    getAuditLogsByUser: async (userId: string, limit: number = 50) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    getAuditLogsByEntity: async (entityType: string, entityId: string) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    createAuditLog: async (log: {
        action: string;
        entity_type: string;
        entity_id?: string;
        details?: any;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user?.id,
                user_email: user?.email,
                ...log
            });
        if (error) throw error;
    },

    // Students - with audit logging
    deleteStudent: async (studentId: string) => {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
        if (error) throw error;
    },

    // Classes - with audit logging
    deleteClass: async (classId: string) => {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);
        if (error) throw error;
    },

    // Reports & Analytics
    getAllStudentsWithAttendance: async (startDate?: string, endDate?: string) => {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                enrollments!inner(
                    class:classes(id, name, level, time)
                )
            `)
            .eq('status', 'active');
        
        if (error) throw error;
        return data;
    },

    getAttendanceForPeriod: async (startDate: string, endDate: string) => {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data as Attendance[];
    },

    inactivateStudent: async (studentId: string) => {
        const { data, error } = await supabase
            .from('students')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', studentId)
            .select()
            .single();
        
        if (error) throw error;
        return data as Student;
    },

    inactivateTeacher: async (teacherId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', teacherId)
            .select()
            .single();
        
        if (error) throw error;
        return data as Profile;
    },

    activateTeacher: async (teacherId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', teacherId)
            .select()
            .single();
        
        if (error) throw error;
        return data as Profile;
    },

    createContactLog: async (log: Omit<ContactLog, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('contact_logs')
            .insert(log)
            .select()
            .single();
        
        if (error) throw error;
        return data as ContactLog;
    },

    getContactLogs: async (studentId: string) => {
        const { data, error } = await supabase
            .from('contact_logs')
            .select('*, contacted_by_profile:profiles!contact_logs_contacted_by_fkey(full_name)')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // App Settings
    getAppSettings: async () => {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*');
        
        if (error) throw error;
        return data as AppSettings[];
    },

    getAppSetting: async (key: string) => {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('setting_key', key)
            .single();
        
        if (error) throw error;
        return data as AppSettings;
    },

    updateAppSetting: async (key: string, value: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('app_settings')
            .update({ 
                setting_value: value,
                updated_by: user?.id,
                updated_at: new Date().toISOString()
            })
            .eq('setting_key', key)
            .select()
            .single();
        
        if (error) throw error;
        return data as AppSettings;
    }
};
