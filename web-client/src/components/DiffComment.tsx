import { Avatar, Badge, Box, Button, Collapse, Divider, Group, Paper, Text, Textarea } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import { ReviewComment } from "../tabs/ModifiedFilesTab";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../env";
import Markdown from "react-markdown";
import convertHtmlToMarkdown from "../utility/convertHtmlToMarkdown";
import { useDisclosure } from "@mantine/hooks";
import { IconMessages } from "@tabler/icons-react";

export interface DiffCommentProps {
  comment: ReviewComment;
  replies: ReviewComment[];
  isPending: boolean;
  onReplyCreated: () => void;
}

function DiffComment({ comment, replies, isPending, onReplyCreated }: DiffCommentProps) {
  const { owner, repoName, prnumber } = useParams();

  const [isReplyEditorFocused, setIsReplyEditorFocused] = useState(false);
  const [replyEditorContent, setReplyEditorContent] = useState("");
  const replyEditorRef = useRef<HTMLTextAreaElement>(null);

  const onReplyEditorFocus = () => {
    setIsReplyEditorFocused(true);
  };
  const onReplyEditorBlur = () => {
    setIsReplyEditorFocused(false);
  };

  const createReplyMutation = useMutation({
    mutationFn: () =>
      fetch(
        `${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/reviews/comments/${comment.id}/replies`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: replyEditorContent,
          }),
        },
      ),
  });

  const handleReplyEditorSubmit = async () => {
    await createReplyMutation.mutateAsync();
    onReplyCreated();

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

  const toggleResolutionMutation = useMutation({
    mutationFn: (commentNodeId: string) =>
      fetch(
        `${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/reviews/comments/${commentNodeId}/toggleResolution`,
        {
          method: "POST",
          credentials: "include",
        },
      ),
  });

  const [isResolved, setIsResolved] = useState(comment.isResolved);
  const [commentFullyShown, { toggle: toggleCommentFullyShown }] = useDisclosure(!comment.isResolved);

  const handleToggleResolution = async () => {
    await toggleResolutionMutation.mutateAsync(comment.nodeId as string);

    setIsResolved(!isResolved);

    if (isResolved && !commentFullyShown) {
      // Unresolved comments should always be shown fully
      toggleCommentFullyShown();
    } else if (!isResolved) {
      // Resolving a comment should collapse the comment
      toggleCommentFullyShown();
    }
  };

  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg">
      {isResolved && commentFullyShown ? (
        <Box onClick={toggleCommentFullyShown} style={{ cursor: "pointer" }} py="xs">
          <Text size="sm">Collapse resolved comment</Text>
          <Divider my="xs" />
        </Box>
      ) : isResolved && !commentFullyShown ? (
        <Group justify="space-between" onClick={toggleCommentFullyShown} style={{ cursor: "pointer" }}>
          <Group gap="xl">
            <Group>
              <Avatar src={comment.author.avatarUrl ?? UserLogo} alt="Jacob Warnhalter" radius="xl" />
              <div>
                <Text fz="sm">{comment.author.login}</Text>
                <Text fz="xs" c="dimmed">
                  {new Date(comment.createdAt).toLocaleString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                  })}
                </Text>
              </div>
            </Group>
            <Box w={350}>
              <Text truncate="end" lineClamp={2} c="dimmed" size="xs" fs="italic">
                {comment.content}
              </Text>
            </Box>
            <Box>
              <Text>
                <IconMessages size={20} style={{ marginRight: "4px" }} color="gray" />
                {1 + replies.length}
              </Text>
            </Box>
          </Group>
          <Text size="sm">Show resolved comment</Text>
        </Group>
      ) : null}

      <Collapse in={commentFullyShown}>
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
          <Avatar src={comment.author.avatarUrl ?? UserLogo} alt="Jacob Warnhalter" radius="xl" />
          <div>
            <Text fz="sm">{comment.author.login}</Text>
            <Text fz="xs" c="dimmed">
              {new Date(comment.createdAt).toLocaleString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
              })}
            </Text>
          </div>
        </Group>
        <Text>
          <Markdown>{convertHtmlToMarkdown(comment.content)}</Markdown>
        </Text>

        {replies.length !== 0 &&
          replies.map((r, i) => (
            <Box key={i}>
              <Divider mb="sm" />
              <Group>
                <Avatar src={r.author.avatarUrl ?? UserLogo} radius="xl" />
                <div>
                  <Text fz="sm">{r.author.login}</Text>
                  <Text fz="xs" c="dimmed">
                    {new Date(r.createdAt).toLocaleString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                    })}
                  </Text>
                </div>
              </Group>
              <Text>
                <Markdown>{convertHtmlToMarkdown(r.content)}</Markdown>
              </Text>
            </Box>
          ))}

        {!isPending && (
          <>
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
                <Button
                  disabled={replyEditorContent.length === 0}
                  onClick={handleReplyEditorSubmit}
                  loading={createReplyMutation.isPending}
                >
                  Add comment
                </Button>
              </Group>
            )}
          </>
        )}

        {!isPending && (
          <>
            <Divider my={10} />
            <Group justify="start" mt={5}>
              <Button
                size="sm"
                color="green"
                onClick={handleToggleResolution}
                loading={toggleResolutionMutation.isPending}
              >
                {isResolved ? "Unresolve" : "Resolve"} comment
              </Button>
              {/*
        <Text c="gray" size="sm">
          ecekahraman was requested to review this comment
        </Text>
        */}
            </Group>
          </>
        )}
      </Collapse>
    </Paper>
  );
}

export default DiffComment;
