import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Class {
    id: string;
    name: string;
    level: string;
    time: string;
}

interface AttendanceSummary {
    class_id: string;
    date: string;
    is_cancelled: boolean;
    cancelled_reason?: string;
    created_by: string;
    updated_at: string;
    class_name: string;
    class_level: string;
    class_time: string;
    teacher_name: string;
    total_present: number;
    total_absent: number;
    total_justified: number;
}

interface AttendanceHistoryLog {
    id: number;
    attendance_id: string;
    old_status: string | null;
    new_status: string | null;
    old_justification: string | null;
    new_justification: string | null;
    old_is_cancelled: boolean | null;
    new_is_cancelled: boolean | null;
    changed_by: string;
    changed_at: string;
    action: string;
    changer_name?: string;
    changer_avatar?: string;
    student_name?: string;
    student_avatar?: string;
}

export const AttendanceHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<AttendanceSummary[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);

    // Filtros
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    );

    // Modais
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceSummary | null>(null);
    const [auditLogs, setAuditLogs] = useState<AttendanceHistoryLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [selectedClass, startDate, endDate]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name, level, time');

            if (error) throw error;
            setClasses(data || []);
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Construir query base
            let query = supabase
                .from('attendance')
                .select(`
          class_id,
          date,
          is_cancelled,
          cancelled_reason,
          created_by,
          updated_at,
          status,
          classes (
            name,
            level,
            time,
            teacher:profiles!classes_teacher_id_fkey(full_name)
          )
        `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (selectedClass) {
                query = query.eq('class_id', selectedClass);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Agrupar por (class_id, date) para criar resumo
            // Como a tabela attendance tem 1 linha por aluno, precisamos agregar
            const grouped = new Map<string, AttendanceSummary>();

            data?.forEach((record: any) => {
                const key = `${record.class_id}-${record.date}`;

                if (!grouped.has(key)) {
                    grouped.set(key, {
                        class_id: record.class_id,
                        date: record.date,
                        is_cancelled: record.is_cancelled,
                        cancelled_reason: record.cancelled_reason,
                        created_by: record.created_by,
                        updated_at: record.updated_at,
                        class_name: record.classes?.name,
                        class_level: record.classes?.level,
                        class_time: record.classes?.time,
                        teacher_name: record.classes?.teacher?.full_name || 'N/A',
                        total_present: 0,
                        total_absent: 0,
                        total_justified: 0
                    });
                }

                const summary = grouped.get(key)!;
                if (record.status === 'present') summary.total_present++;
                else if (record.status === 'absent') summary.total_absent++;
                else if (record.status === 'justified') summary.total_justified++;
            });

            setHistoryData(Array.from(grouped.values()));

        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            alert('Erro ao carregar histórico de chamadas.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (classId: string, date: string) => {
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from('attendance_history')
                .select(`
          *,
          changer:profiles!attendance_history_changed_by_fkey(full_name, avatar_url),
          student:students!attendance_history_student_id_fkey(full_name, avatar_url)
        `)
                .eq('class_id', classId)
                .eq('date', date)
                .order('changed_at', { ascending: false });

            if (error) throw error;

            setAuditLogs(data.map((log: any) => ({
                ...log,
                changer_name: log.changer?.full_name,
                changer_avatar: log.changer?.avatar_url,
                student_name: log.student?.full_name,
                student_avatar: log.student?.avatar_url
            })) || []);

        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleViewHistory = (summary: AttendanceSummary) => {
        setSelectedAttendance(summary);
        fetchAuditLogs(summary.class_id, summary.date);
        setShowHistoryModal(true);
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('pt-BR');
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-text-light">Histórico de Chamadas</h1>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                    >
                        <option value="">Todas as Turmas</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name} - {cls.level}</option>
                        ))}
                    </select>
                </div>
                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                    />
                </div>
                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                    />
                </div>
                <button
                    onClick={fetchHistory}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors h-[42px]"
                >
                    Filtrar
                </button>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Turma</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Professor</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Resumo</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : historyData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                historyData.map((item, index) => (
                                    <tr key={`${item.class_id}-${item.date}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatDate(item.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.class_name} <span className="text-xs text-gray-400">({item.class_level})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.teacher_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_cancelled ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    Cancelada
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Realizada
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {!item.is_cancelled && (
                                                <div className="flex gap-2 text-xs">
                                                    <span className="text-green-600 font-bold">{item.total_present} P</span>
                                                    <span className="text-red-600 font-bold">{item.total_absent} F</span>
                                                    <span className="text-yellow-600 font-bold">{item.total_justified} J</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewHistory(item)}
                                                className="text-primary hover:text-primary/80 mr-4"
                                                title="Ver Histórico de Alterações"
                                            >
                                                <span className="material-symbols-outlined text-lg">history</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate(`/attendance?classId=${item.class_id}&date=${item.date}`);
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Editar Chamada"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Histórico de Alterações */}
            {showHistoryModal && selectedAttendance && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                Histórico de Alterações - {formatDate(selectedAttendance.date)}
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loadingLogs ? (
                                <div className="text-center py-8 text-gray-500">Carregando logs...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Nenhuma alteração registrada.</div>
                            ) : (
                                <div className="space-y-4">
                                    {auditLogs.map(log => {
                                        const actionLabels: Record<string, string> = {
                                            'created': 'Criado',
                                            'updated': 'Atualizado',
                                            'deleted': 'Excluído',
                                            'INSERT': 'Criado',
                                            'UPDATE': 'Atualizado',
                                            'DELETE': 'Excluído'
                                        };

                                        const statusLabels: Record<string, string> = {
                                            'present': 'Presente',
                                            'absent': 'Falta',
                                            'justified': 'Justificada'
                                        };

                                        return (
                                            <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {formatDateTime(log.changed_at)}
                                                    </span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.action === 'INSERT' || log.action === 'created' ? 'bg-green-100 text-green-800' :
                                                        log.action === 'UPDATE' || log.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {actionLabels[log.action] || log.action}
                                                    </span>
                                                </div>

                                                {/* Aluno com Avatar */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        {log.student_avatar ? (
                                                            <img src={log.student_avatar} alt={log.student_name || 'Aluno'} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-600">
                                                                {log.student_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AL'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-800">
                                                        Aluno: <span className="font-bold">{log.student_name || 'Desconhecido'}</span>
                                                    </p>
                                                </div>

                                                {/* Professor/Usuário com Avatar */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        {log.changer_avatar ? (
                                                            <img src={log.changer_avatar} alt={log.changer_name || 'Sistema'} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-600">
                                                                {log.changer_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SY'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Por: <span className="font-medium">{log.changer_name || 'Sistema'}</span>
                                                    </p>
                                                </div>

                                                <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                                                    {log.old_status !== log.new_status && (
                                                        <div className="flex gap-2">
                                                            <span className="text-gray-500">Status:</span>
                                                            <span className="line-through text-red-400">{statusLabels[log.old_status || ''] || log.old_status || 'N/A'}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="font-bold text-green-600">{statusLabels[log.new_status || ''] || log.new_status || 'N/A'}</span>
                                                        </div>
                                                    )}
                                                    {log.old_is_cancelled !== log.new_is_cancelled && (
                                                        <div className="flex gap-2 mt-1">
                                                            <span className="text-gray-500">Cancelado:</span>
                                                            <span className="line-through text-red-400">{log.old_is_cancelled ? 'Sim' : 'Não'}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="font-bold text-green-600">{log.new_is_cancelled ? 'Sim' : 'Não'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
