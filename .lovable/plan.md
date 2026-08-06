# Plano: Gerenciamento de Certificados

Este plano detalha a implementação da funcionalidade de visualização, download e impressão de certificados.

## 1. Infraestrutura de Dados (`src/lib/platform-data.ts`)
- Garantir que a lista de certificados esteja sincronizada com o progresso dos cursos.
- Adicionar lógica para marcar um certificado como `unlocked: true` quando o progresso do curso atingir 100%.

## 2. Interface do Usuário (`src/routes/app.certificados.tsx`)
- A rota `/app/certificados` já existe no projeto com uma implementação base.
- **Melhorias Necessárias**:
    - Garantir que a lista de certificados reflita dinamicamente o progresso dos cursos em `src/lib/platform-data.ts`.
    - Implementar a função de impressão (utilizando `window.print()` ou preparando o componente para impressão via CSS).
    - Melhorar o feedback visual de download e geração de PDF.

## 3. Integração no Menu (`src/components/platform/Shell.tsx`)
- O item "Certificados" já está presente no `navGroups`, apontando para `/app/certificados`.
- Validar se o ícone e o rótulo estão consistentes com o pedido.

## 4. Funcionalidade de Impressão
- Adicionar um botão "Imprimir" no modal do certificado.
- Criar um estilo CSS `@media print` para garantir que apenas o certificado seja impresso em alta qualidade, ocultando elementos de UI (botões, fundo preto, etc).

## 5. Automação de Geração
- O sistema já possui lógica para exibir "bloqueado" se o curso não estiver 100%.
- Vou ajustar a lógica para que o certificado "Espetinho Lucrativo: Técnicas Avançadas" apareça como desbloqueado (já que simulei progresso 100% no passo anterior).

---
**Resultado**: Uma área centralizada onde o aluno vê suas conquistas, podendo baixar o PDF oficial ou imprimir diretamente.