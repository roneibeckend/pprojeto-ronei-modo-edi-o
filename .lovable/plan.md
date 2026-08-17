# Plano de Implementação: Gerenciamento de Modelos de Certificado Personalizados

Adição de funcionalidade para upload, gerenciamento e histórico de templates de certificados customizados por curso ou e-book.

## Alterações

### Backend (Banco de Dados)
- Criada migração para adicionar as colunas `background_url` e `is_default` na tabela `certificate_templates`.
- Configurados privilégios de `GRANT` para garantir acesso via API.

### Server Functions
- Atualizado `src/lib/certificates.functions.ts` com novas funções:
    - `createTemplate`: Cria um novo template com imagem de fundo.
    - `updateTemplate`: Atualiza templates existentes.
    - `deleteTemplate`: Desativa templates.
    - `listTemplates`: Listagem atualizada com ordenação por criação.

### Frontend
- Refatorado `src/components/admin/CertificateEditor.tsx`:
    - Adicionado suporte a upload de arquivos diretamente para o Supabase Storage (`content-covers`).
    - Implementada lógica de "Restaurar Padrão/Anterior".
    - Adicionado preview visual do template selecionado.
    - Correções de tipagem para estabilidade do build.
- Atualizado `src/routes/app.verificar-certificado.tsx`:
    - Adicionado suporte visual para exibir o layout do template no validador público.

## Detalhes Técnicos
- Armazenamento de imagens no bucket `content-covers` com URLs públicas.
- Controle de templates via ID associado em `content_certificates`.
- Garantia de RLS e segurança via `assertAdmin` nas funções de gerenciamento.
