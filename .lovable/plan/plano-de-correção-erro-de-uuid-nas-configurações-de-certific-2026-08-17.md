# Plano de Correção: Erro de UUID nas Configurações de Certificado

O erro `invalid input syntax for type uuid` ocorre porque o sistema está tentando realizar operações de banco de dados (filtros ou junções) usando o título do produto (string comum) em campos que esperam um identificador único (UUID). Este plano detalha as correções para normalizar o banco de dados, corrigir a lógica do servidor e implementar proteções contra novos erros.

## Mudanças

### Backend e Banco de Dados
- **Correção da Base de Dados**: Migração SQL para identificar e remover/corrigir registros na tabela `content_certificates` onde `content_id` não seja um UUID válido.
- **Reforço de Tipagem**: Garantir que as chaves estrangeiras virtuais ou reais na tabela `content_certificates` e `certificates` apontem sempre para IDs (UUID) e nunca para títulos/slugs.
- **Função de Segurança**: Atualizar `getContentCertificate` para validar rigorosamente o formato do `contentId` antes de consultar o banco.

### Funções do Servidor (`src/lib/certificates.functions.ts`)
- **Normalização de Busca**: Garantir que a busca por configurações de certificado use `maybeSingle()` de forma segura e trate erros de sintaxe de UUID.
- **Validação com Zod**: Adicionar refinamento `.uuid()` nas validações de entrada onde o ID é obrigatório.

### Interface Administrativa
- **Proteção do Editor**: Modificar `CertificateEditor.tsx` para garantir que o `contentId` recebido via props seja sempre o ID interno do banco e não o título.
- **Feedback de Erro**: Melhorar a captura de erros no frontend para exibir mensagens amigáveis em vez de falhas brutas de sintaxe de banco.

## Detalhes Técnicos
- Migração para limpar `content_certificates` de IDs inválidos.
- Ajuste no componente `CertificateEditor` para depurar o valor de `contentId` em tempo de execução.
- Atualização das funções `getContentCertificate` e `saveContentCertificate`.

## Verificação
- Acessar a aba de certificados do e-book "50 receitas de espetinhos" e confirmar o carregamento sem erros.
- Tentar salvar uma alteração e verificar a persistência.
- Testar a criação de um novo e-book e configurar seu certificado.
