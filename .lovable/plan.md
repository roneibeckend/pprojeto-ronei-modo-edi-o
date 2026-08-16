# Plano de Implementação: Sistema de Certificados Digitais

Este plano detalha a implementação do sistema de certificados para cursos e e-books, incluindo a gestão administrativa e a entrega automática para os alunos.

## Objetivos
- Configuração de certificados por curso/e-book (templates, carga horária, regras).
- Geração automática e manual de certificados.
- Interface de gerenciamento no painel administrativo.
- Exibição e download na área do aluno.

## Etapas de Implementação

### 1. Infraestrutura e API (Backend)
- [x] Criação de `src/lib/certificates.functions.ts` com funções server-side para CRUD de configurações e geração.
- [ ] Implementação de migração SQL para tabelas `certificate_templates`, `certificates` e `content_certificates` (usando transações seguras ou scripts individuais se necessário).
- [ ] Implementação de políticas de RLS para segurança dos dados dos alunos.

### 2. Painel Administrativo
- [x] Criação do componente `src/components/admin/CertificateEditor.tsx` para interface de configuração.
- [x] Integração da aba "Certificados" na gestão de cursos (`src/routes/admin.cursos.tsx`).
- [x] Integração da aba "Certificados" na gestão de e-books (`src/routes/admin.ebooks.tsx`).
- [ ] Adição de funcionalidade de "Gerar Certificado" na visualização de detalhes do aluno.

### 3. Área do Aluno e Visualização
- [ ] Atualização de `src/routes/app.certificados.tsx` para consumir dados reais da tabela `certificates`.
- [ ] Lógica de verificação automática de progresso para disparo de geração de certificado.
- [ ] Implementação de página de verificação pública de certificados.

## Detalhes Técnicos

### Esquema de Banco de Dados
```sql
CREATE TABLE certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    background_url TEXT,
    content_html TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE content_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL UNIQUE,
    content_type TEXT NOT NULL,
    template_id UUID REFERENCES certificate_templates(id),
    is_enabled BOOLEAN DEFAULT true,
    min_progress_percentage INTEGER DEFAULT 100
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    certificate_code TEXT UNIQUE NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT now()
);
```

### Segurança e Compliance
- Uso de `supabaseAdmin` em funções server-side para garantir integridade.
- Verificação de papel `admin` para todas as operações de escrita em configurações.
- RLS garantindo que alunos acessem apenas seus próprios certificados.
