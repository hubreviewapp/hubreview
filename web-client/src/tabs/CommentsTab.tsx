import Comment from "../components/Comment.tsx";

function CommentsTab() {
  const comments = ["x.py", "y.py", "z.py"]
  return (
    <div>
      {comments.map((comment, index) => (
        <div key={index}>
          <Comment key={comment}
                   id={index}
                   author={"aysekelleci"}
                   text={"In every project I'm using Zodios in, I'm eventually seeing more and more \"implicit any\" " +
            "warnings which go away when restarting the TS language server in VS Code or sometimes even just saving my current file. " +
            "Looks like TS gets confused as to what typings to pick or something like that (just like you suggested)."}
                   date={new Date(2023, 4, 7)}>
          </Comment>
          <br></br>
        </div>
      ))}

      {comments.map((comment) => (
        <h1 key={comment}>{comment}</h1>
      ))}

      <hr></hr>

    </div>
  );
}

export default CommentsTab;
