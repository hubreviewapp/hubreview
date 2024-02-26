import { IconCaretDownFilled, IconX } from "@tabler/icons-react";
import { Button, Divider, Group, ActionIcon, Paper, Select, Textarea, Menu } from "@mantine/core";
import { useState } from "react";
import { ReviewComment, ReviewCommentDecoration } from "../../tabs/ModifiedFilesTab";

export interface DiffCommentEditorSubmitButtonProps {
  decoration: ReviewCommentDecoration;
  onDecorationChange: (decoration: ReviewCommentDecoration) => void;
  onSubmit: () => void;
}

function DiffCommentEditorSubmitButton({
  decoration,
  onDecorationChange,
  onSubmit,
}: DiffCommentEditorSubmitButtonProps) {
  return (
    <Group gap={0}>
      <Button color="green" onClick={onSubmit}>
        Add {decoration} comment
      </Button>
      <Menu>
        <Menu.Target>
          <ActionIcon
            color="green"
            size="36px"
            style={{ borderLeft: "1px solid black", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            <IconCaretDownFilled />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Comment decorations</Menu.Label>
          <Menu.Item onClick={() => onDecorationChange("non-blocking")}>Non-blocking comment</Menu.Item>
          <Menu.Item onClick={() => onDecorationChange("blocking")}>Blocking comment</Menu.Item>
          <Menu.Item onClick={() => onDecorationChange("if-minor")}>If-minor comment</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

export interface DiffCommentEditorProps {
  onAdd: (partialComment: Omit<ReviewComment, "key">) => void;
  onCancel: () => void;
}

function DiffCommentEditor({ onAdd, onCancel }: DiffCommentEditorProps) {
  const [editorContent, setEditorContent] = useState("");
  const [commentLabel, setCommentLabel] = useState("None");
  const [decorationType, setDecorationType] = useState<ReviewCommentDecoration>("non-blocking");

  const handleSubmit = () => {
    onAdd({
      label: commentLabel,
      decoration: decorationType,
      content: editorContent,
    });
  };

  return (
    <Paper withBorder p="sm">
      <Group justify="end">
        <ActionIcon color="darkred" title="Cancel" onClick={onCancel}>
          <IconX size="16px" />
        </ActionIcon>
      </Group>

      <Textarea
        autosize
        minRows={3}
        content={editorContent}
        onChange={(e) => setEditorContent(e.currentTarget.value)}
      />

      <Divider my={10} />
      <Group justify="end" mt={5}>
        <Select
          value={commentLabel}
          onChange={(val) => setCommentLabel(val ?? "None")}
          data={["None", "Nitpick", "Suggestion", "Issue", "Question", "Thought"]}
          label="Label"
        />
        <DiffCommentEditorSubmitButton
          decoration={decorationType}
          onDecorationChange={(decoration) => setDecorationType(decoration)}
          onSubmit={handleSubmit}
        />
      </Group>
    </Paper>
  );
}

export default DiffCommentEditor;