-- Adiciona configuração de favicon nas app_settings
-- Este script adiciona a opção de configurar o favicon do aplicativo

-- Inserir configuração de favicon se não existir
INSERT INTO app_settings (setting_key, setting_value)
VALUES (
    'app_favicon_url',
    ''
)
ON CONFLICT (setting_key) DO NOTHING;

-- Comentário: Esta configuração permite que os administradores
-- personalizem o favicon que aparece na aba do navegador
