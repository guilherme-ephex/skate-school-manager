import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { AppSettings as AppSettingsType } from '../src/types/database';
import { supabase } from '../lib/supabase';

export const AppSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appName, setAppName] = useState('Skate School Manager');
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const settings = await api.getAppSettings();
            
            const nameSettings = settings.find(s => s.setting_key === 'app_name');
            const logoSettings = settings.find(s => s.setting_key === 'app_logo_url');

            if (nameSettings?.setting_value) {
                setAppName(nameSettings.setting_value);
            }
            if (logoSettings?.setting_value) {
                setLogoUrl(logoSettings.setting_value);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            alert('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSuccessMessage('');

            await Promise.all([
                api.updateAppSetting('app_name', appName),
                api.updateAppSetting('app_logo_url', logoUrl),
            ]);

            setSuccessMessage('Configurações salvas com sucesso! A página será recarregada.');
            setTimeout(() => {
                setSuccessMessage('');
                window.location.reload(); // Reload to update logo/name in sidebar
            }, 2000);
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        try {
            setUploadingLogo(true);

            // Generate unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('public')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setLogoUrl(urlData.publicUrl);
        } catch (err) {
            console.error('Error uploading logo:', err);
            alert('Erro ao fazer upload da logo. Tente novamente.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoUrl('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-10">{/* Removed max-w since it's inside AdminPanel */}

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <p className="text-green-800 font-bold">{successMessage}</p>
                </div>
            )}

            {/* Settings Form */}
            <div className="bg-card-light rounded-xl border border-border-light shadow-sm p-6 space-y-8">
                {/* App Name Section */}
                <div>
                    <label className="block text-sm font-bold text-text-light mb-2">
                        Nome do Aplicativo
                    </label>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Ex: Skate School Manager"
                        className="w-full px-4 py-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-muted mt-2">
                        Este nome será exibido no topo da barra lateral e em outros locais do sistema.
                    </p>
                </div>

                {/* Logo Section */}
                <div>
                    <label className="block text-sm font-bold text-text-light mb-2">
                        Logomarca do Aplicativo
                    </label>
                    
                    <div className="space-y-4">
                        {/* Logo Preview */}
                        {logoUrl ? (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-border-light">
                                <img 
                                    src={logoUrl} 
                                    alt="Logo do aplicativo" 
                                    className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
                                />
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-text-light">Logo atual</p>
                                    <p className="text-xs text-muted mt-1">Dimensões recomendadas: 200x200px</p>
                                </div>
                                <button
                                    onClick={handleRemoveLogo}
                                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-bold text-sm transition-colors"
                                >
                                    Remover
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-4xl text-muted mb-2">image</span>
                                    <p className="text-sm text-muted">Nenhuma logo configurada</p>
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploadingLogo}
                                className="hidden"
                                id="logo-upload"
                            />
                            <label
                                htmlFor="logo-upload"
                                className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer ${
                                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {uploadingLogo ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                        Fazendo upload...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">upload</span>
                                        {logoUrl ? 'Alterar Logo' : 'Fazer Upload da Logo'}
                                    </>
                                )}
                            </label>
                        </div>

                        <p className="text-xs text-muted">
                            Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-light">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div>
                        <p className="font-bold text-blue-900 mb-2">Sobre as configurações</p>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>As alterações serão aplicadas imediatamente para todos os usuários.</li>
                            <li>A logo será exibida na barra lateral e em relatórios exportados.</li>
                            <li>Utilize uma imagem quadrada para melhor visualização.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};


