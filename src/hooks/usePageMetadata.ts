import { useEffect } from 'react';
import { useAppSettings } from './useAppSettings';

/**
 * Hook para atualizar dinamicamente o título da página e o favicon
 * com base nas configurações do aplicativo
 */
export const usePageMetadata = () => {
    const { appName, faviconUrl, loading } = useAppSettings();

    useEffect(() => {
        if (loading) return;

        // Atualizar título da página
        if (appName) {
            document.title = appName;
        }

        // Atualizar favicon
        if (faviconUrl) {
            // Remover favicons existentes
            const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
            existingFavicons.forEach(favicon => favicon.remove());

            // Criar novo favicon
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = faviconUrl;
            document.head.appendChild(link);

            // Adicionar também apple-touch-icon para dispositivos iOS
            const appleTouchIcon = document.createElement('link');
            appleTouchIcon.rel = 'apple-touch-icon';
            appleTouchIcon.href = faviconUrl;
            document.head.appendChild(appleTouchIcon);
        }
    }, [appName, faviconUrl, loading]);
};
