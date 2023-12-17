import { Text, Avatar, Group, Paper } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";

interface CommentProps {
  // Define the props you want to pass to PrDetailPage
  id: number;
  author: string;
  text: string;
  date: Date;
}

export function Comment({ author, text, date }: CommentProps) {
  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg">
      <Group>
        <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
        <div>
          <Text fz="sm"> {author}</Text>
          <Text fz="xs" c="dimmed">
            {date.toString()}
          </Text>
        </div>
      </Group>
      <h5> {text}</h5>
      <div />
    </Paper>
  );
}

export default Comment;
