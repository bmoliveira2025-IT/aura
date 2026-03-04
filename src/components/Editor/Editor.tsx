import { useState } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, Code,
    Heading1, Heading2, List, ListOrdered, Undo, Redo,
    Palette
} from 'lucide-react';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CodeBlockComponent from './CodeBlockComponent.tsx';
import './Editor.css';

import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';

const lowlight = createLowlight(all);

interface EditorProps {
    content: string;
    onChange: (html: string) => void;
}

const COLORS = [
    { name: 'Default', value: 'inherit' },
    { name: 'Gray', value: '#64748b' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
];

export default function Editor({ content, onChange }: EditorProps) {
    const { user } = useAuth();
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleImageUpload = async (file: File) => {
        if (!user) {
            alert('You must be logged in to upload images.');
            return null;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('note-images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('note-images').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent);
                },
            }).configure({
                lowlight,
                defaultLanguage: 'plaintext',
            }),
            Image.configure({
                inline: true,
            }),
            Placeholder.configure({
                placeholder: 'Comece a escrever aqui...',
            }),
            TextStyle,
            Color,
            BubbleMenuExtension.configure(),
            FloatingMenuExtension.configure(),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onFocus: () => { },
        onBlur: () => { },
        editorProps: {
            attributes: {
                spellcheck: 'false',
            },
            handlePaste: (view: any, event: ClipboardEvent | any) => {
                const items = Array.from(event.clipboardData?.items || []) as DataTransferItem[];

                for (const item of items) {
                    if (item.type.indexOf('image') === 0) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (!file) continue;

                        handleImageUpload(file).then((url) => {
                            if (url) {
                                const { schema } = view.state;
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
            // Note: Full drag-and-drop block reordering usually requires
            // Prosemirror NodeViews with handles. We enable standard Tiptap DND.
        },
    });

    if (!editor) return null;

    return (
        <div className="editor-outer-container">
            <div className="editor-toolbar-wrapper is-visible">
                <div className="editor-toolbar">
                    <div className="tb-group">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Negrito">
                            <Bold size={16} />
                        </button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Itálico">
                            <Italic size={16} />
                        </button>
                        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Sublinhado">
                            <UnderlineIcon size={16} />
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
                        <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''} title="Código inline">
                            <Code size={16} />
                        </button>
                    </div>

                    <div className="tb-sep" />

                    <div className="tb-group color-picker-group">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`color-picker-btn ${showColorPicker ? 'is-active' : ''}`}
                            title="Cor do texto"
                        >
                            <Palette size={16} color={editor.getAttributes('textStyle').color || 'currentColor'} />
                        </button>

                        {showColorPicker && (
                            <>
                                <div className="popover-overlay" onClick={() => setShowColorPicker(false)} />
                                <div className="color-palette-popover">
                                    <div className="color-grid">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                className={`color-swatch ${editor.isActive('textStyle', { color: color.value }) ? 'is-active' : ''}`}
                                                style={{ backgroundColor: color.value === 'inherit' ? 'transparent' : color.value }}
                                                onClick={() => {
                                                    if (color.value === 'inherit') {
                                                        editor.chain().focus().unsetColor().run();
                                                    } else {
                                                        editor.chain().focus().setColor(color.value).run();
                                                    }
                                                    setShowColorPicker(false);
                                                }}
                                                title={color.name}
                                            >
                                                {color.value === 'inherit' && <div className="unsetColor-icon">/</div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
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
            </div>

            <div className="editor-container">
                <EditorContent editor={editor} className="lumina-editor" />
            </div>
        </div>
    );
}
