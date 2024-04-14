import { Text, Avatar, Group, Select, Box, rem, Badge } from "@mantine/core";
import { Combobox, useCombobox, Input, Button, Accordion } from "@mantine/core";
import classes from "../styles/comment.module.css";
import { IconArrowBarDown, IconDots, IconSparkles, IconMessageCheck } from "@tabler/icons-react";
import Markdown from "react-markdown";
import { useState } from "react";
import convertHtmlToMarkdown from "../utility/convertHtmlToMarkdown";
import TextEditor from "./TextEditor.tsx";

interface CommentProps {
  id: number;
  author: string;
  text: string;
  date: Date;
  isResolved?: boolean;
  isAIGenerated?: boolean;
  deletePRComment: (id: number) => void;
  editPRComment: (id: number, body: string) => void;
  updatePRCommentStatus: (id: number, status: string | null) => void;
  replyComment: (id: number, body: string) => void;
  status: string;
  avatar: string;
  url: string;
}

export function Comment({
  id,
  author,
  text,
  date,
  isResolved,
  isAIGenerated,
  deletePRComment,
  editPRComment,
  avatar,
  url,
  status,
  replyComment,
  updatePRCommentStatus,
}: CommentProps) {
  const settings = ["Copy Link", "Edit", "Delete", "Quote Reply"];
  const [, setSelectedItem] = useState<string | null>(null);
  const [isEditActive, setIsEditActive] = useState<boolean>(false);
  const combobox = useCombobox({
    //  onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const icon = (
    <IconMessageCheck
      style={{
        width: rem(20),
        height: rem(20),
      }}
    />
  );

  const iconSparkles = <IconSparkles style={{ width: rem(22), height: rem(22) }} />;
  const [replyValue, setReplyValue] = useState("");

  const options = settings.map((item) => (
    <Combobox.Option
      value={item}
      key={item}
      onClick={() => {
        if (item === "Delete") {
          deletePRComment(id);
        }
        if (item === "Edit") {
          setIsEditActive(true);
        }
        if (item === "Copy Link") {
          navigator.clipboard
            .writeText(url)
            .then(() => {})
            .catch((error) => {
              console.error("Error copying link:", error);
            });
        }
      }}
    >
      {item}
    </Combobox.Option>
  ));

  return (
    <>
      {isAIGenerated && (
        <Badge leftSection={iconSparkles} mb={3} variant="gradient" style={{ visibility: "visible" }}>
          PR Summary
        </Badge>
      )}
      {!isEditActive && !isResolved && (
        <Box
          className={classes.comment}
          style={{
            position: "relative",
            width: "100%",
            border: isAIGenerated ? "solid 0.5px cyan" : "1px groove gray",
            borderRadius: 20,
          }}
        >
          <Group>
            <Avatar src={avatar} alt="author" radius="xl" />
            <Box display="flex">
              <Box>
                <Text fz="md"> {author}</Text>
                <Text fz="xs" c="dimmed">
                  {date.toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Box>
              <Box style={{ position: "absolute", right: "5px", display: "flex" }}>
                <Select
                  key={id}
                  placeholder="Mark as resolved"
                  //active , pending  --> active
                  // closed --> spam, abuse, off topic
                  data={["Active", "Pending", "Closed", "Outdated", "Resolved", "Duplicate"]}
                  onChange={(val) => updatePRCommentStatus(id, val)}
                  checkIconPosition="left"
                  defaultValue={status ? status : null}
                  //defaultValue="Open"
                  allowDeselect={false}
                />
                <Combobox
                  store={combobox}
                  width={250}
                  position="bottom-start"
                  withArrow
                  onOptionSubmit={(val) => {
                    setSelectedItem(val);
                    combobox.closeDropdown();
                  }}
                >
                  <Combobox.Target>
                    <IconDots
                      onClick={() => combobox.toggleDropdown()}
                      style={{ width: rem(18), height: rem(18), marginLeft: 5, marginTop: 10 }}
                    />
                  </Combobox.Target>

                  <Combobox.Dropdown>
                    <Combobox.Options>{options}</Combobox.Options>
                  </Combobox.Dropdown>
                </Combobox>
              </Box>
            </Box>
          </Group>
          <>
            <Markdown>{convertHtmlToMarkdown(text)}</Markdown>
            <Box style={{ display: "flex" }}>
              <Input
                radius="xl"
                style={{ marginTop: "5px", marginBottom: "5px", marginRight: "5px", flex: 0.9 }}
                placeholder="Reply"
                onChange={(e) => setReplyValue(e.target.value)}
              />
              <Button onClick={() => replyComment(id, replyValue)}>Submit </Button>
            </Box>
          </>
        </Box>
      )}
      {!isEditActive && isResolved && (
        <Accordion
          chevronPosition="right"
          variant="separated"
          chevron={<IconArrowBarDown style={{ width: rem(27), height: rem(27) }} />}
          style={{ borderRadius: 20 }}
        >
          <Accordion.Item value={id + ""} key={id}>
            <Accordion.Control>
              <Box
                className={classes.comment}
                style={{
                  position: "relative",
                  width: "100%",
                  border: "none",
                  borderRadius: 20,
                }}
              >
                <Group>
                  <Avatar src={avatar} alt="author" radius="xl" />
                  <Box display="flex">
                    <Box>
                      <Text fz="md"> {author}</Text>
                      <Text fz="xs" c="dimmed">
                        {date.toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Box>
                    <Box style={{ position: "absolute", right: "5px", display: "flex" }}>
                      <Select
                        leftSection={icon}
                        key={id}
                        placeholder="Mark as resolved"
                        data={["Active", "Pending", "Closed", "Outdated", "Resolved", "Duplicate"]}
                        onChange={(val) => updatePRCommentStatus(id, val)}
                        checkIconPosition="left"
                        defaultValue={status ? status : null}
                        allowDeselect={false}
                      />
                      <Combobox
                        store={combobox}
                        width={250}
                        position="bottom-start"
                        withArrow
                        onOptionSubmit={(val) => {
                          setSelectedItem(val);
                          combobox.closeDropdown();
                        }}
                      >
                        <Combobox.Target>
                          <IconDots
                            onClick={() => combobox.toggleDropdown()}
                            style={{ width: rem(18), height: rem(18), marginLeft: 5, marginTop: 10 }}
                          />
                        </Combobox.Target>

                        <Combobox.Dropdown>
                          <Combobox.Options>{options}</Combobox.Options>
                        </Combobox.Dropdown>
                      </Combobox>
                    </Box>
                  </Box>
                </Group>
              </Box>
            </Accordion.Control>
            <Accordion.Panel>
              <Markdown>{convertHtmlToMarkdown(text)}</Markdown>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {isEditActive && (
        <TextEditor content={text} editComment={editPRComment} setIsEditActive={setIsEditActive} commentId={id} />
      )}
    </>
  );
}

export default Comment;
