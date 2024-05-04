import {
  Box,
  Button,
  Divider,
  Group,
  Flex,
  Radio,
  Stack,
  Text,
  Title,
  Collapse,
  Textarea,
  Paper,
  Avatar,
  Badge,
  Loader,
  Tooltip,
  CheckIcon,
} from "@mantine/core";
import FileDiffView from "../components/ReviewsTab/FileDiffView";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserLogo from "../assets/icons/user.png";
import { FileDiff } from "../utility/diff-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../env";
import { APIPullRequestDetails } from "../api/types";
import convertHtmlToMarkdown from "../utility/convertHtmlToMarkdown";
import Markdown from "react-markdown";
import { parseRawDiff } from "../utility/diff-utilities";
import { useUser } from "../providers/context-utilities";

export type GetAllPatchesResponse = {
  name: string;
  sha: string;
  status: string;
  adds: number;
  dels: number;
  changes: number;
  content: string;
};

export type ReviewResponseTemp = {
  reviews: {
    mainComment: {
      state: {
        stringValue: string;
      };
      user: {
        login: string;
        avatarUrl?: string;
      };
      body: string;
      submittedAt: string;
    };
    childComments: {
      id: number;
      nodeId: string;
      inReplyToId?: number;
      path: string;
      position: number;
      user: {
        login: string;
        avatarUrl?: string;
      };
      createdAt: string;
      body: string;
    }[];
  }[];
  resolvedTopCommentNodeIds: string[];
};

export type CreateReviewRequest = {
  body: string;
  verdict: ReviewVerdict;
  comments: {
    message: string;
    filename: string;
    position: number;
    label: string;
    decoration: string;
  }[];
};

export type ReviewCommentDecoration = "non-blocking" | "blocking" | "if-minor";
export interface ReviewComment {
  key: {
    fileName: string;
    absoluteLineNumber: number;
  };
  label: string;
  decoration: ReviewCommentDecoration;
  content: string;
  createdAt: string;
  author: {
    login: string;
    avatarUrl?: string;
  };
  id?: number;
  nodeId?: string;
  inReplyToId?: number;
  isResolved: boolean;
}

export type ReviewVerdict = "comment" | "approve" | "reject";
export interface ReviewMainComment {
  verdict: ReviewVerdict;
  content: string;
  author: {
    login: string;
    avatarUrl?: string;
  };
  submittedAt: string;
}

export interface ModifiedFilesTabProps {
  pullRequestDetails: APIPullRequestDetails;
}

