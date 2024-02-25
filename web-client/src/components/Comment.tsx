import { Text, Avatar, Group, Select, Box, rem, Badge } from "@mantine/core";
import { Combobox, useCombobox, Input, Button } from "@mantine/core";
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import { IconDots, IconSparkles, IconBrandSlack } from "@tabler/icons-react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { useState } from "react";

interface CommentProps {
  id: number;
  author: string;
  text: string;
  date: Date;
  isResolved?: boolean;
  isAIGenerated?: boolean;
}

export function Comment({ id, author, text, date, isResolved, isAIGenerated }: CommentProps) {
  const { owner, repoName } = useParams();
  const settings = ["Copy Link", "Quote Reply", "Edit", "Delete", "Reply", "Reference in new issue"];

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
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
      }}
    >
      {item}
    </Combobox.Option>
  ));

  //[HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
  function deletePRComment(commentId: number) {
    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${commentId}/deleteComment`;
    axios
      .delete(apiUrl, {
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }

  return (
    <>
      {isAIGenerated && (
        <Badge leftSection={iconSparkles} mb={3} variant="gradient" style={{ visibility: "visible" }}>
          PR Summary
        </Badge>
      )}
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
          <Box display={"flex"}>
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
            <Text style={{ maxWidth: "100%", wordWrap: "break-word" }}> {text} </Text>
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
    </>
  );
}

export default Comment;
