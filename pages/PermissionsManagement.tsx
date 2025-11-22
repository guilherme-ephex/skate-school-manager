import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Permission {
    id: string;
    role: 'ADMIN' | 'TEACHER';
    permission: string;
    enabled: boolean;
}

interface PermissionDisplay {
    key: string;
    label: string;
    description: string;
    adminEnabled: boolean;
    teacherEnabled: boolean;
}

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
    view_dashboard: {
        label: 'Ver Dashboard',
        description: 'Acesso à página principal com estatísticas'
    },
    view_students: {
        label: 'Ver Alunos',
        description: 'Visualizar lista e detalhes dos alunos'
    },
    edit_students: {
        label: 'Editar Alunos',
        description: 'Criar, editar e excluir alunos'
    },
    view_calendar: {
        label: 'Ver Calendário',
        description: 'Visualizar calendário de aulas'
    },
    edit_calendar: {
        label: 'Editar Calendário',
        description: 'Criar e editar eventos no calendário'
    },
    view_attendance: {
        label: 'Ver Chamadas',
        description: 'Visualizar registros de presença'
    },
    edit_attendance: {
        label: 'Editar Chamadas',
        description: 'Fazer e editar chamadas'
    },
    view_history: {
        label: 'Ver Histórico',
        description: 'Acessar histórico de chamadas'
    },
    view_reports: {
        label: 'Ver Relatórios',
        description: 'Acessar relatórios e estatísticas'
    },
    view_turmas: {
        label: 'Ver Turmas',
        description: 'Visualizar lista de turmas (somente leitura)'
    },
    manage_classes: {
        label: 'Gerenciar Turmas',
        description: 'Criar, editar e excluir turmas'
    },
    manage_teachers: {
        label: 'Gerenciar Professores',
        description: 'Gerenciar cadastro de professores'
    },
    manage_permissions: {
        label: 'Gerenciar Permissões',
        description: 'Configurar permissões de usuários'
    }
};

export const PermissionsManagement: React.FC = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('role_permissions')
                .select('*')
                .order('permission');

            if (error) throw error;
            setPermissions(data || []);
            setHasChanges(false);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            alert('Erro ao carregar permissões.');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permissionKey: string, role: 'TEACHER') => {
        setPermissions(prev => prev.map(p =>
            p.permission === permissionKey && p.role === role
                ? { ...p, enabled: !p.enabled }
                : p
        ));
        setHasChanges(true);
    };

    const savePermissions = async () => {
        try {
            setSaving(true);

            // Update only TEACHER permissions (ADMIN permissions are always enabled)
            const teacherPermissions = permissions.filter(p => p.role === 'TEACHER');

            for (const perm of teacherPermissions) {
                const { error } = await supabase
                    .from('role_permissions')
                    .update({ enabled: perm.enabled })
                    .eq('id', perm.id);

                if (error) throw error;
            }

            alert('Permissões atualizadas com sucesso!');
            setHasChanges(false);
            await fetchPermissions();
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Erro ao salvar permissões.');
        } finally {
            setSaving(false);
        }
    };

    const getPermissionDisplay = (): PermissionDisplay[] => {
        const permissionKeys = Object.keys(PERMISSION_LABELS);
        return permissionKeys.map(key => {
            const adminPerm = permissions.find(p => p.permission === key && p.role === 'ADMIN');
            const teacherPerm = permissions.find(p => p.permission === key && p.role === 'TEACHER');

            return {
                key,
                label: PERMISSION_LABELS[key].label,
                description: PERMISSION_LABELS[key].description,
                adminEnabled: adminPerm?.enabled ?? true,
                teacherEnabled: teacherPerm?.enabled ?? false
            };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    const permissionDisplay = getPermissionDisplay();

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">Sobre Permissões</h3>
                        <p className="text-sm text-blue-800">
                            Administradores têm acesso total a todas as funcionalidades (não editável).
                            Use os toggles abaixo para controlar quais funcionalidades os professores podem acessar.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuração de Permissões</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Gerencie o acesso dos professores às funcionalidades do sistema</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-100 uppercase tracking-wider">
                                    Permissão
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-100 uppercase tracking-wider">
                                    Descrição
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-100 uppercase tracking-wider">
                                    Administrador
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-100 uppercase tracking-wider">
                                    Professor
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {permissionDisplay.map(perm => (
                                <tr key={perm.key} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-gray-800 dark:text-white">{perm.label}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-100">{perm.description}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center">
                                            <span className="material-symbols-outlined text-green-600 fill">check_circle</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={perm.teacherEnabled}
                                                onChange={() => togglePermission(perm.key, 'TEACHER')}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {hasChanges && (
                    <div className="p-6 bg-yellow-50 border-t border-yellow-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="font-medium">Você tem alterações não salvas</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchPermissions}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-card-dark border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={savePermissions}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
