import Comment from "../components/Comment.tsx";
import TextEditor from "../components/TextEditor.tsx";
import {Container, Box} from "@mantine/core";

function CommentsTab() {
  const comments = ["x.py", "y.py", "z.py"];
  return (
    <Container>
      {comments.map((comment, index) => (
        <Box key={index} >
          <Comment
            key={comment}
            id={index}
            author="aysekelleci"
            text={
              "In every project I'm using Zodios in, I'm eventually seeing more and more \"implicit any\" " +
              "warnings which go away when restarting the TS language server in VS Code or sometimes even just saving my current file. " +
              "Looks like TS gets confused as to what typings to pick or something like that (just like you suggested)."
            }
            date={new Date(2023, 4, 7)}
          ></Comment>
          <br></br>
        </Box>
      ))}
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
