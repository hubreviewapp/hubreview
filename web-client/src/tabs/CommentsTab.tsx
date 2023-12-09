import Comment from "../components/Comment.tsx";

function CommentsTab() {
  const comments = ["x.py", "y.py", "z.py"];
  return (
    <div>
      {comments.map((comment) => (
        <Comment key={comment}></Comment>
      ))}

      {comments.map((comment) => (
        <h1 key={comment}>{comment}</h1>
      ))}

      <hr></hr>
    </div>
  );
}

export default CommentsTab;
