import {Button, Menu, Group, ActionIcon, rem, Text} from '@mantine/core';
import {IconChevronDown} from '@tabler/icons-react';
import classes from './SplitButton.module.scss';

function SplitButton() {
  return (
    <Group wrap="nowrap" gap={0}>
      <Button color="green" className={classes.button}>Merge Pull Request</Button>
      <Menu transitionProps={{transition: 'pop'}} position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="filled"
            color="green"
            size={36}
            className={classes.menuControl}
          >
            <IconChevronDown style={{width: rem(16), height: rem(16)}} stroke={1.5}/>
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>
            Create a merge commit
            <Text c="dimmed" mt="xs" fz="xs" w="250px">
                All commits from this branch will be added
              to the base branch via a merge commit.
            </Text>
          </Menu.Item>
          <Menu.Item>
            Squash and merge
            <Text mt="xs" c="dimmed" fz="xs" w="250px">
             The 1 commit from this branch will be added to the base branch.
            </Text>
          </Menu.Item>
          <Menu.Item>
            Rebase and merge
            <Text mt="xs" c="dimmed" fz="xs" w="250px">
              The 1 commit from this branch will be rebased and added to the base branch.
            </Text>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

export default SplitButton;
