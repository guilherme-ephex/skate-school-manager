export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  status: 'Matriculado' | 'Pendente';
  classesEnrolled: number;
}

export interface ClassSession {
  id: string;
  name: string;
  time: string;
  studentsCount: number;
  location: string;
  day?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'justified';
}