import { Box, Group, rem, Text } from "@mantine/core";
import { IconFile, IconGitCommit, IconUsersGroup } from "@tabler/icons-react";
import classes from "./CreatePR.module.scss";

export interface PRSummaryBoxProps {
  numContributors: number;
  numFiles: number;
  numCommits: number;
}

function PRSummaryBox({ numContributors, numFiles, numCommits }: PRSummaryBoxProps) {
  return (
    <Box className={classes.capsuleBox}>
      <Group ml="xl">
        <IconFile style={{ width: rem(18), height: rem(18) }} />
        {numFiles}
        <Text fz="sm" c="dimmed">
          File Changed
        </Text>
      </Group>
      <Group>
        <IconUsersGroup style={{ width: rem(18), height: rem(18) }} />
        {numContributors}
        <Text fz="sm" c="dimmed">
          Contributors
        </Text>
      </Group>
      <Group mr="xl">
        <IconGitCommit style={{ width: rem(18), height: rem(18) }} />
        {numCommits}
        <Text fz="sm" c="dimmed">
          Commits
        </Text>
      </Group>
    </Box>
  );
}

export default PRSummaryBox;
