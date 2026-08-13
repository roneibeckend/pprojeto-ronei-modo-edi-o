# Plano de Correção de Integridade de Perfil

O objetivo deste plano é garantir que as informações exibidas no perfil do aluno sejam exclusivamente aquelas fornecidas durante o registro, eliminando dados padrão ou vazamentos de outros usuários.

## Alterações Propostas

### 1. Desvincular Dados Mockados (Frontend)
- **Arquivo:** `src/routes/app.perfil.tsx`
- **Ação:** Removida a dependência do objeto `student` de `src/lib/platform-data.ts`.
- **Implementação:** O perfil agora carrega dados em tempo real da tabela `profiles` do banco de dados e as ordens da tabela `course_enrollments`, filtrando estritamente pelo ID do usuário autenticado (`user.id`).

### 2. Sincronização de Estatísticas (Banco de Dados)
- **Ação:** As colunas `streak` e `lessons_watched` serão integradas à tabela `profiles` (ou `user_stats`) para garantir que novos usuários comecem com valor `0` e não herdem valores globais ou simulados.

### 3. Melhoria na Privacidade e Exibição
- **Campos:**
    - **Nome:** Exibirá `profile.full_name`. Se vazio, usa o e-mail como fallback amigável.
    - **WhatsApp:** Exibirá `profile.phone`. Se ausente, mostrará "Não informado" em vez de um número padrão.
    - **E-mail:** Exibirá o e-mail real do usuário autenticado via `auth.users`.
    - **Data de Cadastro:** Formatação correta da coluna `created_at` da tabela `profiles`.
    - **Pedidos:** A listagem foi corrigida para buscar apenas registros em `course_enrollments` onde `user_id` corresponde ao usuário atual, garantindo que um novo cadastro veja sua lista vazia inicialmente.

### 4. Bloqueio de Edição Indevida
- Os campos no perfil foram marcados como `readOnly` para evitar que alterações locais não persistidas criem confusão, até que o fluxo de atualização (`Salvar`) seja totalmente implementado com persistência no banco.

## Detalhes Técnicos
- Uso do hook `useAuth` para identificação segura do usuário.
- Substituição de `format` do `date-fns` para exibir datas brasileiras (`pt-BR`).
- Ajuste nas queries do Supabase para evitar o erro de colunas inexistentes (`enrolled_at` -> `created_at`).

---
Este plano resolve a inconsistência de dados apresentada, garantindo uma experiência personalizada e privada para cada novo aluno.