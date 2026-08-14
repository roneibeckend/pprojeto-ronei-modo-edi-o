# Plano de Implementação: Filtragem da Vitrine do Aluno

O objetivo deste plano é modificar a vitrine do aluno (página inicial da área do aluno) para que cursos e e-books que já foram adquiridos não sejam mais exibidos na seção "Novidades para você", proporcionando uma experiência de navegação mais limpa e focada em novos conteúdos.

## Mudanças Propostas

### Frontend (Área do Aluno)

1.  **Modificar `src/routes/app.index.tsx`**:
    *   Atualizar a lógica de renderização da lista `showcaseItems`.
    *   Implementar um filtro que remove itens da vitrine se o usuário já estiver matriculado neles (usando o hook `useEnrollments`).
    *   Garantir que itens gratuitos (preço = 0) também sejam considerados como "adquiridos" se a lógica de acesso do sistema assim os tratar, ou manter a consistência com a regra de negócio atual de ocultação apenas de itens pagos já comprados.

## Detalhes Técnicos

*   **Arquivo alvo**: `src/routes/app.index.tsx`.
*   **Lógica de Filtro**:
    ```typescript
    const filteredItems = showcaseItems
      ?.map(item => ({
        ...item,
        isEnrolled: item.type === 'course' 
          ? isEnrolledInCourse(item.id) || (item.price || 0) === 0
          : isEnrolledInEbook(item.id) || (item.price || 0) === 0
      }))
      .filter(item => !item.isEnrolled); // Oculta itens que o aluno já possui
    ```
*   **Impacto**: Esta alteração afeta apenas a interface visual do aluno logado na rota `/app/`. Não altera as tabelas do banco de dados nem a disponibilidade de itens para novos alunos.

## Verificação

1.  Acessar a área do aluno (`/app`).
2.  Verificar se os cursos/e-books já adquiridos (ou gratuitos) desapareceram da seção "Novidades para você".
3.  Confirmar que itens não adquiridos continuam visíveis e disponíveis para compra.
