import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import { useUploadImageMutation } from '../api/uploadApi';
import type { User } from '../types';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Image as ImageIcon,
  AtSign,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  members?: User[];
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onTypingStart,
  onTypingStop,
  members = [],
}) => {
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        allowBase64: true,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention-tag text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded font-semibold text-xs border border-indigo-500/30',
        },
        suggestion: {
          items: ({ query }) => {
            return members
              .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
              .map((m) => ({ id: m._id, label: m.name }));
          },
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      if (onTypingStart) onTypingStart();
    },
    onBlur: () => {
      if (onTypingStop) onTypingStop();
    },
  });

  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadImage(file).unwrap();
      if (res.data?.url) {
        editor.chain().focus().setImage({ src: res.data.url }).run();
      }
    } catch (err) {
      alert('Failed to upload image to Cloudinary');
    }
  };

  const insertMemberTag = (memberName: string) => {
    editor.chain().focus().insertContent(`@${memberName} `).run();
    setShowMemberMenu(false);
  };

  return (
    <div className="border border-edge rounded-xl overflow-hidden bg-surface focus-within:border-accent transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface border-b border-edge text-mute">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('bold') ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('italic') ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('strike') ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('bulletList') ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor.isActive('orderedList') ? 'bg-indigo-600/30 text-indigo-300' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        {/* Image Upload Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 disabled:opacity-50"
          title="Upload & Insert Image (Cloudinary)"
        >
          {isUploading ? (
            <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin block" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Member Tagging Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMemberMenu(!showMemberMenu)}
            className="p-1.5 rounded hover:bg-slate-800 text-violet-400 flex items-center space-x-1"
            title="Tag Member (@)"
          >
            <AtSign className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Tag</span>
          </button>

          {showMemberMenu && (
            <div className="absolute top-8 left-0 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-xl max-h-40 overflow-y-auto">
              <p className="text-[10px] text-slate-500 font-bold uppercase px-2 py-1">Tag Member</p>
              {members.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-1 italic">No members available</p>
              ) : (
                members.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => insertMemberTag(m.name)}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">
                      {m.name[0]}
                    </span>
                    <span>{m.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-slate-800"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-slate-800"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="p-3 min-h-[140px] text-sm text-ink max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
