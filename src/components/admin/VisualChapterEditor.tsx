import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualChapterEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuButton = ({ 
  onClick, 
  active = false, 
  disabled = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-md transition-all hover:bg-white/10",
      active ? "bg-[#ff6a00] text-black" : "text-white/40",
      disabled && "opacity-20 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

export function VisualChapterEditor({ content, onChange, placeholder = "Comece a escrever o conteúdo do capítulo..." }: VisualChapterEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#ff6a00] underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-orange max-w-none focus:outline-none min-h-[400px] p-6 text-base font-sans leading-relaxed text-white/90 [&_p]:mb-4 [&_p]:text-justify [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-6 [&_h1]:uppercase [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do Link:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col h-full border border-white/10 rounded-xl overflow-hidden bg-black/20">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-1 pr-2 border-r border-white/5 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-white/5 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-white/5 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-white/5 mr-1">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Alinhar à Esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Alinhar à Direita"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Lista com Marcadores"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Lista Numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={setLink}
            active={editor.isActive('link')}
            title="Inserir Link"
          >
            <LinkIcon className="h-4 w-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
      
      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-white/20 uppercase tracking-widest font-bold">
        <div className="flex gap-4">
          <span>{editor.getText().length} Caracteres</span>
        </div>
        <div className="flex items-center gap-1">
          <Type className="h-3 w-3" />
          <span>Editor Visual Ativo</span>
        </div>
      </div>
    </div>
  );
}
