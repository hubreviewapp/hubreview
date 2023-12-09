import { Text, Avatar, Group, TypographyStylesProvider, Paper } from "@mantine/core";
import classes from "../styles/comment.module.css";

export function Comment() {
  return (
    <Paper withBorder radius="md" className={classes.comment}>
      <Group>
        <Avatar
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png"
          alt="Jacob Warnhalter"
          radius="xl"
        />
        <div>
          <Text fz="sm">Jacob Warnhalter</Text>
          <Text fz="xs" c="dimmed">
            10 minutes ago
          </Text>
        </div>
      </Group>
      <TypographyStylesProvider className={classes.body}>
        <div
          className={classes.content}
          dangerouslySetInnerHTML={{
            __html: "<p>Comment 1</p>",
          }}
        />
      </TypographyStylesProvider>
    </Paper>
  );
}

export default Comment;
