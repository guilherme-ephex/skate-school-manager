import { supabase } from '../../lib/supabase';
import { Attendance } from '../types/database';

/**
 * Calculate consecutive absences for a student in a specific class
 * @param studentId - The student's ID
 * @param classId - The class ID (optional, if not provided checks all classes)
 * @returns Number of consecutive absences from most recent date
 */
export async function calculateConsecutiveAbsences(
    studentId: string,
    classId?: string
): Promise<number> {
    try {
        let query = supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('date', { ascending: false });

        if (classId) {
            query = query.eq('class_id', classId);
        }

        const { data, error } = await query;

        if (error) throw error;
        if (!data || data.length === 0) return 0;

        let consecutiveAbsences = 0;

        // Count consecutive absences from most recent date
        for (const record of data as Attendance[]) {
            if (record.status === 'absent' || record.status === 'justified') {
                consecutiveAbsences++;
            } else if (record.status === 'present') {
                // Stop counting when we hit a presence
                break;
            }
        }

        return consecutiveAbsences;
    } catch (error) {
        console.error('Error calculating consecutive absences:', error);
        return 0;
    }
}

/**
 * Get all students at risk of evasion (3+ consecutive absences)
 * @returns Array of students with their consecutive absence count
 */
export async function getStudentsAtRisk(): Promise<
    Array<{
        studentId: string;
        studentName: string;
        consecutiveAbsences: number;
    }>
> {
    try {
        // Get all students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, full_name');

        if (studentsError) throw studentsError;
        if (!students) return [];

        const studentsAtRisk = [];

        // Check each student for consecutive absences
        for (const student of students) {
            const absences = await calculateConsecutiveAbsences(student.id);
            if (absences >= 3) {
                studentsAtRisk.push({
                    studentId: student.id,
                    studentName: student.full_name,
                    consecutiveAbsences: absences,
                });
            }
        }

        return studentsAtRisk;
    } catch (error) {
        console.error('Error getting students at risk:', error);
        return [];
    }
}

/**
 * Format a relative time string (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return past.toLocaleDateString('pt-BR');
}
