import { Text, Avatar, Group, Select, Box, rem, Badge } from "@mantine/core";
import { Combobox, useCombobox, Input, Button } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import { IconDots, IconSparkles, IconBrandSlack } from "@tabler/icons-react";
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
}: CommentProps) {
  const settings = ["Copy Link", "Quote Reply", "Edit", "Delete", "Reply", "Reference in new issue"];
  const [, setSelectedItem] = useState<string | null>(null);
  const [isEditActive, setIsEditActive] = useState<boolean>(false);
  const combobox = useCombobox({
    //  onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const iconSparkles = <IconSparkles style={{ width: rem(22), height: rem(22) }} />;

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
      {!isEditActive && (
        <Box
          className={classes.comment}
          style={{
            position: "relative",
            width: "100%",
            border: isResolved ? "none" : isAIGenerated ? "solid 0.5px cyan" : "1px groove gray",
            borderRadius: 20,
          }}
        >
          <Group>
            <Avatar src={UserLogo} alt="author" radius="xl" />
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
                  placeholder="Mark as resolved"
                  //active , pending  --> active
                  // closed --> spam, abuse, off topic
                  data={["Active", "Pending", "Closed", "Outdated", "Resolved", "Duplicate"]}
                  checkIconPosition="left"
                  defaultValue={isResolved ? "Resolved" : undefined}
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

          {!isResolved && (
            <>
              <Markdown>{convertHtmlToMarkdown(text)}</Markdown>
              <Box style={{ display: "flex" }}>
                <Input
                  radius="xl"
                  style={{ marginTop: "5px", marginBottom: "5px", marginRight: "5px", flex: 0.9 }}
                  placeholder="Reply"
                />
                <Button> Submit </Button>

                <Button variant="default" style={{ marginLeft: 10 }}>
                  <IconBrandSlack />
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
      {isEditActive && (
        <TextEditor content={text} editComment={editPRComment} setIsEditActive={setIsEditActive} commentId={id} />
      )}
    </>
  );
}

export default Comment;
