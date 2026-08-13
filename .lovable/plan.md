# Plano de Implementação: Correção de Erro "invalid_type" em Materiais do Canva

Este plano visa corrigir o erro de validação onde o campo `external_url` recebe `null` ao salvar materiais, especialmente os provenientes do Canva.

## Análise do Problema
O erro `invalid_type` ocorre porque o esquema Zod no servidor (em `src/lib/materials.functions.ts`) espera uma `string` (opcional), mas o frontend pode estar enviando `null` quando o campo está vazio ou não foi preenchido. No banco de dados, campos de URL podem aceitar nulos, mas a validação do Zod é rigorosa.

## Alterações Propostas

### 1. Servidor (`src/lib/materials.functions.ts`)
*   Atualizar o validador da função `upsertMaterial` para permitir explicitamente `null` no campo `external_url`.
*   Aproveitar para fazer o mesmo com `file_url`, prevenindo erros semelhantes.

### 2. Frontend (`src/routes/admin.materiais.tsx`)
*   Garantir que, ao inicializar um novo material ou editar um existente, o campo `external_url` seja tratado como uma string vazia `""` em vez de `undefined` ou `null`, se possível.
*   Embora a correção no Zod seja a mais robusta, inicializar o estado corretamente no frontend melhora a consistência.

## Detalhes Técnicos

### Esquema Zod Atualizado
```typescript
external_url: z.string().nullable().optional(),
file_url: z.string().nullable().optional(),
```

## Verificação
1. Tentar salvar um material do tipo CANVA sem preencher a URL (deve falhar amigavelmente ou permitir se não for obrigatório).
2. Tentar salvar um material do tipo CANVA com uma URL válida.
3. Verificar se o erro `invalid_type` para `external_url` desapareceu.
