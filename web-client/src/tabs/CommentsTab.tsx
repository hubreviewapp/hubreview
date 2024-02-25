import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import SplitButton from "../components/SplitButton.tsx";
import {Box, Text, Accordion, Flex} from "@mantine/core";
import CommentList from "../components/DiffComment/CommentList";
import PRDetailSideBar from "../components/PRDetailSideBar";
import {useParams} from "react-router-dom";
import axios from "axios";
import {useEffect, useState} from "react";

const comments = [
  {
    author: 'irem_aydın',
    text: "This pull request addresses a critical bug in the user authentication " +
      "module. The issue stemmed from improper handling of user sessions, leading to unexpected logouts. The changes in this " +
      "PR include a comprehensive fix to the session management, ensuring a seamless user experience by preventing inadvertent logouts. " +
      "Additionally, the code has been optimized for better performance, and thorough testing, including unit and integration " +
      "tests, has been conducted to validate the solution. Reviewers are encouraged to focus on the modifications in the " +
      "authentication module, paying attention to code readability, maintainability, and adherence to coding standards. " +
      "This PR is a crucial step in maintaining the reliability and stability of our application.",
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: true
  },
  {
    author: 'aysekelleci',
    text: "In every project I'm using Zodios in, I'm eventually seeing more and more \"implicit any\" " +
      "warnings which go away when restarting the TS language server in VS Code or sometimes even just saving my current file. " +
      "Looks like TS gets confused as to what typings to pick or something like that (just like you suggested).",
    date: new Date(2023, 4, 7),
    isResolved: true,
    isAIGenerated: false
  },

  {
    author: 'ecekahraman',
    text: 'Consider choosing a more descriptive variable name in the `functionX`.',
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: false

  },

  {
    author: 'aysekelleci',
    text: 'Think about adding unit tests for future improvements.',
    date: new Date(2023, 4, 7),
    isResolved: false,
    isAIGenerated: false

  },
];
export interface CommentsTabProps{
  pullRequest: object[],
}
//    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
function CommentsTab({pullRequest}:CommentsTabProps) {
  const resolvedComments = comments.filter(comment => comment.isResolved);
  const unresolvedComments = comments.filter(comment => !comment.isResolved);
  const [commentList, setCommentList] = useState([]);

  const {owner, repoName, prnumber} = useParams();
  const fetchContributors = async () => {
    try {
      const res = await axios.get(`http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/get_comments`, {
        withCredentials: true
      });

      if (res.data) {
        console.log(res.data);
        setCommentList(res.data);
      }
    } catch (error) {
      console.error("Error fetching contributors:", error);
    }
  };
  useEffect(() => {
    fetchContributors();
  }, []);

  const comments2 = resolvedComments.map((comment, index) => (
    <Accordion.Item value={index + ''} key={index}>
      <Accordion.Control>
        <Comment
          key={index}
          id={index}
          author={comment.author}
          text={comment.text}
          date={comment.date}
          isResolved={comment.isResolved}
        />
      </Accordion.Control>
      <Accordion.Panel>
        <Text size="sm"> {comment.text}</Text>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Flex mx="lg">
      <Box>
        {commentList.map((comment, index) => (
          <Box key={index}>
            <Comment
              key={index}
              id={index}
              author={comment.author}
              text={comment.body}
              date={comment.created_at}
              isResolved={false}
              isAIGenerated={false}
            />
            <br/>
          </Box>
        ))}
        <Accordion chevronPosition="right" variant="separated">
          {comments2}
        </Accordion>
        <br/>
        <SplitButton/>
        <br/>
        <Box style={{border: "2px groove gray", borderRadius: 10, padding: "10px"}}>
          <TextEditor content=""/>
        </Box>
        <Box/>
      </Box>
      <Box m="md">
        <PRDetailSideBar assignees={[]} labels={pullRequest?.labels ??[]} addedReviewers={pullRequest?.requestedReviewers ??[]}/>
      </Box>
    </Flex>

  );
}

export default CommentsTab;
