"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const btnClass = "px-2 py-1 rounded text-xs font-medium transition-colors";

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. on edit load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const toolbarBtnStyle = (active: boolean) => ({
    background: active ? "rgba(232,168,56,0.25)" : "#2e2e2e",
    color: active ? "#e8a838" : "#aaa",
    border: active ? "1px solid rgba(232,168,56,0.4)" : "1px solid transparent",
  });

  function setLink() {
    const prev = editor!.getAttributes("link").href ?? "";
    const url = prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #2e2e2e", background: "#0f0f0f" }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 px-3 py-2"
        style={{ background: "#1a1a1a", borderBottom: "1px solid #2e2e2e" }}
      >
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <div style={{ width: 1, height: 18, background: "#2e2e2e", margin: "0 2px" }} />
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <div style={{ width: 1, height: 18, background: "#2e2e2e", margin: "0 2px" }} />
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(editor.isActive("link"))}
          onClick={setLink}
        >
          Link
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(false)}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          className={btnClass}
          style={toolbarBtnStyle(false)}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      {/* Editor area */}
      <div
        className="px-4 py-3"
        style={{ minHeight: 280, color: "#f5f0e8" }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
