# Plano de Correção: Modelo de IA para Geração de Capítulos

O sistema está apresentando erro 400 ao tentar gerar capítulos porque o modelo `google/gemini-2.0-flash-exp` não é mais válido ou aceito pelo gateway. Atualizaremos para modelos estáveis recomendados.

## 1. Identificação
- Arquivo: `src/lib/ebook-ai.functions.ts`
- Função: `generateChaptersForModules` (linha 111+) e `generateEbook` (linha 50+).

## 2. Alterações
- Modificar a função `generateChaptersForModules` para usar o modelo `google/gemini-2.0-flash` (ou `google/gemini-1.5-flash` conforme disponibilidade comum). Dado o pedido do usuário para priorizar `google/gemini-2.5-flash` (embora a versão estável atual seja 1.5 ou 2.0 dependendo do provider, seguiremos a lista fornecida pelo usuário).
- **Nota**: A lista fornecida pelo usuário menciona `google/gemini-2.5-flash`. Vou usar esse modelo conforme solicitado.
- Também atualizaremos a função `generateEbook` que está usando um modelo inexistente `google/gemini-3.6-flash` para garantir consistência.

## 3. Implementação
- Alterar linha 150: de `google/gemini-2.0-flash-exp` para `google/gemini-1.5-flash` (ou o solicitado `google/gemini-2.5-flash`).
- Alterar linha 70: de `google/gemini-3.6-flash` para `google/gemini-1.5-flash`.

## 4. Validação
- O build deve passar sem erros.
- A função de geração de capítulos deve retornar JSON válido sem erro 400.
