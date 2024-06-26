import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Text, Grid, Select, LoadingOverlay, Flex } from "@mantine/core";
import axios from "axios";
import { BASE_URL } from "../env.ts";
import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import { APIPullRequestDetails } from "../api/types.ts";
import PRDetailSideBar from "../components/PRDetailSideBar";
import { MergeInfo } from "../pages/PRDetailsPage.tsx";
import { useUser } from "../providers/context-utilities";
import ClosePRButton from "../components/ClosePRButton.tsx";
import SplitButton from "../components/SplitButton.tsx";
import convertHtmlToMarkdown from "../utility/convertHtmlToMarkdown.ts";
import Markdown from "react-markdown";

interface CreateReplyRequestModel {
  body: string;
  replyToId: number;
}

interface CommentProps {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  association: string;
  status: string;
  avatar: string;
  url: string;
  replyToId: number;
}

export interface CommentsTabProps {
  pullRequestDetails: APIPullRequestDetails;
  mergeInfo: MergeInfo | null;
}

function CommentsTab({ pullRequestDetails, mergeInfo }: CommentsTabProps) {
  const { owner, repoName, prnumber } = useParams();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const [apiComments, setApiComments] = useState<CommentProps[] | []>([]);
  const [filteredComments, setFilteredComments] = useState<CommentProps[] | []>([]);
  const [selectedComment, setSelectedComment] = useState<number>(0);

  //[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
  const fetchPRComments = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/get_comments`, {
        withCredentials: true,
      });
      if (res) {
        setApiComments(res.data);
        setFilteredComments(res.data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching PR comments:", error);
    }
  }, [owner, repoName, prnumber, setApiComments]);

  useEffect(() => {
    fetchPRComments();
  }, [fetchPRComments]);

  //[HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addComment")]
  function addPRComment(content: string) {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addComment`, content, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
      .then(function () {
        fetchPRComments();
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
  function deletePRComment(commentId: number, setCommentLoading: (isLoading: boolean) => void) {
    setCommentLoading(true);
    axios
      .delete(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${commentId}/deleteComment`, {
        withCredentials: true,
      })
      .then(function () {
        fetchPRComments().then(function () {
          setCommentLoading(false);
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateComment")]
  function editPRComment(commentId: number, content: string, setCommentLoading: (isLoading: boolean) => void) {
    setCommentLoading(true);
    axios
      .patch(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${commentId}/updateComment`, content, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
      .then(function () {
        fetchPRComments().then(function () {
          setCommentLoading(false);
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateCommentStatus")]
  function updatePRCommentStatus(
    commentId: number,
    content: string | null,
    setCommentLoading: (isLoading: boolean) => void,
  ) {
    if (content === null) {
      return;
    }
    setCommentLoading(true);
    axios
      .patch(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${commentId}/updateCommentStatus`, content, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
      .then(function () {
        return fetchPRComments().then(function () {
          setCommentLoading(false);
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addCommentReply")]
  function replyComment(id: number, body: string) {
    setIsLoading(true);
    const data: CreateReplyRequestModel = { replyToId: id, body: body };
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addCommentReply`, data, {
        withCredentials: true,
      })
      .then(function () {
        fetchPRComments();
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  const handleSelect = (selected: string | null) => {
    if (selected != null) {
      if (selected.startsWith("All Comments")) {
        setFilteredComments(apiComments);
      }
      if (selected.startsWith("My Comments")) {
        setFilteredComments(apiComments.filter((comment) => comment.author === user?.login));
      }
      if (selected.startsWith("Active")) {
        setFilteredComments(
          apiComments.filter(
            (comment) =>
              comment.status === null ||
              comment.status === "Active" ||
              comment.status === "ACTIVE" ||
              comment.status === "Pending",
          ),
        );
      }
      if (selected.startsWith("Resolved")) {
        setFilteredComments(
          apiComments.filter(
            (comment) =>
              comment.status === "Resolved" ||
              comment.status === "Outdated" ||
              comment.status === "Closed" ||
              comment.status === "Duplicate",
          ),
        );
      }
      // resolved
      // active
      // TO DO, after comment resolved is done
    }
  };

  return (
    <Grid>
      <Grid.Col span={8}>
        <Box style={{ display: "flex", justifyContent: "flex-end", marginTop: -40, padding: 10, marginRight: 10 }}>
          <Select
            style={{ flex: 0.2 }}
            placeholder="Filter comments"
            data={[
              "All Comments (" + apiComments.length + ")",
              "My Comments (" + apiComments.filter((comment) => comment.author === user?.login).length + ")",
              "Active (" +
                apiComments.filter(
                  (comment) =>
                    comment.status === null ||
                    comment.status === "Active" ||
                    comment.status === "ACTIVE" ||
                    comment.status === "Pending",
                ).length +
                ")",
              "Resolved (" +
                apiComments.filter(
                  (comment) =>
                    comment.status === "Resolved" ||
                    comment.status === "Outdated" ||
                    comment.status === "Closed" ||
                    comment.status === "Duplicate",
                ).length +
                ")",
            ]}
            checkIconPosition="left"
            onChange={(val) => handleSelect(val)}
          />
        </Box>
        {pullRequestDetails.body.toString() && (
          <Box style={{ border: "0.5px groove gray", borderRadius: 10, padding: "10px" }}>
            <Text fw={700} size="md">
              {" "}
              Description:{" "}
            </Text>
            <Markdown>{convertHtmlToMarkdown(pullRequestDetails.body.toString())}</Markdown>
          </Box>
        )}
        <br></br>
        {!isLoading &&
          filteredComments.map((comment, index) => (
            <Box key={index}>
              <Comment
                key={index}
                id={comment.id}
                author={comment.author}
                text={comment.body}
                date={new Date(comment.updatedAt)}
                isResolved={
                  comment.status === "Resolved" ||
                  comment.status === "Outdated" ||
                  comment.status === "Closed" ||
                  comment.status === "Duplicate"
                }
                isAIGenerated={false}
                deletePRComment={deletePRComment}
                editPRComment={editPRComment}
                replyComment={replyComment}
                status={comment.status}
                avatar={comment.avatar}
                url={comment.url}
                updatePRCommentStatus={updatePRCommentStatus}
                replyToId={comment.replyToId}
                selectedComment={selectedComment}
                setSelectedComment={setSelectedComment}
              />
              <br />
            </Box>
          ))}
        {filteredComments.length == 0 && !isLoading && (
          <Text size="lg" c="dimmed">
            There are currently no comments to display
          </Text>
        )}
        {isLoading && (
          <Box pos="relative" h="200">
            <LoadingOverlay
              visible={true}
              overlayProps={{ radius: "sm", blur: 0 }}
              loaderProps={{ color: "pink", type: "bars" }}
            />
          </Box>
        )}
        <br></br>

        <Flex justify="right">
          <Box>
            {!pullRequestDetails.merged && (
              <Flex justify="right" mb="sm">
                <SplitButton
                  mergeInfo={mergeInfo}
                  mergeStateStatus={pullRequestDetails.mergeStateStatus}
                  mergeableState={pullRequestDetails.mergeable}
                  conflictUrl={pullRequestDetails.pullRequestUrl}
                />
              </Flex>
            )}
            {!pullRequestDetails.merged && <ClosePRButton isClosed={pullRequestDetails.closedAt !== null} />}
          </Box>
        </Flex>
        <br />
        <Box style={{ border: "2px groove gray", borderRadius: 10, padding: "10px" }}>
          <TextEditor content="" addComment={addPRComment} />
        </Box>
      </Grid.Col>
      <Grid.Col span={3}>
        <Box m="md">
          <PRDetailSideBar pullRequestDetails={pullRequestDetails} />
        </Box>
      </Grid.Col>
    </Grid>
  );
}

export default CommentsTab;
