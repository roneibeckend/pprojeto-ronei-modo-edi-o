# Plano de Auditoria Funcional Completa

Este plano detalha a estratégia para realizar uma auditoria real de ponta a ponta na aplicação, validando comportamentos, persistência, permissões e segurança.

## Etapa 1: Mapeamento e Matriz de Testes
Criar um inventário completo de rotas, modais, ações e permissões.

| Área | Função | Quem pode usar | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **Auth** | Login/Logout | Todos | Acesso seguro e persistência de sessão |
| **App (Aluno)** | Ver Cursos | Aluno/Admin | Listar apenas cursos adquiridos/disponíveis |
| **App (Aluno)** | Assistir Aula | Aluno/Admin | Player funcional, registro de progresso |
| **App (Aluno)** | Ler Ebook | Aluno/Admin | Leitor ABNT, progresso de leitura |
| **App (Aluno)** | Certificados | Aluno/Admin | Gerar PDF após 100% de conclusão |
| **Admin** | Gestão de Cursos | Admin/Manager | CRUD completo de módulos e aulas |
| **Admin** | Gestão de Ebooks | Admin/Manager | Editor visual, upload de PDF/DOCX |
| **Admin** | Gestão de Alunos | Admin/Manager | Visualizar e editar perfis, gerenciar matrículas |
| **Admin** | Equipe | Admin | Promover usuários a colaboradores |
| **Admin** | Receitas | Admin | Integração Asaas, cálculo de impostos/taxas |
| **Afiliados** | Dashboard | Aluno/Admin | Links únicos, rastreamento de cliques e vendas |

## Etapa 2: Auditoria de Rotas e Navegação
*   **Acesso Direto:** Verificar se as URLs funcionam sem depender de cliques no menu.
*   **Estado de Carregamento:** Identificar "telas brancas" ou loops infinitos.
*   **Responsividade:** Testar cada rota em modo Mobile (9:16) e Desktop.

## Etapa 3: Auditoria de Autenticação e Sessão
*   **Fluxo de Registro:** Validar mensagens de erro para e-mails duplicados ou senhas fracas.
*   **Persistência:** Garantir que o usuário permaneça logado após o reload da página.
*   **Segurança de Rota:** Tentar acessar `/admin` com um usuário logado sem permissão (aluno).

## Etapa 4: Auditoria de CRUD e Persistência Real
Testar fluxos completos com verificação no banco de dados (via `psql` ou logs):
1.  **Criação de Curso/Aula:** Verificar se os dados salvos persistem após F5.
2.  **Edição:** Alterar um título e confirmar a mudança em tempo real e no banco.
3.  **Progresso:** Assistir a um vídeo e confirmar que o progresso é mantido ao trocar de página.
4.  **Upload de Materiais:** Fazer upload de um arquivo real e tentar baixá-lo.

## Etapa 5: Auditoria de Integrações e Financeiro
*   **Checkout Asaas:** Simular a geração de um link de pagamento (modal).
*   **Webhooks:** Verificar se o sistema está preparado para receber notificações de pagamento.
*   **E-mails:** Testar o disparo de notificações via Resend (se as chaves estiverem presentes).

## Etapa 6: Auditoria de Isolamento (Usuário A vs Usuário B)
*   **Matrículas:** Confirmar que o Aluno A não tem acesso aos cursos do Aluno B.
*   **Dados Privados:** Tentar acessar o perfil ou certificados de outro usuário via ID na URL.

---
**Nota Técnica:** A auditoria será realizada utilizando scripts Playwright em ambiente sandbox para capturar evidências visuais e logs de console em cada etapa crítica.
