-- Adiciona o template de e-mail para novas aulas ao vivo
INSERT INTO public.email_templates (name, subject, content_html, content_text, variables)
VALUES (
  'nova_aula_ao_vivo',
  'Nova Aula ao Vivo Agendada: {{title}}',
  '<html><body style="font-family: sans-serif; background-color: #000; color: #fff; padding: 20px;">
    <h1 style="color: #ff6a00;">Olá {{name}}!</h1>
    <p>Uma nova aula ao vivo foi agendada: <strong>{{title}}</strong></p>
    <p><strong>Data:</strong> {{date}}</p>
    <p><strong>Descrição:</strong> {{description}}</p>
    <div style="margin-top: 30px;">
      <a href="{{link}}" style="background-color: #ff6a00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">ACESSAR AULA AO VIVO</a>
    </div>
    <p style="margin-top: 40px; color: #666; font-size: 12px;">Você recebeu este e-mail porque é um aluno da nossa plataforma.</p>
  </body></html>',
  'Olá {{name}}! Uma nova aula ao vivo foi agendada: {{title}}. Data: {{date}}. Link: {{link}}',
  '["name", "title", "date", "description", "link"]'
) ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  content_html = EXCLUDED.content_html,
  content_text = EXCLUDED.content_text,
  variables = EXCLUDED.variables;
