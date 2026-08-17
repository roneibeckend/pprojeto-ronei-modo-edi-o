export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Ops! Ocorreu um problema — Espetinho na Veia</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <style>
      :root {
        --background: #0a0a0a;
        --foreground: #ffffff;
        --primary: #ff6a00;
        --card: #141414;
      }
      body { 
        font-family: system-ui, -apple-system, sans-serif; 
        background: var(--background); 
        color: var(--foreground); 
        display: grid; 
        place-items: center; 
        min-height: 100vh; 
        margin: 0; 
        padding: 1.5rem;
        text-align: center;
      }
      .card { 
        max-width: 28rem; 
        width: 100%; 
        padding: 2.5rem; 
        background: var(--card);
        border-radius: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      }
      .icon {
        width: 64px;
        height: 64px;
        background: rgba(255, 106, 0, 0.1);
        border-radius: 1rem;
        display: grid;
        place-items: center;
        margin: 0 auto 1.5rem;
      }
      h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.75rem; text-transform: uppercase; letter-spacing: -0.025em; }
      p { color: rgba(255, 255, 255, 0.6); margin: 0 0 2rem; font-size: 0.9375rem; line-height: 1.6; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      button, a { 
        padding: 0.75rem 1.5rem; 
        border-radius: 999px; 
        font-size: 0.875rem;
        font-weight: 700; 
        cursor: pointer; 
        text-decoration: none; 
        border: none; 
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .primary { background: var(--primary); color: #fff; box-shadow: 0 10px 20px -5px rgba(255, 106, 0, 0.5); }
      .primary:hover { transform: translateY(-2px); filter: brightness(1.1); }
      .secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); }
      .secondary:hover { background: rgba(255, 255, 255, 0.1); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <h1>Estabilidade de Layout</h1>
      <p>Ocorreu uma falha no carregamento visual. Estamos prontos para restaurar sua experiência premium.</p>
      <div class="actions">
        <button class="primary" onclick="window.location.reload()">Tentar Novamente</button>
        <a class="secondary" href="/app">Ir para o Início</a>
      </div>
    </div>
    <script>
      // Se detectarmos falha no carregamento de estilos críticos no futuro, este script ajudará.
      console.error("Fallback de erro catastrófico ativado.");
    </script>
  </body>
</html>`;
}
