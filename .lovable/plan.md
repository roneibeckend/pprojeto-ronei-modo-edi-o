# Plano: Corrigir comportamento da funcionalidade de download

O objetivo é permitir que o aluno/cliente realize o download imediato de materiais que já estão processados, eliminando a mensagem de "preparação em breve" quando o arquivo já existe.

## Análise
O arquivo `src/routes/app.materiais.tsx` contém uma função `handleDownload` que utiliza um bloco `switch` para disparar geradores de arquivos locais. Quando o ID do material não coincide com um dos casos conhecidos (ex: "m1", "m2"), o sistema cai no `default`, exibindo uma mensagem informativa de que o material está sendo preparado.

Como agora estamos utilizando um banco de dados para gerenciar esses materiais, e muitos desses itens podem ter URLs de arquivo (`file_url`) ou serem tratados de forma diferente no futuro, precisamos garantir que o sistema valide corretamente se o arquivo existe (seja no banco ou via gerador local) antes de exibir a mensagem de "em breve".

## Ações
1.  **Revisar lógica de `handleDownload`:** Modificar o `switch` para verificar se existe um `file_url` (já tratado) ou se o ID corresponde a algum material que pode ser gerado localmente.
2.  **Validar Estado:** Se o material existir no banco de dados e possuir `file_url`, o download deve ocorrer imediatamente.
3.  **Melhorar Feedback:** Se o material não possuir `file_url` e não for um gerador conhecido, manter a mensagem de "em breve", mas garantir que ela só seja exibida se realmente não houver alternativa para o aluno.

## Validação
1.  Verificar o acesso ao download de materiais existentes no banco de dados.
2.  Testar o comportamento para materiais sem `file_url` e sem gerador, garantindo que o usuário seja informado adequadamente.
