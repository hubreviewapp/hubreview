import { Box, Button, Divider, TextInput, Text, Group } from "@mantine/core";
import { randomId } from "@mantine/hooks";
import TextEditor from "../TextEditor";
import DiffComment from "./DiffComment";
import classes from "../../styles/comment.module.css";
import { useState } from "react";

function CommentList() {
  const [replyActive, setReplyActive] = useState(false);
  const [isResolved, setResolved] = useState(false);
  const [isCommentsVisible, setCommentsVisible] = useState(false);

  return (
    <>
      <Box
        className={classes.comment}
        w="80%"
        style={{
          position: "relative",
          width: "100%",
          border: "1px groove gray",
          borderRadius: 20,
        }}
      >
        {isResolved ? (
          <Box p="md">
            <Text onClick={() => setCommentsVisible(!isCommentsVisible)}>
              <Group className={classes.resolved}>
                <div>This conversation is resolved</div>
                {isCommentsVisible ? <Text c="dimmed">Hide Resolved</Text> : <Text c="dimmed">Show Resolved</Text>}
              </Group>
            </Text>
            {isCommentsVisible ? (
              <DiffComment id={randomId} visible={"false"} author={"ayse"} text={"kbhjkjjhbjbbh"} date={"010101"} />
            ) : (
              <Text c="dimmed" />
            )}
            <Box align="right">
              <Divider my="xs" />
              <Button variant="light" onClick={() => setResolved(false)}>
                Unresolve Conversation
              </Button>
            </Box>
          </Box>
        ) : (
          <div>
            <DiffComment id={randomId} visible={"false"} author={"ayse"} text={"kbhjkjjhbjbbh"} date={"010101"} />

            <Box p="md">
              {replyActive ? (
                <div>
                  <TextEditor content="" />
                  <Box align="right">
                    <Button color="gray" mx="md" onClick={() => setReplyActive(false)}>
                      {" "}
                      Cancel{" "}
                    </Button>
                    <Button> Reply </Button>
                  </Box>
                </div>
              ) : (
                <TextInput onClick={() => setReplyActive(true)} placeholder="Enter a reply" />
              )}
              <Box align="right">
                <Divider my="xs" />
                <Button variant="light" onClick={() => setResolved(true)}>
                  Resolve Conversation
                </Button>
              </Box>
            </Box>
          </div>
        )}
      </Box>
    </>
  );
}

export default CommentList;
