import { Avatar, Badge, Button, Divider, Group, Paper, Text, TextInput } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";

function DiffComment() {
  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg">
      <Divider my={9} />
      <Group>
        <Badge size="md" color="#888" key={1} mb={4}>
          nit
        </Badge>

        <Badge size="md" color="green" key={1} mb={4}>
          non-blocking
        </Badge>
        <Badge size="md" color="purple" key={1} mb={4}>
          style
        </Badge>
      </Group>
      <Group>
        <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
        <div>
          <Text fz="sm">aysekelleci</Text>
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
      <h5>
        This could be wrapped in a Boolean to make sure the type is a boolean instead of string. Isn't that in our
        latest style guideline, @ecekahraman?
      </h5>
      <div />

      <TextInput placeholder="Reply..."></TextInput>

      <Divider my={10} />
      <Group justify="start" mt={5}>
        <Button size="sm" color="green">
          Resolve comment
        </Button>
        <Text c="gray" size="sm">
          ecekahraman was requested to review this comment
        </Text>
      </Group>
    </Paper>
  );
}

export default DiffComment;
