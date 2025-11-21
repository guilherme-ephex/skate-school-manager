import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { Profile, AuditLog } from '../src/types/database';
import { PermissionsManagement } from './PermissionsManagement';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'permissions'>('users');
    const [users, setUsers] = useState<Profile[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [editFormData, setEditFormData] = useState({
        full_name: '',
        role: 'TEACHER' as 'ADMIN' | 'TEACHER',
        phone: '',
        specialty: ''
    });
    const [createFormData, setCreateFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'TEACHER' as 'ADMIN' | 'TEACHER',
        phone: '',
        specialty: ''
    });
    const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null);
    const [createAvatarPreview, setCreateAvatarPreview] = useState<string>('');
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchAuditLogs();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getAllProfiles();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs(200);
            setAuditLogs(data as AuditLog[]);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            alert('Erro ao carregar logs de auditoria.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCreateAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCreateAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let avatarUrl = '';
            if (createAvatarFile) {
                avatarUrl = await api.uploadAvatar(createAvatarFile);
            }

            await api.createUser({
                ...createFormData,
                avatar_url: avatarUrl
            });
            alert('Usuário criado com sucesso!');
            setShowCreateModal(false);
            setCreateFormData({
                email: '',
                password: '',
                full_name: '',
                role: 'TEACHER',
                phone: '',
                specialty: ''
            });
            setCreateAvatarFile(null);
            setCreateAvatarPreview('');
            fetchUsers();
        } catch (error: any) {
            console.error('Error creating user:', error);
            alert(`Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const handleEditUser = (user: Profile) => {
        setSelectedUser(user);
        setEditFormData({
            full_name: user.full_name || '',
            role: user.role,
            phone: user.phone || '',
            specialty: user.specialty || ''
        });
        setEditAvatarPreview(user.avatar_url || '');
        setEditAvatarFile(null);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            let avatarUrl = selectedUser.avatar_url;
            if (editAvatarFile) {
                avatarUrl = await api.uploadAvatar(editAvatarFile);
            }

            await api.updateProfile(selectedUser.id, {
                ...editFormData,
                avatar_url: avatarUrl
            });
            alert('Usuário atualizado com sucesso!');
            setShowEditModal(false);
            setEditAvatarFile(null);
            setEditAvatarPreview('');
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Erro ao atualizar usuário.');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            await api.deleteProfile(userToDelete.id);
            alert('Usuário deletado com sucesso!');
            setShowDeleteConfirm(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao deletar usuário.');
        }
    };

    const confirmDelete = (user: Profile) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'INSERT': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'students': return 'person';
            case 'classes': return 'groups';
            case 'enrollments': return 'school';
            case 'attendance': return 'check_circle';
            case 'profiles': return 'admin_panel_settings';
            default: return 'description';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredLogs = auditLogs.filter(log => {
        const actionMatch = filterAction === 'all' || log.action === filterAction;
        const entityMatch = filterEntity === 'all' || log.entity_type === filterEntity;
        return actionMatch && entityMatch;
    });

    const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
    const uniqueEntities = Array.from(new Set(auditLogs.map(log => log.entity_type)));

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800">Painel de Administração</h1>
                <p className="text-gray-500">Gerencie usuários e visualize logs de auditoria do sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'users'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">group</span>
                    Gerenciar Usuários
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'audit'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">history</span>
                    Auditoria
                </button>
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'permissions'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">lock</span>
                    Permissões
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Usuários do Sistema</h2>
                            <p className="text-sm text-gray-500">Total: {users.length} usuários</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-900 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Criar Usuário
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Usuário</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Função</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Telefone</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Especialidade</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cadastro</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-400">person</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{user.full_name || 'Sem nome'}</p>
                                                        <p className="text-sm text-gray-500">{user.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={user.role}
                                                    onChange={async (e) => {
                                                        const newRole = e.target.value as 'ADMIN' | 'TEACHER';
                                                        if (confirm(`Tem certeza que deseja alterar a função de ${user.full_name} para ${newRole === 'ADMIN' ? 'Administrador' : 'Professor'}?`)) {
                                                            try {
                                                                await api.updateProfile(user.id, { role: newRole });
                                                                fetchUsers();
                                                            } catch (error) {
                                                                console.error('Error updating role:', error);
                                                                alert('Erro ao atualizar função.');
                                                            }
                                                        }
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 ${user.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-700 focus:ring-purple-500'
                                                        : 'bg-blue-100 text-blue-700 focus:ring-blue-500'
                                                        }`}
                                                >
                                                    <option value="TEACHER">Professor</option>
                                                    <option value="ADMIN">Administrador</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.specialty || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(user)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        title="Deletar"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Filtrar por Ação</label>
                                <select
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                >
                                    <option value="all">Todas as ações</option>
                                    {uniqueActions.map(action => (
                                        <option key={action} value={action}>{action}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Filtrar por Entidade</label>
                                <select
                                    value={filterEntity}
                                    onChange={(e) => setFilterEntity(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                >
                                    <option value="all">Todas as entidades</option>
                                    {uniqueEntities.map(entity => (
                                        <option key={entity} value={entity}>{entity}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Logs de Auditoria</h2>
                            <p className="text-sm text-gray-500">Mostrando {filteredLogs.length} de {auditLogs.length} registros</p>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center">
                                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {filteredLogs.map(log => (
                                    <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-gray-600">
                                                    {getEntityIcon(log.entity_type)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionBadgeColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                                            {log.entity_type}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                                        {formatDate(log.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    <span className="font-medium">Usuário:</span> {log.user_email || 'Sistema'}
                                                </p>
                                                {log.entity_id && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <span className="font-medium">ID da Entidade:</span> {log.entity_id}
                                                    </p>
                                                )}
                                                {log.details && (
                                                    <details className="mt-2">
                                                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                                                            Ver detalhes
                                                        </summary>
                                                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">
                                        Nenhum log encontrado com os filtros selecionados.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <PermissionsManagement />
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Criar Novo Usuário</h2>
                            <p className="text-sm text-gray-500">Preencha os dados para criar um novo usuário no sistema.</p>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Email</span>
                                <input
                                    type="email"
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </label>

                            {/* Avatar Upload */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Foto do Perfil</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                        {createAvatarPreview ? (
                                            <img src={createAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-400 text-3xl">person</span>
                                        )}
                                    </div>
                                    <label className="flex-1 cursor-pointer">
                                        <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors text-center">
                                            {createAvatarFile ? 'Trocar Foto' : 'Selecionar Foto'}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCreateAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Senha</span>
                                <input
                                    type="password"
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    required
                                    minLength={6}
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Nome Completo</span>
                                <input
                                    type="text"
                                    value={createFormData.full_name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Função</span>
                                <select
                                    value={createFormData.role}
                                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'ADMIN' | 'TEACHER' })}
                                    className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                >
                                    <option value="TEACHER">Professor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Telefone</span>
                                <input
                                    type="tel"
                                    value={createFormData.phone}
                                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    placeholder="(00) 00000-0000"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Especialidade</span>
                                <input
                                    type="text"
                                    value={createFormData.specialty}
                                    onChange={(e) => setCreateFormData({ ...createFormData, specialty: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    placeholder="Ex: Skate Street"
                                />
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors"
                                >
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Editar Usuário</h2>
                            <p className="text-sm text-gray-500">Atualize as informações do usuário.</p>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Nome Completo</span>
                                <input
                                    type="text"
                                    value={editFormData.full_name}
                                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </label>

                            {/* Avatar Upload */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Foto do Perfil</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                        {editAvatarPreview ? (
                                            <img src={editAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-400 text-3xl">person</span>
                                        )}
                                    </div>
                                    <label className="flex-1 cursor-pointer">
                                        <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors text-center">
                                            {editAvatarFile ? 'Trocar Foto' : 'Selecionar Foto'}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Função</span>
                                <select
                                    value={editFormData.role}
                                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'ADMIN' | 'TEACHER' })}
                                    className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                >
                                    <option value="TEACHER">Professor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Telefone</span>
                                <input
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    placeholder="(00) 00000-0000"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-gray-600">Especialidade</span>
                                <input
                                    type="text"
                                    value={editFormData.specialty}
                                    onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary"
                                    placeholder="Ex: Skate Street"
                                />
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && userToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-red-50">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
                                    <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Tem certeza que deseja deletar o usuário <strong>{userToDelete.full_name}</strong>?
                            </p>
                            <p className="text-sm text-gray-500">
                                Todos os dados relacionados a este usuário serão removidos permanentemente.
                            </p>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setUserToDelete(null);
                                }}
                                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
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
