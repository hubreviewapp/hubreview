import { Group, rem, Text } from "@mantine/core";
import { IconFile, IconGitCommit, IconPlusMinus } from "@tabler/icons-react";

export interface PRSummaryBoxProps {
  numFiles: number;
  numCommits: number;
  addedLines: number;
  deletedLines: number;
}

function PRSummaryBox({ numFiles, numCommits, deletedLines, addedLines }: PRSummaryBoxProps) {
  return (
    <Group>
      <Group gap="xs">
        <IconFile style={{ width: rem(18), height: rem(18) }} />
        {numFiles}
        <Text fz="sm" c="dimmed">
          File Changed
        </Text>
      </Group>
      <Group gap="xs">
        <IconGitCommit style={{ width: rem(18), height: rem(18) }} />
        {numCommits}
        <Text fz="sm" c="dimmed">
          Commits
        </Text>
      </Group>
      <Group gap="xs">
        <IconPlusMinus style={{ width: rem(18), height: rem(18) }} />
        <Text c="green">+{addedLines}</Text>
        <Text c="red">-{deletedLines}</Text>
      </Group>
    </Group>
  );
}

export default PRSummaryBox;
