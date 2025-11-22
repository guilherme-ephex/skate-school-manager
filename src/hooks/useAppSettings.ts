import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AppSettingsData {
    appName: string;
    logoUrl: string;
    loading: boolean;
}

export function useAppSettings(): AppSettingsData {
    const [appName, setAppName] = useState('Skate School Manager');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
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
            console.error('Error loading app settings:', err);
            // Keep default values
        } finally {
            setLoading(false);
        }
    };

    return { appName, logoUrl, loading };
}

