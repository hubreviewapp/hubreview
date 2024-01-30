import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import SplitButton from "../components/SplitButton.tsx";
import { Container, Box, Text, Grid, Accordion, Select } from "@mantine/core";
import PRDetailSideBar from "../components/PRDetailSideBar.tsx";

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
    isResolved: true
  },

  {
    author: 'ecekahraman',
    text: 'Consider choosing a more descriptive variable name in the `functionX`.',
    date: new Date(2023, 4, 7),
    isResolved: true
  },

  {
    author: 'aysekelleci',
    text: 'Think about adding unit tests for future improvements.',
    date: new Date(2023, 4, 7),
    isResolved: false
  },
];
function CommentsTab() {
  const resolvedComments = comments.filter(comment => comment.isResolved);
  const unresolvedComments = comments.filter(comment => !comment.isResolved);

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
        ></Comment>
      </Accordion.Control>
      <Accordion.Panel>
        <Text size="sm"> {comment.text}</Text>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Grid>
      <Grid.Col span={8}>
        <Container style={{marginTop:-30}}>
          <Box style={{display:"flex", justifyContent: "flex-end"}}>
            <Select style={{flex: 0.2, marginBottom:-10}}
                    placeholder="Filter comments"
                    data={['Show Everything (10)', 'All Comments (5)', 'My comments (2)', 'Active (3)', 'Resolved (2)']}
                    checkIconPosition="left"
                    allowDeselect={false}
            />
          </Box>
          {unresolvedComments.map((comment, index) => (
            <Box key={index} >
              <Comment
                key={index}
                id={index}
                author={comment.author}
                text={comment.text}
                date={comment.date}
                isResolved={comment.isResolved}
                isAIGenerated={comment.isAIGenerated}
              ></Comment>
              <br></br>
            </Box>
          ))}
          <Accordion chevronPosition="right" variant="separated" >
            {comments2}
          </Accordion>

          <br></br>

          <SplitButton></SplitButton>
          <br></br>

          <Box style={{ border: "2px groove gray", borderRadius: 10, padding: "10px" }}>
            <TextEditor></TextEditor>
          </Box>

          <Box style={{ height: 100 }}></Box>
        </Container>
      </Grid.Col>

      <Grid.Col span={3}>
        <PRDetailSideBar />
      </Grid.Col>
    </Grid>
  );
}

export default CommentsTab;