function ModifiedFilesTab({ pullRequestDetails }: ModifiedFilesTabProps) {
  const { owner, repoName, prnumber } = useParams();
  const { user } = useUser();

  const [hasStartedReview, setHasStartedReview] = useState(false);
  const [isSubmitReviewEditorOpen, setIsSubmitReviewEditorOpen] = useState(false);

  const reviewEditorRef = useRef<HTMLTextAreaElement>(null);
  const [editorContent, setEditorContent] = useState("");
  const [reviewVerdict, setReviewVerdict] = useState<ReviewVerdict>("comment");

  const [pendingComments, setPendingComments] = useState<ReviewComment[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [mainComments, setMainComments] = useState<ReviewMainComment[]>([]);

  const isReviewEmpty = pendingComments.length === 0 && editorContent.length === 0;
  const isSelfReview = pullRequestDetails.author.login === user?.login;

  const onAddPendingComment = useCallback(
    (comment: ReviewComment) => {
      setPendingComments([...pendingComments, comment]);
    },
    [pendingComments, setPendingComments],
  );

  const { data: diffData, isLoading: diffsAreLoading } = useQuery({
    queryKey: [`reviews-diffs-${owner}-${repoName}-${prnumber}`],
    queryFn: () =>
      fetch(`${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/files`, {
        credentials: "include",
      }).then((r) => r.json()),
    retry: false,
  });

  const {
    data: reviewData,
    isLoading: reviewsAreLoading,
    status: reviewsQueryStatus,
    refetch: refetchReviewData,
  } = useQuery({
    queryKey: [`reviews-${owner}-${repoName}-${prnumber}`],
    queryFn: () =>
      fetch(`${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/reviews`, {
        credentials: "include",
      }).then(async (r) => (await r.json()) as ReviewResponseTemp),
    retry: false,
  });

  useEffect(() => {
    // FIXME: temporary hack
    const mapCommentState = (state: string): ReviewVerdict => {
      switch (state) {
        case "COMMENTED":
          return "comment";
        case "APPROVED":
          return "approve";
        case "CHANGES_REQUESTED":
          return "reject";
        default:
          throw Error(`Unexpected comment state: "${state}"`);
      }
    };

    if (reviewsQueryStatus === "success" && reviewData) {
      setMainComments(
        reviewData.reviews
          .filter((r) => !(r.childComments.length === 1 && r.childComments[0].inReplyToId))
          .map((r): ReviewMainComment => {
            const mainComment = r.mainComment;
            return {
              content: mainComment.body,
              verdict: mapCommentState(mainComment.state.stringValue),
              author: {
                login: mainComment.user.login,
                avatarUrl: mainComment.user.avatarUrl,
              },
              submittedAt: mainComment.submittedAt,
            };
          }),
      );

      setComments(
        reviewData.reviews
          .map((r): ReviewComment[] => {
            const comments = r.childComments;

            // FIXME: this can be done much better
            const parseConventionalComment = (body: string) => {
              const match = body.match(/^<.--Using HubReview-->\n(\w*)\((\S*)\): (.*)/) || [null, null, null, null];
              return {
                label: match[1] ?? "None",
                decoration: match[2] ?? "non-blocking",
                content: match[3] ?? body.replace("<!--Using HubReview--> ", ""),
              };
            };

            return comments.map((c): ReviewComment => {
              const conventionalComment = parseConventionalComment(c.body);
              return {
                content: conventionalComment.content,
                key: {
                  fileName: c.path,
                  absoluteLineNumber: c.position,
                },
                label: conventionalComment.label,
                decoration: conventionalComment.decoration as ReviewCommentDecoration,
                createdAt: c.createdAt,
                author: {
                  login: c.user.login,
                  avatarUrl: c.user.avatarUrl,
                },
                id: c.id,
                nodeId: c.nodeId,
                inReplyToId: c.inReplyToId,
                isResolved: reviewData.resolvedTopCommentNodeIds.includes(c.nodeId),
              };
            });
          })
          .flat(),
      );
    }
  }, [reviewData, reviewsQueryStatus, setMainComments, setComments]);

  const fileDiffs: FileDiff[] = useMemo(
    () => diffData?.map((o: GetAllPatchesResponse) => parseRawDiff(o)) ?? [],
    [diffData],
  );

  const fileDiffViews = useMemo(() => {
    return fileDiffs.map((f) => (
      <FileDiffView
        key={f.fileName}
        pullRequestDetails={pullRequestDetails}
        fileDiff={f}
        comments={comments.filter((c) => c.key.fileName === f.fileName)}
        pendingComments={pendingComments.filter((c) => c.key.fileName === f.fileName)}
        hasStartedReview={hasStartedReview}
        onAddPendingComment={onAddPendingComment}
        onReplyCreated={refetchReviewData}
      />
    ));
  }, [
    fileDiffs,
    comments,
    pendingComments,
    hasStartedReview,
    onAddPendingComment,
    refetchReviewData,
    pullRequestDetails,
  ]);

  const createReviewMutation = useMutation({
    mutationFn: (req: { req: CreateReviewRequest }) =>
      fetch(`${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.req),
      }),
  });

  const submitPendingComments = async () => {
    await createReviewMutation.mutateAsync({
      req: {
        body: editorContent,
        verdict: reviewVerdict,
        comments: pendingComments.map((c) => ({
          position: c.key.absoluteLineNumber,
          filename: c.key.fileName,
          message: c.content,
          label: c.label,
          decoration: c.decoration,
        })),
      },
    });

    setReviewVerdict("comment");
    setEditorContent("");
    if (reviewEditorRef.current)
      // For some reason, this is the only way to get the textarea to clear its displayed contents,
      // even though the state is definitely set to an empty string already.
      reviewEditorRef.current.value = "";

    setPendingComments([]);
    setHasStartedReview(false);
    setIsSubmitReviewEditorOpen(false);

    await refetchReviewData();
  };

  useEffect(() => {
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
    const unloadCallback: EventListenerOrEventListenerObject = (event) => {
      if (hasStartedReview) {
        event.preventDefault();
        event.returnValue = true;
      }
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, [hasStartedReview]);

  const isLoading = diffsAreLoading || reviewsAreLoading || createReviewMutation.isPending;
  if (isLoading) {
    return (
      <Box w="90%">
        <Loader color="blue" />
      </Box>
    );
  }

  return (
    <Box w="90%">
      <Flex justify="flex-end" mb="sm">
        <Button mr="sm" onClick={() => setHasStartedReview(true)} disabled={hasStartedReview}>
          Start Review
        </Button>
        <Button disabled={!hasStartedReview} onClick={() => setIsSubmitReviewEditorOpen(!isSubmitReviewEditorOpen)}>
          Submit Review
        </Button>
      </Flex>

      <Collapse in={isSubmitReviewEditorOpen}>
        <Box mb="sm">
          <Textarea
            ref={reviewEditorRef}
            autosize
            minRows={3}
            content={editorContent}
            onChange={(e) => setEditorContent(e.currentTarget.value)}
          />

          <Title order={5}>Verdict</Title>
          <Radio.Group value={reviewVerdict} onChange={(val) => setReviewVerdict(val as ReviewVerdict)}>
            <Stack mt="sm">
              <Radio
                icon={CheckIcon}
                value="comment"
                label="Comment indifferently"
                styles={{ label: { color: "lightgray" } }}
              />
              <Tooltip label="You cannot approve your own pull request" disabled={!isSelfReview} refProp="rootRef">
                <Radio
                  icon={CheckIcon}
                  value="approve"
                  label="Approve"
                  styles={{ label: { color: "lime" }, radio: { border: "1px solid lime" } }}
                  disabled={isSelfReview}
                />
              </Tooltip>
              <Tooltip
                label="You cannot request changes on your own pull request"
                disabled={!isSelfReview}
                refProp="rootRef"
              >
                <Radio
                  icon={CheckIcon}
                  value="reject"
                  label="Request changes"
                  styles={{ label: { color: "crimson" }, radio: { border: "1px solid crimson" } }}
                  disabled={isSelfReview}
                />
              </Tooltip>
            </Stack>
          </Radio.Group>

          <Divider my={10} />
          <Group justify="end" mt={5}>
            <Text fs="italic">Including {pendingComments.length} comments</Text>
            <Tooltip
              label="You must add at least a review body or comment to submit a review besides approval"
              disabled={!isReviewEmpty || reviewVerdict === "approve"}
              withArrow
            >
              <Button
                size="sm"
                color="green"
                onClick={submitPendingComments}
                disabled={isReviewEmpty && reviewVerdict !== "approve"}
              >
                Submit
              </Button>
            </Tooltip>
          </Group>
        </Box>
      </Collapse>

      <Title order={4}>Review Verdicts</Title>
      {mainComments.map((c, i) => (
        <Paper key={i} withBorder radius="md" shadow="lg" my="sm" p="sm">
          <Group>
            <Avatar src={c.author.avatarUrl ?? UserLogo} radius="xl" />
            <div>
              <Text fz="sm">{c.author?.login ?? "--"}</Text>
              <Text fz="xs" c="dimmed">
                {new Date(c.submittedAt).toLocaleString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                })}
              </Text>
            </div>
            <Badge ml="auto" color={c.verdict === "approve" ? "lime" : c.verdict === "reject" ? "crimson" : "gray"}>
              {c.verdict === "approve" ? "Approved" : c.verdict === "reject" ? "Requested changes" : "Comment"}
            </Badge>
          </Group>

          <Text>
            <Markdown>{convertHtmlToMarkdown(c.content)}</Markdown>
          </Text>
        </Paper>
      ))}
      {mainComments.length === 0 && <Text>No reviews have been made yet</Text>}

      <Title order={4}>Modified Files</Title>
      {fileDiffViews}
    </Box>
  );
}

export default ModifiedFilesTab;
