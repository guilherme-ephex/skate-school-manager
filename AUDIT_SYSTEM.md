# Sistema de Auditoria - Skate School Manager

## Visão Geral

O sistema de auditoria foi implementado para rastrear todas as ações importantes realizadas no sistema, incluindo criação, atualização e exclusão de registros.

## Estrutura da Tabela `audit_logs`

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos:
- **id**: Identificador único do log
- **user_id**: ID do usuário que realizou a ação
- **user_email**: Email do usuário (para referência mesmo se o usuário for deletado)
- **action**: Tipo de ação (INSERT, UPDATE, DELETE)
- **entity_type**: Tipo de entidade afetada (students, classes, enrollments, etc.)
- **entity_id**: ID da entidade afetada
- **details**: Dados completos da entidade em formato JSON
- **ip_address**: Endereço IP do usuário (para implementação futura)
- **created_at**: Data e hora da ação

## Triggers Automáticos

O sistema possui triggers automáticos que registram mudanças nas seguintes tabelas:
- `students` - Alunos
- `classes` - Turmas
- `enrollments` - Matrículas
- `attendance` - Chamadas
- `profiles` - Perfis de usuários

Sempre que um registro é inserido, atualizado ou deletado nessas tabelas, um log é automaticamente criado.

## Políticas de Segurança (RLS)

- Apenas usuários com role `ADMIN` podem visualizar logs de auditoria
- Apenas usuários com role `ADMIN` podem inserir logs manualmente
- Os triggers funcionam independente das políticas RLS

## Funcionalidades do Painel de Administração

### 1. Gerenciamento de Usuários
- Visualizar todos os usuários do sistema
- Editar informações de usuários (nome, role, telefone, especialidade)
- Deletar usuários
- Visualizar data de cadastro

### 2. Auditoria
- Visualizar todos os logs do sistema
- Filtrar por tipo de ação (INSERT, UPDATE, DELETE)
- Filtrar por tipo de entidade (students, classes, etc.)
- Ver detalhes completos de cada mudança em formato JSON
- Identificar quem fez cada ação e quando

## Como Usar

### Acessar o Painel de Administração
1. Faça login como administrador
2. Clique em "Administração" no menu lateral
3. Escolha entre as abas "Gerenciar Usuários" ou "Auditoria"

### Visualizar Logs
1. Acesse a aba "Auditoria"
2. Use os filtros para encontrar logs específicos
3. Clique em "Ver detalhes" para expandir o JSON completo

### Gerenciar Usuários
1. Acesse a aba "Gerenciar Usuários"
2. Clique no ícone de edição para modificar um usuário
3. Clique no ícone de lixeira para deletar (com confirmação)

## Exemplos de Logs

### Criação de Aluno
```json
{
  "action": "INSERT",
  "entity_type": "students",
  "entity_id": "uuid-do-aluno",
  "user_email": "admin@example.com",
  "details": {
    "full_name": "João Silva",
    "date_of_birth": "2010-05-15",
    "email": "joao@example.com"
  }
}
```

### Atualização de Turma
```json
{
  "action": "UPDATE",
  "entity_type": "classes",
  "entity_id": "uuid-da-turma",
  "user_email": "admin@example.com",
  "details": {
    "name": "Iniciante A",
    "capacity": 15,
    "teacher_id": "uuid-do-professor"
  }
}
```

### Exclusão de Matrícula
```json
{
  "action": "DELETE",
  "entity_type": "enrollments",
  "entity_id": "uuid-da-matricula",
  "user_email": "admin@example.com",
  "details": {
    "student_id": "uuid-do-aluno",
    "class_id": "uuid-da-turma"
  }
}
```

## Manutenção

### Limpeza de Logs Antigos
Para manter a performance, considere criar uma rotina para arquivar ou deletar logs antigos:

```sql
-- Deletar logs com mais de 1 ano
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Monitoramento
Verifique regularmente:
- Tamanho da tabela de logs
- Ações suspeitas ou incomuns
- Padrões de uso do sistema

## Segurança

- Todos os logs são protegidos por RLS (Row Level Security)
- Apenas administradores têm acesso aos logs
- Os logs não podem ser modificados, apenas criados
- Mesmo que um usuário seja deletado, seu email permanece no log para rastreabilidade
