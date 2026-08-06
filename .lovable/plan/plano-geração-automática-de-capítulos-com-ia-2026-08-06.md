# Plano: Geração Automática de Capítulos com IA

O objetivo é permitir que o administrador gere sugestões de capítulos para módulos já existentes em um e-book usando IA.

## 1. Backend (Server Function)
- Criar a função `generateChaptersForModules` em `src/lib/ebook-ai.functions.ts`.
- A função receberá o título do e-book e a lista de módulos (nomes e IDs).
- Usará o `ai.gateway.lovable.dev` para solicitar sugestões de 3 a 5 capítulos por módulo.
- Retornará um JSON estruturado.

## 2. Frontend (Componente de Edição)
- Atualizar `src/components/admin/EbookChaptersEditor.tsx`.
- Adicionar um botão "Sugerir Capítulos com IA" na seção de Capítulos.
- Implementar um modal de revisão (`ChaptersSuggestionModal`) que exibe as sugestões da IA por módulo.
- Permitir que o usuário selecione quais capítulos deseja importar.
- Ao confirmar, salvar os novos capítulos no banco de dados via Supabase (respeitando a ordem e associação aos módulos).

## 3. Validação
- Verificar se a IA gera títulos coerentes com o nicho (espetinhos/gastronomia).
- Garantir que o `order_index` seja calculado corretamente para não sobrescrever capítulos existentes.
- Testar a navegação para os novos capítulos gerados.
