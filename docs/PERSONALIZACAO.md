# Personalização do Aplicativo - Logo, Nome e Favicon

## Visão Geral
O sistema agora permite personalizar completamente a identidade visual do aplicativo através da página de Configurações no Painel de Administração.

## Funcionalidades Implementadas

### 1. **Nome do Aplicativo**
- O nome configurado aparece:
  - Na barra lateral (desktop e mobile)
  - No título da aba do navegador
  - Em toda a aplicação

### 2. **Logo do Aplicativo**
- A logo configurada aparece:
  - Na barra lateral (desktop e mobile)
  - Ao lado do nome do aplicativo
  - Dimensões recomendadas: 200x200px
  - Formatos aceitos: PNG, JPG, SVG
  - Tamanho máximo: 2MB

### 3. **Favicon** (NOVO)
- O favicon configurado aparece:
  - Na aba do navegador
  - Nos favoritos/bookmarks
  - Em dispositivos iOS (apple-touch-icon)
  - Dimensões recomendadas: 32x32px ou 64x64px
  - Formatos aceitos: PNG, ICO, SVG
  - Tamanho máximo: 1MB

## Como Configurar

### Passo 1: Acessar Configurações
1. Faça login como **Administrador**
2. Navegue para **Administração** no menu lateral
3. Clique na aba **Configurações**

### Passo 2: Configurar Nome
1. No campo "Nome do Aplicativo", digite o nome desejado
2. Exemplo: "Escola de Skate Pro"

### Passo 3: Configurar Logo
1. Clique em "Fazer Upload da Logo"
2. Selecione uma imagem quadrada (recomendado 200x200px)
3. Aguarde o upload completar
4. A prévia será exibida automaticamente

### Passo 4: Configurar Favicon
1. Clique em "Fazer Upload do Favicon"
2. Selecione uma imagem pequena (recomendado 32x32px ou 64x64px)
3. Aguarde o upload completar
4. A prévia será exibida automaticamente

### Passo 5: Salvar
1. Clique em "Salvar Configurações"
2. Aguarde a mensagem de sucesso
3. A página será recarregada automaticamente
4. Todas as alterações serão aplicadas imediatamente

## Observações Importantes

### Atualização Dinâmica
- **Título da Página**: Atualizado automaticamente em todas as páginas
- **Favicon**: Atualizado dinamicamente sem necessidade de limpar cache
- **Logo**: Visível imediatamente após salvar em desktop e mobile

### Compatibilidade Mobile
- Todas as configurações funcionam perfeitamente em dispositivos móveis
- O favicon também funciona como apple-touch-icon para iOS
- A logo é responsiva e se adapta ao tamanho da tela

### Armazenamento
- As imagens são armazenadas no Supabase Storage
- Bucket: `public`
- Pastas:
  - Logos: `logos/`
  - Favicons: `favicons/`

### Recomendações de Design

#### Logo
- Use imagens com fundo transparente (PNG)
- Mantenha proporção quadrada
- Evite textos muito pequenos
- Teste em modo claro e escuro

#### Favicon
- Use cores contrastantes
- Simplifique o design (ícones funcionam melhor)
- Teste em diferentes navegadores
- Considere usar formato ICO para melhor compatibilidade

## Solução de Problemas

### Favicon não aparece
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Feche e abra novamente a aba
3. Verifique se o arquivo foi carregado corretamente

### Logo não aparece
1. Verifique se o formato do arquivo é suportado
2. Confirme que o tamanho não excede 2MB
3. Tente fazer upload novamente

### Título não atualiza
1. Recarregue a página (F5)
2. Verifique se salvou as configurações
3. Aguarde alguns segundos para propagação

## Migração do Banco de Dados

Para habilitar a funcionalidade de favicon, execute o seguinte SQL:

```sql
-- Executar no Supabase SQL Editor
INSERT INTO app_settings (setting_key, setting_value)
VALUES (
    'app_favicon_url',
    ''
)
ON CONFLICT (setting_key) DO NOTHING;
```

Ou execute o arquivo: `sql/add_favicon_setting.sql`

## Arquivos Modificados

### Backend/Database
- `sql/add_favicon_setting.sql` - Nova migração para favicon

### Frontend - Hooks
- `src/hooks/useAppSettings.ts` - Adicionado suporte para faviconUrl
- `src/hooks/usePageMetadata.ts` - Novo hook para atualizar título e favicon

### Frontend - Páginas
- `pages/AppSettings.tsx` - Adicionada seção de upload de favicon
- `App.tsx` - Integrado hook usePageMetadata

### Frontend - HTML
- `index.html` - Adicionado link para favicon padrão

## Benefícios

1. **Profissionalismo**: Aplicativo com identidade visual própria
2. **Reconhecimento**: Fácil identificação nas abas do navegador
3. **Branding**: Reforço da marca em todos os pontos de contato
4. **Flexibilidade**: Fácil atualização sem necessidade de código
5. **Consistência**: Mesma experiência em desktop e mobile
