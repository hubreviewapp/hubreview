import { RichTextEditor, Link } from "@mantine/tiptap";
import { Button, Box } from "@mantine/core";
import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";

import { useState } from "react";

interface TextEditorProps {
  content: string;
  addComment?: (content: string) => void;
  setIsEditActive?: (isEditActive: boolean) => void;
  editComment?: (id: number, body: string) => void;
  commentId?: number;
}

function TextEditor({ content, addComment, setIsEditActive, editComment, commentId }: TextEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const isAddComment = !!addComment;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content,
    onUpdate({ editor }) {
      setEditorContent(editor.getHTML());
    },
  });

  function handleAddComment() {
    if (addComment) {
      addComment(editorContent);
      editor?.commands.clearContent();
      setEditorContent("");
    } else if (editComment && commentId && setIsEditActive) {
      editComment(commentId, editorContent);

      setIsEditActive(false);
    }
  }

  return (
    <Box style={{ position: "relative", width: "100%" }}>
      <RichTextEditor editor={editor} my="sm">
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
            <RichTextEditor.Code />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Subscript />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>

      {isAddComment && (
        <>
          <Box style={{ position: "absolute", right: 0, top: "100%" }}>
            <Button size="md" color="green" top={20} onClick={() => handleAddComment()}>
              Comment
            </Button>
          </Box>
          <br />
        </>
      )}
      {!isAddComment && (
        <Box style={{ position: "relative", right: 0, top: -20, display: "flex", justifyContent: "flex-end" }}>
          <Button size="md" color="green" top={20} right={20} onClick={() => handleAddComment()}>
            Edit
          </Button>

          <Button
            size="md"
            color="grey"
            top={20}
            onClick={() => {
              setIsEditActive && setIsEditActive(false);
            }}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default TextEditor;
