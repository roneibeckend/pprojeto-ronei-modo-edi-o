# Plano: Player de Vídeo Fixo e Configurável

O objetivo é transformar o player de vídeo do e-book em um elemento persistente após a primeira exibição e permitir que o administrador configure a URL do vídeo de abertura diretamente no editor de e-book.

## Alterações Técnicas

### 1. Banco de Dados
- A coluna `opening_video_url` já existe na tabela `ebooks`, portanto não são necessárias novas migrações de esquema.

### 2. Editor de E-book (Painel Admin)
- Arquivo: `src/routes/admin.ebooks.tsx`
- Adicionar um novo campo de entrada na aba "Informações" do modal de edição para `opening_video_url`.
- Garantir que o campo seja persistido ao salvar o e-book.

### 3. Visualizador de E-book (Área do Aluno)
- Arquivo: `src/routes/app.ebooks.$ebookId.tsx`
- Refatorar a lógica do player para que ele possa ser "minimizado" ou exibido em um local fixo na interface (por exemplo, no topo da barra lateral ou em um widget flutuante) após o fechamento do modal inicial.
- Garantir que a URL configurada no admin seja refletida no player.
- Manter o estado de "visto" no `localStorage`, mas permitir que o usuário reabra o vídeo facilmente através de um controle persistente.

## Detalhes de Implementação

### Admin (`src/routes/admin.ebooks.tsx`)
```tsx
// Exemplo de campo a ser adicionado
<div className="space-y-2">
  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">URL do Vídeo de Abertura (YouTube/Vimeo)</label>
  <input 
    value={editingItem?.opening_video_url || ""} 
    onChange={e => setEditingItem({...editingItem, opening_video_url: e.target.value})} 
    placeholder="https://www.youtube.com/watch?v=..."
    className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-[#ff6a00] transition-colors"
  />
</div>
```

### Player Fixo (`src/routes/app.ebooks.$ebookId.tsx`)
- Atualmente o vídeo é exibido em um modal (`fixed inset-0`).
- A proposta é adicionar um componente de player "Sticky" ou "Floating" que aparece quando o modal é fechado, ou integrar de forma mais orgânica na barra lateral de capítulos para que fique sempre acessível.
- O requisito diz: "permanecer visível de forma persistente (fixo) e que a URL do conteúdo que ele reproduz possa ser definida pelo autor".

## Próximos Passos
1. Adicionar o campo `opening_video_url` no formulário do admin.
2. Criar o componente de player fixo na interface do e-book.
3. Validar a persistência da URL e a responsividade do player.
