import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Class {
    id: string;
    name: string;
    level: string;
    teacher_id: string;
    capacity: number;
    days: string[];
    time: string;
    location: string;
    teacher?: {
        full_name: string;
        avatar_url?: string;
    };
}

interface ClassSchedule {
    class: Class;
    dayOfWeek: string;
}

export const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState<Map<string, { status: 'done' | 'cancelled', id: string }>>(new Map());

    // Mapeamento de dias da semana
    const dayMapping: { [key: string]: number } = {
        'Domingo': 0,
        'Segunda': 1,
        'Terça': 2,
        'Quarta': 3,
        'Quinta': 4,
        'Sexta': 5,
        'Sábado': 6
    };

    const levelColors: { [key: string]: string } = {
        'Iniciante': 'bg-blue-400',
        'Intermediário': 'bg-green-400',
        'Avançado': 'bg-purple-400'
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchAttendanceStatus();
    }, [currentDate]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select(`
                    *,
                    teacher:profiles!classes_teacher_id_fkey(full_name, avatar_url)
                `);

            if (error) throw error;
            setClasses(data || []);
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceStatus = async () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        // Ajustar para cobrir dias de outros meses que podem aparecer no grid (opcional, mas bom)
        // Por enquanto, vamos focar no mês atual

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('class_id, date, is_cancelled, id')
                .gte('date', startDateStr)
                .lte('date', endDateStr);

            if (error) throw error;

            const statusMap = new Map<string, { status: 'done' | 'cancelled', id: string }>();
            data?.forEach(record => {
                const key = `${record.class_id}-${record.date}`;
                statusMap.set(key, {
                    status: record.is_cancelled ? 'cancelled' : 'done',
                    id: record.id // Attendance ID, não usado muito aqui mas bom ter
                });
            });

            setAttendanceStatus(statusMap);
        } catch (error) {
            console.error('Erro ao buscar status de chamadas:', error);
        }
    };

    // Gerar dias do mês
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOffset = firstDay.getDay();

        return { daysInMonth, startDayOffset };
    };

    // Verificar se há aulas em um dia específico
    const getClassesForDate = (date: Date): ClassSchedule[] => {
        const dayOfWeek = date.getDay();
        const dayName = Object.keys(dayMapping).find(key => dayMapping[key] === dayOfWeek);
        const dateStr = date.toISOString().split('T')[0];

        if (!dayName) return [];

        return classes
            .filter(cls => {
                const isScheduled = cls.days && cls.days.includes(dayName);
                const hasAttendance = attendanceStatus.has(`${cls.id}-${dateStr}`);
                return isScheduled || hasAttendance;
            })
            .map(cls => ({ class: cls, dayOfWeek: dayName }));
    };

    // Navegar entre meses
    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Formatar data
    const formatDate = (date: Date) => {
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    };

    const formatMonthYear = (date: Date) => {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const { daysInMonth, startDayOffset } = getDaysInMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const selectedDateClasses = getClassesForDate(selectedDate);

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
            <div className="xl:col-span-2 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-text-light">Calendário de Aulas</h1>
                        <p className="text-muted">Selecione um dia para ver os detalhes.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/cadastro"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition-colors"
                        >
                            Nova Turma
                        </Link>
                    </div>
                </div>

                <div className="bg-card-light border border-border-light rounded-xl p-4 flex-grow flex flex-col shadow-sm">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h2 className="text-lg font-bold">{formatMonthYear(currentDate)}</h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    {/* Grid Header */}
                    <div className="grid grid-cols-7 mb-2 border-b border-border-light pb-2">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-muted py-2">{d}</div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="grid grid-cols-7 flex-grow auto-rows-fr">
                        {Array.from({ length: startDayOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-r border-b border-border-light bg-gray-50/50"></div>
                        ))}

                        {days.map(day => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dayClasses = getClassesForDate(date);
                            const uniqueLevels = [...new Set(dayClasses.map(dc => dc.class.level))];

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative p-2 border-r border-b border-border-light min-h-[80px] hover:bg-gray-50 transition-colors cursor-pointer ${isSelected(day) ? 'bg-primary/5 ring-2 ring-inset ring-primary z-10' : ''
                                        } ${isToday(day) ? 'bg-blue-50' : ''}`}
                                >
                                    <span className={`text-sm ${isSelected(day) ? 'font-bold text-primary' : isToday(day) ? 'font-bold text-blue-600' : 'text-text-light'}`}>
                                        {day}
                                    </span>

                                    {/* Events */}
                                    <div className="flex flex-col gap-1 mt-1">
                                        {uniqueLevels.map(level => (
                                            <div
                                                key={level}
                                                className={`h-1.5 w-full rounded-full ${levelColors[level] || 'bg-gray-400'}`}
                                                title={level}
                                            ></div>
                                        ))}
                                        {/* Indicadores de Chamada */}
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {dayClasses.map(({ class: cls }) => {
                                                const dateStr = date.toISOString().split('T')[0];
                                                const key = `${cls.id}-${dateStr}`;
                                                const status = attendanceStatus.get(key);

                                                if (!status) return null;

                                                return (
                                                    <div
                                                        key={key}
                                                        className={`w-2 h-2 rounded-full ${status.status === 'cancelled' ? 'bg-gray-400' : 'bg-green-500'
                                                            }`}
                                                        title={status.status === 'cancelled' ? 'Aula Cancelada' : 'Chamada Realizada'}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex gap-4 text-xs text-muted">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>Iniciante
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>Intermediário
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>Avançado
                        </div>
                        <div className="ml-4 flex items-center gap-2 border-l pl-4 border-gray-300">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>Chamada Feita
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>Cancelada
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Panel */}
            <div className="xl:col-span-1">
                <div className="bg-card-light border border-border-light rounded-xl p-6 h-full shadow-sm flex flex-col">
                    <h2 className="text-2xl font-bold mb-4">{formatDate(selectedDate)}</h2>

                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted">Carregando...</p>
                        </div>
                    ) : selectedDateClasses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">event_busy</span>
                            <p className="text-muted">Nenhuma aula agendada para este dia.</p>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold text-lg mb-4">Aulas do dia</h3>
                            <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                                {selectedDateClasses.map(({ class: cls }) => {
                                    const dateStr = selectedDate.toISOString().split('T')[0];
                                    const key = `${cls.id}-${dateStr}`;
                                    const status = attendanceStatus.get(key);

                                    return (
                                        <div
                                            key={cls.id}
                                            className={`p-4 rounded-lg bg-gray-50 border-l-4 ${cls.level === 'Iniciante' ? 'border-blue-400' :
                                                cls.level === 'Intermediário' ? 'border-green-400' :
                                                    'border-purple-400'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold text-text-light">{cls.name}</p>
                                                    <p className="text-sm text-muted">{cls.time}</p>
                                                    <p className="text-xs text-muted mt-1">
                                                        <span className="material-symbols-outlined text-xs align-middle">location_on</span>
                                                        {cls.location}
                                                    </p>
                                                    {cls.teacher && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {cls.teacher.avatar_url ? (
                                                                <img
                                                                    src={cls.teacher.avatar_url}
                                                                    alt={cls.teacher.full_name}
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-xs text-gray-500">person</span>
                                                                </div>
                                                            )}
                                                            <span className="text-xs text-muted">{cls.teacher.full_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${cls.level === 'Iniciante' ? 'bg-blue-100 text-blue-700' :
                                                        cls.level === 'Intermediário' ? 'bg-green-100 text-green-700' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {cls.level}
                                                    </span>
                                                    {status && (
                                                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.status === 'cancelled'
                                                            ? 'bg-gray-200 text-gray-700'
                                                            : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            <span className="material-symbols-outlined text-[10px]">
                                                                {status.status === 'cancelled' ? 'event_busy' : 'check_circle'}
                                                            </span>
                                                            {status.status === 'cancelled' ? 'Cancelada' : 'Feita'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                to={`/attendance?classId=${cls.id}`} // Corrigido para passar o ID na URL
                                                className={`w-full block text-center py-2 rounded-lg text-sm font-bold transition-colors ${status
                                                    ? 'bg-white border border-primary text-primary hover:bg-primary/5'
                                                    : 'bg-primary text-white hover:bg-primary/90'
                                                    }`}
                                            >
                                                {status ? 'Editar Chamada' : 'Fazer Chamada'}
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};