import { Button, Menu, Group, ActionIcon, rem, Text } from "@mantine/core";
import { Box, Popover } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import classes from "./SplitButton.module.scss";
import { IconGitMerge, IconX, IconCheck } from "@tabler/icons-react";

function SplitButton() {
  return (
    <div>
      <Popover
        withArrow
        arrowOffset={14}
        arrowSize={15}
        width={200}
        position="right-start"
        offset={{ mainAxis: 15, crossAxis: 0 }}
      >
        <Popover.Target>
          <Box
            style={{ position: "relative", backgroundColor: "dimgray", width: 140, borderRadius: 10, display: "flex" }}
          >
            <IconGitMerge style={{ width: rem(50), height: rem(50), marginTop: 0, marginLeft: 10 }} />
            <Text size="sm" fw={700} c="#A30000">
              {" "}
              Not Able to Merge
            </Text>
          </Box>
        </Popover.Target>
        <Popover.Dropdown style={{ width: 770 }}>
          <Box style={{ display: "flex" }}>
            <Box>
              <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
            </Box>
            <Text color="red" fw={700} style={{ marginTop: 15 }}>
              Review required (2/3)
            </Text>
          </Box>
          <Text size="sm">At least 3 approving review is required by reviewers with write access.</Text>
          <Text size="sm" td="underline" c="blue">
            See all reviewers
          </Text>
          <hr></hr>
          <Box style={{ display: "flex" }}>
            <Box>
              <IconCheck color="green" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
            </Box>
            <Text fw={700} style={{ marginTop: 15 }}>
              All checks have passed
            </Text>
          </Box>
          <Text size="sm">2 successful checks</Text>
          <hr></hr>
          <Box style={{ display: "flex" }}>
            <Box>
              <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
            </Box>
            <Text color="red" style={{ marginTop: 15 }}>
              Merging is blocked
            </Text>
          </Box>
          <Text size="sm">Merging can be performed automatically with 3 approving reviews.</Text>

          <br></br>
          <Group wrap="nowrap" gap={0} style={{ border: "1px groove gray", width: 250 }}>
            <Button disabled color="green" className={classes.button}>
              Merge Pull Request
            </Button>
            <Menu transitionProps={{ transition: "pop" }} position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon disabled variant="filled" color="gray" size={36} className={classes.menuControl}>
                  <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item>
                  Create a merge commit
                  <Text c="dimmed" mt="xs" fz="xs" w="250px">
                    All commits from this branch will be added to the base branch via a merge commit.
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
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

export default SplitButton;
