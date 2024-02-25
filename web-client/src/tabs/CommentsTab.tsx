import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import SplitButton from "../components/SplitButton.tsx";
import { Box, Text, Accordion, Grid, Select } from "@mantine/core";
//import CommentList from "../components/DiffComment/CommentList";
import PRDetailSideBar from "../components/PRDetailSideBar";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface CommentProps {
  id: number;
  author: string;
  body: string;
  created_at: string;
  updated_at: string;
  association: string;
}

const comments = [
  {
    author: "irem_aydın",
    text:
      "This pull request addresses a critical bug in the user authentication " +
      "module. The issue stemmed from improper handling of user sessions, leading to unexpected logouts. The changes in this " +
      "PR include a comprehensive fix to the session management, ensuring a seamless user experience by preventing inadvertent logouts. " +
      "Additionally, the code has been optimized for better performance, and thorough testing, including unit and integration " +
      "tests, has been conducted to validate the solution. Reviewers are encouraged to focus on the modifications in the " +
      "authentication module, paying attention to code readability, maintainability, and adherence to coding standards. " +
      "This PR is a crucial step in maintaining the reliability and stability of our application.",
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: true,
  },
  {
    author: "aysekelleci",
    text:
      "In every project I'm using Zodios in, I'm eventually seeing more and more \"implicit any\" " +
      "warnings which go away when restarting the TS language server in VS Code or sometimes even just saving my current file. " +
      "Looks like TS gets confused as to what typings to pick or something like that (just like you suggested).",
    date: new Date(2023, 4, 7),
    isResolved: true,
    isAIGenerated: false,
  },

  {
    author: "ecekahraman",
    text: "Consider choosing a more descriptive variable name in the `functionX`.",
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: false,
  },

  {
    author: "aysekelleci",
    text: "Think about adding unit tests for future improvements.",
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: false,
  },
];
export interface CommentsTabProps {
  pullRequest: object[];
}
//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
function CommentsTab({ pullRequest }: CommentsTabProps) {
  const {owner, repoName, prnumber} = useParams();
  const resolvedComments = comments.filter((comment) => comment.isResolved);
  const unresolvedComments = comments.filter((comment) => !comment.isResolved);

  const comments2 = resolvedComments.map((comment, index) => (
    <Accordion.Item value={index + ""} key={index}>
      <Accordion.Control>
        <Comment
          key={index}
          id={index}
          author={comment.author}
          text={comment.text}
          date={comment.date}
          isResolved={comment.isResolved}
          deletePRComment={() => {return }}
        />
      </Accordion.Control>
      <Accordion.Panel>
        <Text size="sm"> {comment.text}</Text>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  const [apiComments, setApiComments] = useState<CommentProps[] | []>([]);

  //[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
  const fetchPRComments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/get_comments`,
        { withCredentials: true },
      );
      if (res) {
        setApiComments(res.data);
      }
    } catch (error) {
      console.error("Error fetching PR comments:", error);
    }
  };

  useEffect(() => {
    fetchPRComments();
  }, []);

  //[HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addComment")]
  function addPRComment(content: string) {
    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addComment`;
    axios
      .post(apiUrl, content, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      })
      .then(function () {
        fetchPRComments();
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
  function deletePRComment(commentId: number) {
    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${commentId}/deleteComment`;
    axios
      .delete(apiUrl, {
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      })
      .then(function () {
        fetchPRComments();
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  return (
    <Grid>
      <Grid.Col span={8}>
        <Box style={{ display: "flex", justifyContent: "flex-end", marginTop: -40, padding: 10, marginRight: 10 }}>
          <Select
            style={{ flex: 0.2 }}
            placeholder="Filter comments"
            data={[
              "Show Everything (" + apiComments.length + ")",
              "All Comments (" + apiComments.length + ")",
              "My comments (2)",
              "Active (3)",
              "Resolved (2)",
            ]}
            checkIconPosition="left"
            allowDeselect={false}
          />
        </Box>

        {apiComments.map((comment, index) => (
          <Box key={index}>
            <Comment
              key={index}
              id={comment.id}
              author={comment.author}
              text={comment.body}
              date={new Date(comment.updated_at)}
              isResolved={false}
              isAIGenerated={false}
              deletePRComment={() => deletePRComment(comment.id)}
            />
            <br />
          </Box>
        ))}
        <br></br>

        {unresolvedComments.map((comment, index) => (
          <Box key={index}>
            <Comment
              key={index}
              id={index}
              author={comment.author}
              text={comment.text}
              date={comment.date}
              isResolved={false}
              isAIGenerated={false}
              deletePRComment={() => {return }}
            />
            <br />
          </Box>
        ))}

        <Accordion chevronPosition="right" variant="separated">
          {comments2}
        </Accordion>
        <br />
        <SplitButton />
        <br />
        <Box style={{ border: "2px groove gray", borderRadius: 10, padding: "10px" }}>
          <TextEditor content="" addComment={addPRComment} />
        </Box>
      </Grid.Col>
      <Grid.Col span={3}>
        <Box m="md">
          <PRDetailSideBar
            assignees={[]}
            labels={pullRequest?.labels ?? []}
            addedReviewers={pullRequest?.requestedReviewers ?? []}
          />
        </Box>
      </Grid.Col>
    </Grid>
  );
}

export default CommentsTab;
