# Plano de Implementação: Ajuste no Ranking de Alunos

Este plano descreve as alterações necessárias para ajustar a exibição do ranking de alunos, substituindo o e-mail pelo nome de cadastro e excluindo administradores da contagem.

## Alterações Propostas

### 1. Banco de Dados (PostgreSQL)
*   **Recriar a view `student_ranking`**:
    *   Filtrar usuários que possuem o papel de 'admin' na tabela `user_roles`.
    *   Garantir que o campo `name` retornado seja o nome de cadastro real do perfil.
    *   Manter a lógica de `dense_rank()` baseada em `total_points`.
*   **Permissões**:
    *   Garantir que as permissões de `SELECT` na nova view sejam mantidas para usuários autenticados.

### 2. Frontend (React/TanStack Start)
*   Nenhuma alteração direta no código do frontend é estritamente necessária se a view mantiver os mesmos nomes de colunas (`user_id`, `name`, `avatar_url`, `total_points`, `global_rank`), pois o componente `src/routes/app.progresso.tsx` já utiliza o campo `name`.
*   No entanto, asseguraremos que o componente exiba corretamente o nome (que agora virá filtrado e limpo do banco).

## Detalhes Técnicos

### SQL da View
```sql
CREATE OR REPLACE VIEW public.student_ranking AS
SELECT 
    p.id AS user_id,
    p.name,
    p.avatar_url,
    us.total_points,
    DENSE_RANK() OVER (ORDER BY us.total_points DESC) AS global_rank
FROM profiles p
JOIN user_stats us ON p.id = us.user_id
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE (ur.role IS NULL OR ur.role != 'admin')
ORDER BY us.total_points DESC;

GRANT SELECT ON public.student_ranking TO authenticated;
```

## Verificação
1. Validar via console do banco que administradores não aparecem na view.
2. Acessar a página `/app/progresso` e verificar se os nomes estão corretos e se o ranking reflete apenas alunos.
