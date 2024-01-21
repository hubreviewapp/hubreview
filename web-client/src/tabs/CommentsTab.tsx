import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import {Container, Box, Accordion, Text} from "@mantine/core";
import SplitButton from "../components/SplitButton.tsx";

const comments = [
  {
    author: 'aysekelleci',
    text: "In every project I'm using Zodios in, I'm eventually seeing more and more \"implicit any\" " +
      "warnings which go away when restarting the TS language server in VS Code or sometimes even just saving my current file. " +
      "Looks like TS gets confused as to what typings to pick or something like that (just like you suggested).",
    date: new Date(2023, 4, 7),
    content: "Bender Bending Rodríguez, (born September 4, 2996), designated Bending Unit 22, and commonly known as Bender, is a bending unit created by a division of MomCorp in Tijuana, Mexico, and his serial number is 2716057. His mugshot id number is 01473. He is Fry's best friend.",
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
    <Accordion.Item value={index+''} key={index}>
      <Accordion.Control>
        <Comment
          key={index}
          id={index}
          author= {comment.author}
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
    <Container>
      {unresolvedComments.map((comment, index) => (
        <Box key={index} >
          <Comment
            key={index}
            id={index}
            author= {comment.author}
            text={comment.text}
            date={comment.date}
            isResolved={comment.isResolved}
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

      <Box style={{ border: "2px groove gray", borderRadius: 10, padding:"10px" }}>
        <TextEditor></TextEditor>
      </Box>

      <br></br>
      <br></br>
      <br></br>
    </Container>
  );
}

export default CommentsTab;
