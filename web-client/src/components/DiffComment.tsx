import { Avatar, Badge, Box, Button, Divider, Group, Paper, Text, Textarea } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import { ReviewComment } from "../tabs/ModifiedFilesTab";
import { useEffect, useRef, useState } from "react";

export interface DiffCommentProps {
  comment: ReviewComment;
  isPending: boolean;
}

function DiffComment({ comment, isPending }: DiffCommentProps) {
  const [replies, setReplies] = useState<string[]>([]);

  const [isReplyEditorFocused, setIsReplyEditorFocused] = useState(false);
  const [replyEditorContent, setReplyEditorContent] = useState("");
  const replyEditorRef = useRef<HTMLTextAreaElement>(null);

  const onReplyEditorFocus = () => {
    setIsReplyEditorFocused(true);
  };
  const onReplyEditorBlur = () => {
    setIsReplyEditorFocused(false);
  };

  const handleReplyEditorSubmit = () => {
    setReplies([...replies, replyEditorContent]);
    setReplyEditorContent("");
    setIsReplyEditorFocused(false);
  };

  useEffect(() => {
    if (isReplyEditorFocused) {
      // This hack was needed because `Textarea` is blurred when props like `autosize` are changed.
      // Ideally, this hack should be removed.
      replyEditorRef.current?.focus();
    }
  }, [isReplyEditorFocused]);

  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg">
      <Divider my={9} />
      <Group>
        <Badge size="md" color="#888" key={1} mb={4}>
          {comment.label}
        </Badge>

        <Badge size="md" color="green" key={2} mb={4}>
          {comment.decoration}
        </Badge>

        {isPending && (
          <Badge size="md" color="orange" variant="light" key={3} mb={4}>
            Pending
          </Badge>
        )}
      </Group>
      <Group>
        <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
        <div>
          <Text fz="sm">AUTHOR</Text>
          <Text fz="xs" c="dimmed">
            {new Date(2023, 4, 7).toLocaleString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
            })}
          </Text>
        </div>
      </Group>
      <Text py="sm">{comment.content}</Text>

      {replies.length !== 0 &&
        replies.map((r, i) => (
          <Box key={i}>
            <Divider mb="sm" />
            <Group>
              <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
              <div>
                <Text fz="sm">AUTHOR</Text>
                <Text fz="xs" c="dimmed">
                  {new Date(2023, 4, 7).toLocaleString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                  })}
                </Text>
              </div>
            </Group>
            <Text py="sm">{r}</Text>
          </Box>
        ))}

      <Textarea
        ref={replyEditorRef}
        rows={isReplyEditorFocused ? undefined : 1}
        minRows={isReplyEditorFocused ? 3 : undefined}
        autosize={isReplyEditorFocused}
        onClick={onReplyEditorFocus}
        placeholder="Reply..."
        value={replyEditorContent}
        onChange={(e) => setReplyEditorContent(e.currentTarget.value)}
      />
      {isReplyEditorFocused && (
        <Group>
          <Button onClick={onReplyEditorBlur}>Cancel</Button>
          <Button disabled={replyEditorContent.length === 0} onClick={handleReplyEditorSubmit}>
            Add comment
          </Button>
        </Group>
      )}

      {!isPending && (
        <>
          <Divider my={10} />
          <Group justify="start" mt={5}>
            <Button size="sm" color="green">
              Resolve comment
            </Button>
            {/*
        <Text c="gray" size="sm">
          ecekahraman was requested to review this comment
        </Text>
        */}
          </Group>
        </>
      )}
    </Paper>
  );
}

export default DiffComment;
