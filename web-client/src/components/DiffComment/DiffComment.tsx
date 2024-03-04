import { Text, Avatar, Group, Box, Combobox, rem, useCombobox } from "@mantine/core";
import classes from "../../styles/comment.module.css";
import UserLogo from "../../assets/icons/user.png";
import { IconDotsVertical } from "@tabler/icons-react";
import { useState } from "react";

interface CommentProps {
  id: string;
  author: string;
  text: string;
  date: Date;
}

export function DiffComment({ author, text, date }: CommentProps) {
  const settings = ["Copy Link", "Quote Reply", "Edit", "Delete", "Reply", "Reference in new issue"];
  const options = settings.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));
  const [, setSelectedItem] = useState<string | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  return (
    <>
      <Box className={classes.comment} style={{ position: "relative", width: "100%" }}>
        <Group>
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
              <IconDotsVertical
                onClick={() => combobox.toggleDropdown()}
                style={{ width: rem(18), height: rem(18), marginLeft: 5, marginTop: 10 }}
              />
            </Combobox.Target>

            <Combobox.Dropdown>
              <Combobox.Options>{options}</Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
          <Avatar src={UserLogo} alt="author" radius="xl" />
          <Box display="flex">
            <Box>
              <Text fz="md"> {author}</Text>
              <Text fz="xs" c="dimmed">
                {date.toLocaleString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                })}
              </Text>
            </Box>
          </Box>
          <Text ml="20px"> {text} </Text>
        </Group>
      </Box>
    </>
  );
}

export default DiffComment;
