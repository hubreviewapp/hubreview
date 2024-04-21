import { useEffect, useState } from "react";

import { RichTextEditor, Link } from "@mantine/tiptap";
import { useDisclosure } from "@mantine/hooks";
import { Button, Box, Badge, Modal, Table } from "@mantine/core";
import { rem } from "@mantine/core";
import { useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import axios from "axios";
import { IconWriting } from "@tabler/icons-react";

import { BASE_URL } from "../env.ts";

interface TextEditorProps {
  content: string;
  addComment?: (content: string) => void;
  setIsEditActive?: (isEditActive: boolean) => void;
  editComment?: (id: number, body: string) => void;
  commentId?: number;
}

interface SavedReplyProps {
  body: string;
  title: string;
}

function TextEditor({ content, addComment, setIsEditActive, editComment, commentId }: TextEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const isAddComment = !!addComment;
  const [savedReplies, setSavedReplies] = useState<SavedReplyProps[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const iconWriting = <IconWriting style={{ width: rem(20), height: rem(20) }} />;

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

  /*
  const commentSuggestions = [
    'Well done',
    'Looks good to me ',
    'It seems unclear, can you explain further?',
  ]; */

  const handleSuggestionClick = (suggestion: string) => {
    setEditorContent(editorContent + suggestion);
    editor?.commands.insertContent(suggestion);
    close();
  };

  //[HttpGet("user/savedreplies")]
  useEffect(() => {
    const fetchSavedReplies = async () => {
      try {
        const apiUrl = `${BASE_URL}/api/github/user/savedreplies`;
        const res = await axios.get(apiUrl, {
          withCredentials: true,
        });

        if (res) {
          console.log(res.data);
          setSavedReplies(res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };
    fetchSavedReplies();
  }, []);

  const rows = savedReplies.map((reply, index) => (
    <Table.Tr key={reply.title}>
      <Table.Td style={{ fontSize: "18px" }}>{index + 1}</Table.Td>
      <Table.Td style={{ fontSize: "18px" }}>{reply.title}</Table.Td>
      <Table.Td style={{ fontSize: "18px" }}>{reply.body}</Table.Td>
      <Table.Td>
        <Badge
          size="lg"
          key={index}
          leftSection={iconWriting}
          style={{ cursor: "pointer", marginTop: "10px", marginBottom: "5px", marginRight: "5px" }}
          onClick={() => handleSuggestionClick(reply.body)}
        >
          Add
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

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

      <Modal
        opened={opened}
        onClose={close}
        title="Saved replies"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Table.ScrollContainer minWidth={300}>
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th style={{ fontSize: "18px" }}>Reply Title</Table.Th>
                <Table.Th style={{ fontSize: "18px" }}>Reply Body</Table.Th>
                <Table.Th> Add to comment</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Box style={{ textAlign: "center", marginTop: "20px" }}>
          <Button component="a" href="https://github.com/settings/replies?return_to=1" color="indigo">
            {" "}
            Create a new one{" "}
          </Button>
        </Box>

        {/* Modal content */}
      </Modal>

      <Box top="100%" right={0}>
        {savedReplies.slice(0, 3).map((suggestion, index) => (
          <Badge
            size="md"
            key={index}
            style={{ cursor: "pointer", marginTop: "10px", marginBottom: "5px", marginRight: "5px" }}
            onClick={() => handleSuggestionClick(suggestion.body)}
          >
            {suggestion.title}
          </Badge>
        ))}
        <Badge
          color="coral"
          size="md"
          style={{ cursor: "pointer", marginTop: "10px", marginBottom: "5px", marginRight: "5px" }}
          onClick={open}
        >
          See all saved replies
        </Badge>
      </Box>

      {isAddComment && (
        <>
          <Box style={{ position: "absolute", right: 0, top: "100%" }}>
            <Button
              size="md"
              color="green"
              top={20}
              onClick={() => handleAddComment()}
              disabled={editorContent == null || editorContent === "" || editorContent === "<p></p>"}
              className={
                editorContent == null || editorContent === "" || editorContent === "<p></p>" ? "disabled-button" : ""
              }
            >
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
