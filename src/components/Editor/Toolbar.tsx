import { Editor } from '@tiptap/react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
    List, ListOrdered, Heading1, Heading2, Undo, Redo
} from 'lucide-react';
import './Toolbar.css';

interface ToolbarProps { editor: Editor | null; }

export default function Toolbar({ editor }: ToolbarProps) {
    if (!editor) return null;

    return (
        <div className="editor-toolbar">
            <div className="tb-group">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Negrito" disabled={!editor.can().chain().toggleBold().run()}>
                    <Bold size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Itálico" disabled={!editor.can().chain().toggleItalic().run()}>
                    <Italic size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Sublinhado" disabled={!editor.can().chain().toggleUnderline().run()}>
                    <UnderlineIcon size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Tachado" disabled={!editor.can().chain().toggleStrike().run()}>
                    <Strikethrough size={16} />
                </button>
            </div>

            <div className="tb-sep" />

            <div className="tb-group">
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Título 1">
                    <Heading1 size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Título 2">
                    <Heading2 size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''} title="Código inline" disabled={!editor.can().chain().toggleCode().run()}>
                    <Code size={16} />
                </button>
            </div>

            <div className="tb-sep" />

            <div className="tb-group">
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Lista">
                    <List size={16} />
                </button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Lista Numerada">
                    <ListOrdered size={16} />
                </button>
            </div>

            <div className="tb-sep" />

            <div className="tb-group">
                <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().undo().run()} title="Desfazer">
                    <Undo size={16} />
                </button>
                <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().redo().run()} title="Refazer">
                    <Redo size={16} />
                </button>
            </div>
        </div>
    );
}
