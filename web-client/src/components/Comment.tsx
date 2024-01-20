import {Text, Avatar, Group, Paper, Select, Box, rem} from "@mantine/core";
import { Switch, Combobox, useCombobox} from '@mantine/core';
import classes from "../styles/comment.module.css";
import UserLogo from "../assets/icons/user.png";
import {IconDots} from '@tabler/icons-react';

import { useState } from 'react';


interface CommentProps {
  id: number;
  author: string;
  text: string;
  date: Date;
  isResolved?: boolean;
}

export function Comment({ author, text, date, isResolved }: CommentProps) {
  const [showComment, setShowComment] = useState(false);
  const groceries = ['Copy Link', 'Quote Reply', 'Edit', 'Delete', 'Reply', 'Reference in new issue']

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const handleToggleComment = () => {
    setShowComment(!showComment);
  };

  const options = groceries.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Paper withBorder radius="md" className={classes.comment} shadow="lg" style={{ position: 'relative', width: '100%' }}>
      <Group>
        <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
        <Box display={"flex"}>
          <Box>
            <Text fz="sm"> {author}</Text>
            <Text fz="xs" c="dimmed">
              {date.toLocaleString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
              })}
            </Text>
          </Box>
          <Box style={{ position: 'absolute', right: '5px', display:"flex"}}>
            <Select
              placeholder="Mark as resolved"
              data={['Resolved', "Won't fix", 'Closed', 'Open']}
              checkIconPosition="left"
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
                  style={{ width: rem(18), height: rem(18), marginLeft: 5}} />

              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>{options}</Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </Box>
        </Box>
      </Group>
      {isResolved && (
        <>
          <h5> {showComment ? text : 'Comment is resolved.'}</h5>
          <Switch checked={showComment} onChange={handleToggleComment} label="Show Comment" />
        </>
      )}
      <div />
    </Paper>
  );
}

export default Comment;

