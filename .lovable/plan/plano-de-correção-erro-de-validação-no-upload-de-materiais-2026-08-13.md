# Plano de Correção: Erro de Validação no Upload de Materiais

Este plano visa corrigir o erro `invalid_type` no campo `category` ao salvar materiais na interface administrativa, garantindo que o valor enviado seja sempre uma string válida (ou uma string vazia se não preenchido), conforme esperado pelo validador.

## Problema
Ao submeter o formulário de materiais em `/admin/materiais`, se o campo `category` não for preenchido, ele pode ser enviado como `null` ou `undefined`. O validador Zod na função de servidor `upsertMaterial` espera uma `string`, e embora o banco de dados aceite `null`, o `z.string().optional()` do Zod não aceita `null` explicitamente a menos que `nullable()` seja adicionado ou que o dado seja tratado antes da validação.

## Alterações Propostas

### 1. Frontend: Garantir valores padrão
No arquivo `src/routes/admin.materiais.tsx`:
- Inicializar o estado `editingItem` com `category: ""` ao criar um novo material.
- Garantir que o valor da categoria nunca seja `null` ao chamar a mutação.

### 2. Backend: Flexibilizar a Validação
No arquivo `src/lib/materials.functions.ts`:
- Atualizar o esquema Zod para `category: z.string().nullable().optional()`. Isso permite que o backend aceite valores nulos vindos do frontend, mantendo a compatibilidade com a definição do banco de dados (`string | null`).

## Detalhes Técnicos
- **Localização do Frontend**: `src/routes/admin.materiais.tsx`
- **Localização do Backend**: `src/lib/materials.functions.ts`
- **Validador**: Zod `inputValidator` na função `upsertMaterial`.

## Verificação
1. Tentar criar um novo material sem preencher a categoria.
2. Tentar editar um material existente removendo a categoria.
3. Confirmar que o material é salvo com sucesso sem erros de validação.
