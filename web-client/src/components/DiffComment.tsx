import { Avatar, Badge, Button, Divider, Group, Paper, Text, TextInput } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import { ReviewComment } from "../tabs/ModifiedFilesTab";

export interface DiffCommentProps {
  comment: ReviewComment;
  isPending: boolean;
}

function DiffComment({ comment, isPending }: DiffCommentProps) {
  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg">
      <Divider my={9} />
      <Group>
        <Badge size="md" color="#888" key={1} mb={4}>
          {comment.label}
        </Badge>

        <Badge size="md" color="green" key={2} mb={4}>
          {comment.decoration}
        </Badge>

        {isPending && (
          <Badge size="md" color="orange" variant="light" key={3} mb={4}>
            Pending
          </Badge>
        )}
      </Group>
      <Group>
        <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
        <div>
          <Text fz="sm">AUTHOR</Text>
          <Text fz="xs" c="dimmed">
            {new Date(2023, 4, 7).toLocaleString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
            })}
          </Text>
        </div>
      </Group>
      <h5>{comment.content}</h5>
      <div />

      <TextInput placeholder="Reply..."></TextInput>

      {!isPending && (
        <>
          <Divider my={10} />
          <Group justify="start" mt={5}>
            <Button size="sm" color="green">
              Resolve comment
            </Button>
            {/*
        <Text c="gray" size="sm">
          ecekahraman was requested to review this comment
        </Text>
        */}
          </Group>
        </>
      )}
    </Paper>
  );
}

export default DiffComment;
