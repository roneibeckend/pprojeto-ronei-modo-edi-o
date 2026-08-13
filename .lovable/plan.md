# Plano de Implementação: Atualização de WhatsApp no Perfil do Usuário

Este plano descreve as alterações necessárias para permitir que os usuários atualizem seu número de WhatsApp através da página de perfil, garantindo validação correta e persistência no banco de dados.

## Problema
Atualmente, a página `src/routes/app.perfil.tsx` exibe o campo "WhatsApp / Telefone" como `readOnly`, impedindo qualquer atualização por parte do usuário. Além disso, o botão "Salvar" não possui lógica de persistência vinculada aos dados do perfil.

## Alterações Propostas

### 1. Frontend: Tornar o campo editável e implementar lógica de salvamento
No arquivo `src/routes/app.perfil.tsx`:
- Remover o atributo `readOnly` do campo "WhatsApp / Telefone".
- Adicionar estado local para gerenciar o valor do telefone (`newPhone`).
- Implementar uma função `handleSave` que utiliza o cliente Supabase para atualizar a coluna `phone` na tabela `profiles`.
- Adicionar máscaras de entrada simples ou validação básica para garantir que o formato (ex: DDD + Número) seja respeitado.
- Fornecer feedback visual via `sonner` (toast) para sucesso ou erro.

### 2. Backend: Segurança e Integridade
- Verificar se as políticas de RLS (Row Level Security) da tabela `profiles` permitem que o usuário atualize seu próprio registro.
- Como a tabela `profiles` já possui a coluna `phone`, não são necessárias alterações de esquema.

## Detalhes Técnicos
- **Localização do Componente**: `src/routes/app.perfil.tsx`
- **Banco de Dados**: Tabela `public.profiles`, coluna `phone`.
- **Feedback**: Usar `sonner` para mensagens de status.

## Verificação
1. Acessar `/app/perfil`.
2. Digitar um novo número no campo "WhatsApp / Telefone".
3. Clicar em "Salvar".
4. Recarregar a página e confirmar que o novo número persiste.
5. Verificar se uma mensagem de sucesso é exibida.
