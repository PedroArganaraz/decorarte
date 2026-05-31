"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { useEffect, useState } from "react"

interface Props {
  contenido: string
  onChange: (html: string) => void
}

export default function EditorNotas({ contenido, onChange }: Props) {
  const [, setTick] = useState(0)

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: contenido,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    onTransaction() {
      setTick((t) => t + 1)
    },
    editorProps: {
      attributes: {
        style: [
          "min-height: 300px",
          "padding: 14px 12px",
          "font-size: 14px",
          "font-family: 'Jost', sans-serif",
          "font-weight: 300",
          "color: var(--color-texto)",
          "outline: none",
          "line-height: 1.65",
        ].join(";"),
      },
    },
  })

  // Sincronizar contenido externo (ej: al cargar en edición)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === contenido) return
    editor.commands.setContent(contenido, false)
  }, [contenido, editor])

  const estiloBtn = (activo: boolean): React.CSSProperties => ({
    padding: "5px 10px",
    fontSize: "12px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: activo ? 600 : 400,
    backgroundColor: activo ? "var(--color-texto)" : "transparent",
    color: activo ? "var(--color-fondo)" : "var(--color-texto-muted)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    cursor: "pointer",
    lineHeight: 1,
    minWidth: "30px",
  })

  return (
    <div style={{
      border: "0.5px solid var(--color-borde)",
      backgroundColor: "var(--color-fondo)",
    }}>
      <style>{`
        .tiptap-editor strong { font-weight: 600; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor u { text-decoration: underline; }
        .tiptap-editor p { margin: 0 0 6px; }
        .tiptap-editor p:last-child { margin-bottom: 0; }
        .tiptap-editor .ProseMirror-focused { outline: none; }
      `}</style>
      {/* Barra de herramientas */}
      <div style={{
        display: "flex",
        gap: "4px",
        padding: "8px 10px",
        borderBottom: "0.5px solid var(--color-borde)",
        backgroundColor: "var(--color-card)",
      }}>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          style={estiloBtn(!!editor?.isActive("bold"))}
          title="Negrita"
        >
          N
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          style={estiloBtn(!!editor?.isActive("italic"))}
          title="Cursiva"
        >
          <em>K</em>
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          style={estiloBtn(!!editor?.isActive("underline"))}
          title="Subrayado"
        >
          <u>S</u>
        </button>
      </div>

      {/* Área de escritura */}
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
