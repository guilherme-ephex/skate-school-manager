import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Class, Profile } from '../src/types/database';
import { useAuth } from '../contexts/AuthContext';

export const Turmas: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        level: 'Iniciante',
        teacher_id: '',
        capacity: '',
        days: [] as string[],
        time: '',
        location: ''
    });

    // Fetch classes and teachers
    const fetchClasses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('classes').select('*');
            if (error) throw error;
            setClasses(data as Class[]);
        } catch (err) {
            console.error('Error fetching classes:', err);
            alert('Erro ao carregar turmas.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'TEACHER');
            if (error) throw error;
            setTeachers(data as Profile[]);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const openEditModal = (cls: Class) => {
        setSelectedClass(cls);
        setEditFormData({
            name: cls.name,
            level: cls.level,
            teacher_id: cls.teacher_id,
            capacity: String(cls.capacity),
            days: cls.days,
            time: cls.time,
            location: cls.location
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;
        try {
            const { error } = await supabase
                .from('classes')
                .update({
                    name: editFormData.name,
                    level: editFormData.level,
                    teacher_id: editFormData.teacher_id,
                    capacity: parseInt(editFormData.capacity),
                    days: editFormData.days,
                    time: editFormData.time,
                    location: editFormData.location
                })
                .eq('id', selectedClass.id);
            if (error) throw error;
            alert('Turma atualizada com sucesso!');
            setShowEditModal(false);
            fetchClasses();
        } catch (err) {
            console.error('Error updating class:', err);
            alert('Erro ao atualizar turma.');
        }
    };

    const confirmDelete = (cls: Class) => {
        setSelectedClass(cls);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!selectedClass) return;
        try {
            const { error } = await supabase.from('classes').delete().eq('id', selectedClass.id);
            if (error) throw error;
            alert('Turma deletada com sucesso!');
            setShowDeleteConfirm(false);
            fetchClasses();
        } catch (err) {
            console.error('Error deleting class:', err);
            alert('Erro ao deletar turma.');
        }
    };

    const toggleDay = (day: string) => {
        setEditFormData(prev => {
            const days = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day];
            return { ...prev, days };
        });
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-text-light">Turmas</h1>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => navigate('/register?tab=classes')}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-colors"
                    >
                        Nova Turma
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-8 text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classes.map(cls => (
                        <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h2>
                            <p className="text-sm text-gray-600 mb-1"><strong>Nível:</strong> {cls.level}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>Capacidade:</strong> {cls.capacity}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>Dias:</strong> {cls.days.join(', ')}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>Horário:</strong> {cls.time}</p>
                            <p className="text-sm text-gray-600 mb-1"><strong>Local:</strong> {cls.location}</p>
                            <p className="text-sm text-gray-600 mb-3"><strong>Professor:</strong> {teachers.find(t => t.id === cls.teacher_id)?.full_name || 'Não definido'}</p>
                            {user?.role === 'ADMIN' && (
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => openEditModal(cls)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(cls)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                        Deletar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Editar Turma</h2>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Nome da Turma</span>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    required
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Nível</span>
                                <select
                                    value={editFormData.level}
                                    onChange={e => setEditFormData({ ...editFormData, level: e.target.value })}
                                    className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                >
                                    <option value="Iniciante">Iniciante</option>
                                    <option value="Intermediário">Intermediário</option>
                                    <option value="Avançado">Avançado</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Professor</span>
                                <select
                                    value={editFormData.teacher_id}
                                    onChange={e => setEditFormData({ ...editFormData, teacher_id: e.target.value })}
                                    className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    required
                                >
                                    <option value="">Selecione um professor</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Capacidade Máxima</span>
                                <input
                                    type="number"
                                    value={editFormData.capacity}
                                    onChange={e => setEditFormData({ ...editFormData, capacity: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    required
                                />
                            </label>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-600">Dias da Semana</span>
                                <div className="flex flex-wrap gap-3">
                                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editFormData.days.includes(day)
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Horário</span>
                                <input
                                    type="time"
                                    value={editFormData.time}
                                    onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    required
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Local</span>
                                <input
                                    type="text"
                                    value={editFormData.location}
                                    onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    required
                                />
                            </label>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/80 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-red-50">
                            <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
                            <p className="text-sm text-gray-600">Tem certeza que deseja deletar a turma <strong>{selectedClass.name}</strong>?</p>
                        </div>
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                            >
                                Deletar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Turmas;
