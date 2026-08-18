# Plano: Tornar Número de Telefone Obrigatório no Cadastro

Este plano descreve as alterações necessárias para tornar o campo de telefone (WhatsApp) obrigatório durante o registro de novos usuários na plataforma **Ronnei na Veia**.

## Alterações Propostas

### Frontend

#### 1. Rota de Login (`src/routes/login.tsx`)
- Adicionar um novo estado `phone` para armazenar o número de telefone no modo de cadastro.
- Implementar uma função de formatação para o campo de telefone (máscara: `(XX) XXXXX-XXXX`).
- Incluir o campo de entrada visual para o telefone no formulário de cadastro, logo após o campo de nome.
- Atualizar a lógica de submissão (`handleSubmit`) para validar se o telefone foi preenchido.
- Enviar o telefone nos metadados do usuário (`options.data`) durante a chamada `supabase.auth.signUp`.

#### 2. Página de Perfil (`src/routes/app.perfil.tsx`)
- Garantir que a validação de obrigatoriedade também seja refletida na edição de perfil, se necessário, embora o foco principal seja o cadastro.

### Backend (Banco de Dados)

#### 1. Migração SQL
- Embora o Supabase Auth armazene metadados de forma flexível, a tabela `public.profiles` já possui uma coluna `phone`.
- O gatilho `handle_new_user` (ou similar) deve ser verificado para garantir que ele mapeia o campo `phone` dos metadados do Auth para a tabela de perfis.
- Adicionar uma restrição `CHECK` ou `NOT NULL` na coluna `phone` da tabela `profiles` para garantir a integridade dos dados no nível do banco de dados para novos registros.

## Detalhes Técnicos

- **Componente de Input:** Utilizaremos o componente `Phone` da biblioteca `lucide-react` como ícone.
- **Validação:** A validação no frontend impedirá o envio se o campo estiver vazio ou com formato incompleto.
- **Experiência do Usuário:** O erro será exibido via `toast.error("Número de telefone é obrigatório")`.

## Próximos Passos

1. Criar a migração para garantir que a coluna `phone` seja obrigatória para novos perfis.
2. Modificar o arquivo `src/routes/login.tsx` para incluir o campo e a validação.
3. Testar o fluxo de cadastro para confirmar que o bloqueio funciona conforme esperado.
