import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { Notice } from '../src/types/database';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Notices: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info' as 'maintenance' | 'event' | 'info',
        active: true,
        expires_at: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const data = await api.getAllNotices();
            setNotices(data);
        } catch (err) {
            console.error('Error fetching notices:', err);
            alert('Erro ao carregar avisos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (notice?: Notice) => {
        if (notice) {
            setEditingNotice(notice);
            setFormData({
                title: notice.title,
                content: notice.content,
                type: notice.type,
                active: notice.active,
                expires_at: notice.expires_at ? format(parseISO(notice.expires_at), 'yyyy-MM-dd') : ''
            });
        } else {
            setEditingNotice(null);
            setFormData({
                title: '',
                content: '',
                type: 'info',
                active: true,
                expires_at: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Preencha o título e conteúdo do aviso');
            return;
        }

        setSaving(true);
        try {
            const noticeData = {
                title: formData.title,
                content: formData.content,
                type: formData.type,
                active: formData.active,
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
            };

            if (editingNotice) {
                await api.updateNotice(editingNotice.id, noticeData);
                alert('Aviso atualizado com sucesso!');
            } else {
                await api.createNotice(noticeData);
                alert('Aviso criado com sucesso!');
            }

            setShowModal(false);
            fetchNotices();
        } catch (err) {
            console.error('Error saving notice:', err);
            alert('Erro ao salvar aviso. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noticeId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este aviso?')) {
            return;
        }

        try {
            await api.deleteNotice(noticeId);
            alert('Aviso excluído com sucesso!');
            fetchNotices();
        } catch (err) {
            console.error('Error deleting notice:', err);
            alert('Erro ao excluir aviso. Tente novamente.');
        }
    };

    const handleToggleActive = async (notice: Notice) => {
        try {
            await api.updateNotice(notice.id, { active: !notice.active });
            fetchNotices();
        } catch (err) {
            console.error('Error toggling notice:', err);
            alert('Erro ao atualizar status do aviso.');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'maintenance':
                return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: 'construction' };
            case 'event':
                return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: 'event' };
            default:
                return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-white', border: 'border-gray-200 dark:border-gray-700', icon: 'info' };
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'maintenance':
                return 'Manutenção';
            case 'event':
                return 'Evento';
            default:
                return 'Informação';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-light dark:text-text-dark">Avisos</h1>
                    <p className="text-muted dark:text-muted-dark">Gerencie avisos para os professores visualizarem no dashboard.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Aviso
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <span className="material-symbols-outlined">visibility</span>
                        </div>
                        <span className="text-sm font-bold text-muted dark:text-muted-dark">Avisos Ativos</span>
                    </div>
                    <p className="text-3xl font-black text-text-light dark:text-text-dark">
                        {notices.filter(n => n.active).length}
                    </p>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-100 rounded-lg">
                            <span className="material-symbols-outlined">visibility_off</span>
                        </div>
                        <span className="text-sm font-bold text-muted dark:text-muted-dark">Avisos Inativos</span>
                    </div>
                    <p className="text-3xl font-black text-text-light dark:text-text-dark">
                        {notices.filter(n => !n.active).length}
                    </p>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <span className="material-symbols-outlined">campaign</span>
                        </div>
                        <span className="text-sm font-bold text-muted dark:text-muted-dark">Total de Avisos</span>
                    </div>
                    <p className="text-3xl font-black text-text-light dark:text-text-dark">{notices.length}</p>
                </div>
            </div>

            {/* Notices List */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Todos os Avisos</h2>
                    <p className="text-sm text-muted dark:text-muted-dark">Clique em um aviso para editar</p>
                </div>

                {notices.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">notifications_off</span>
                        <p className="text-gray-500 dark:text-gray-300 font-medium">Nenhum aviso cadastrado ainda.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 text-primary font-bold hover:underline"
                        >
                            Criar primeiro aviso
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-border-light">
                        {notices.map((notice) => {
                            const typeStyle = getTypeColor(notice.type);
                            return (
                                <div
                                    key={notice.id}
                                    className="p-6 hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeStyle.bg} ${typeStyle.text}`}>
                                                    {getTypeName(notice.type)}
                                                </span>
                                                {notice.active ? (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100">
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-1">
                                                {notice.title}
                                            </h3>
                                            <p className="text-sm text-muted dark:text-muted-dark mb-2">{notice.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted dark:text-muted-dark">
                                                <span>
                                                    Criado: {format(parseISO(notice.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                                {notice.expires_at && (
                                                    <span>
                                                        Expira: {format(parseISO(notice.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleActive(notice)}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${notice.active
                                                    ? 'bg-gray-200 text-gray-700 dark:text-white hover:bg-gray-300'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                                title={notice.active ? 'Desativar' : 'Ativar'}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {notice.active ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(notice)}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notice.id)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">
                                {editingNotice ? 'Editar Aviso' : 'Novo Aviso'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-100 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                    Título do Aviso
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Manutenção na Mini Ramp"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                    Conteúdo
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Descreva o aviso..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-3">
                                    Tipo de Aviso
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'info' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'info'
                                            ? 'border-gray-500 bg-gray-50'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-3xl text-gray-600 dark:text-gray-100 mb-2">info</span>
                                        <p className="font-bold text-sm">Informação</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'maintenance' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'maintenance'
                                            ? 'border-yellow-500 bg-yellow-50'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-3xl text-yellow-600 mb-2">construction</span>
                                        <p className="font-bold text-sm">Manutenção</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'event' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'event'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-3xl text-blue-600 mb-2">event</span>
                                        <p className="font-bold text-sm">Evento</p>
                                    </button>
                                </div>
                            </div>

                            {/* Expires At */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                    Data de Expiração (Opcional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                                    Deixe em branco para aviso sem data de expiração
                                </p>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">Status do Aviso</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-100">Avisos ativos aparecem no dashboard dos professores</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={saving}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-gray-800 font-bold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">save</span>
                                        {editingNotice ? 'Atualizar' : 'Criar'} Aviso
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

