import { Box, Group, Text, ActionIcon, Tooltip, Textarea, Paper, Title } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { DiffLine, DiffLineType, FileDiff } from "../../utility/diff-types";
import DiffCommentEditor from "./DiffCommentEditor";
import DiffComment from "../DiffComment";
import { ReviewComment } from "../../tabs/ModifiedFilesTab";

export interface DiffLineMarkerViewProps {
  diffLine: DiffLine;
}

function DiffLineMarkerView({ diffLine: l }: DiffLineMarkerViewProps) {
  return (
    <Group gap={0}>
      <Box w="64px" style={{ borderRight: "1px solid gray" }} ta="center">
        EXPAND
      </Box>
      <Box px="sm">
        <code>{l.content}</code>
      </Box>
    </Group>
  );
}

export interface DiffLineNonMarkerViewProps {
  diffLine: DiffLine;
  comments: ReviewComment[];
  pendingComments: ReviewComment[];
  hasStartedReview: boolean;
  onAddPendingComment: (partialComment: Omit<ReviewComment, "key">) => void;
  onReplyCreated: () => void;
}

function DiffLineNonMarkerView({
  diffLine: l,
  comments,
  pendingComments,
  hasStartedReview,
  onAddPendingComment,
  onReplyCreated,
}: DiffLineNonMarkerViewProps) {
  const { hovered, ref } = useHover();
  const [addingComment, setAddingComment] = useState(false);
  const [addingSelfNote, setAddingSelfNote] = useState(false);

  return (
    <Box>
      <Group wrap="wrap" gap={0} align="stretch">
        <Box
          w="64px"
          display="inline-block"
          px={0}
          style={{
            borderRight: "1px solid gray",
            background:
              l.type === DiffLineType.Addition ? "#1c4428" : l.type === DiffLineType.Deletion ? "#542426" : undefined,
          }}
        >
          <Text display="inline-block" size="12px" w="30px" my={0} ta="center">
            {l.lineNumber.before ?? ""}
          </Text>
          <Text display="inline-block" size="12px" w="30px" my={0} ta="center">
            {l.lineNumber.after ?? ""}
          </Text>
        </Box>
        <Box
          ref={ref}
          px="sm"
          display="inline-block"
          style={{
            background:
              l.type === DiffLineType.Addition ? "#12261e" : l.type === DiffLineType.Deletion ? "#26171c" : undefined,
            flexGrow: 1,
            width: "min-content",
          }}
        >
          <Group pos="absolute" style={{ visibility: hovered && hasStartedReview ? "visible" : "hidden" }} gap="xs">
            <Tooltip label="Add review comment">
              <ActionIcon size="xs" onClick={() => setAddingComment(true)}>
                <IconPlus size="16px" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Add note to self">
              <ActionIcon size="xs" color="gray" onClick={() => setAddingSelfNote(true)}>
                <IconPlus size="16px" />
              </ActionIcon>
            </Tooltip>
          </Group>
          <code style={{ whiteSpace: "pre-wrap" }}>{l.content}</code>
        </Box>
      </Group>

      {addingSelfNote && (
        <Paper withBorder p="sm">
          <Group justify="space-between" mb="xs">
            <Title order={6}>Self Note</Title>
            <ActionIcon color="darkred" title="Discard" onClick={() => setAddingSelfNote(false)}>
              <IconX size="16px" />
            </ActionIcon>
          </Group>
          <Textarea autosize placeholder="Note..." />
        </Paper>
      )}

      {addingComment && (
        <DiffCommentEditor
          onAdd={(comment) => {
            onAddPendingComment(comment);
            setAddingComment(false);
          }}
          onCancel={() => setAddingComment(false)}
        />
      )}

      {/* FIXME: keys should be IDs */}
      {pendingComments.map((c, i) => (
        <DiffComment key={i} comment={c} replies={[]} isPending={true} onReplyCreated={() => {}} />
      ))}
      {comments
        .filter((c) => !c.inReplyToId)
        .map((c, i) => (
          <DiffComment
            key={i}
            comment={c}
            replies={comments.filter((c2) => c2.inReplyToId && c2.inReplyToId === c.id)}
            isPending={false}
            onReplyCreated={onReplyCreated}
          />
        ))}
    </Box>
  );
}

export interface DiffLineViewProps {
  diffLine: DiffLine;
  comments: ReviewComment[];
  pendingComments: ReviewComment[];
  hasStartedReview: boolean;
  onAddPendingComment: (partialComment: Omit<ReviewComment, "key">) => void;
  onReplyCreated: () => void;
}

function DiffLineView({
  diffLine: l,
  comments,
  pendingComments,
  hasStartedReview,
  onAddPendingComment,
  onReplyCreated,
}: DiffLineViewProps) {
  if (l.type === DiffLineType.Marker) {
    return <DiffLineMarkerView diffLine={l} />;
  } else if (
    l.type === DiffLineType.Context ||
    l.type === DiffLineType.Addition ||
    l.type === DiffLineType.Deletion ||
    l.type === DiffLineType.NoNewlineAtEOF
  ) {
    return (
      <DiffLineNonMarkerView
        diffLine={l}
        comments={comments}
        pendingComments={pendingComments}
        hasStartedReview={hasStartedReview}
        onAddPendingComment={onAddPendingComment}
        onReplyCreated={onReplyCreated}
      />
    );
  } else {
    throw Error("DIFF LINE MAPPING FELL THROUGH");
  }
}

export interface FileDiffViewProps {
  fileDiff: FileDiff;
  comments: ReviewComment[];
  pendingComments: ReviewComment[];
  hasStartedReview: boolean;
  onAddPendingComment: (comment: ReviewComment) => void;
  onReplyCreated: () => void;
}

function FileDiffView({
  fileDiff: f,
  comments,
  pendingComments,
  hasStartedReview,
  onAddPendingComment,
  onReplyCreated,
}: FileDiffViewProps) {
  return (
    <Box mb="md" style={{ border: "1px solid gray", borderRadius: "5px", fontSize: "12px" }} p="sm">
      <Box style={{ borderBottom: "1px solid gray" }}>
        <Text>
          {f.fileName} +{f.diffstat.additions} -{f.diffstat.deletions}
        </Text>
      </Box>

      {f.lines.map((l, i) => (
        <DiffLineView
          key={i}
          diffLine={l}
          comments={comments.filter((c) => c.key.absoluteLineNumber === i)}
          pendingComments={pendingComments.filter((c) => c.key.absoluteLineNumber === i)}
          hasStartedReview={hasStartedReview}
          onAddPendingComment={(partialComment) => {
            onAddPendingComment({
              key: {
                fileName: f.fileName,
                absoluteLineNumber: i,
              },
              label: partialComment.label,
              decoration: partialComment.decoration,
              content: partialComment.content,
              createdAt: new Date().toString(),
              author: {
                login: "",
              },
              isResolved: false,
            });
          }}
          onReplyCreated={onReplyCreated}
        />
      ))}
    </Box>
  );
}

export default FileDiffView;
