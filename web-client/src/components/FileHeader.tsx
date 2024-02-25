import { Box, Paper, Title, Flex, Text, UnstyledButton, Divider, rem } from "@mantine/core";
import { IconMessage } from "@tabler/icons-react";

interface FileHeaderProps {
  fileName: string;
  author: string;
  lastUpdate: Date;
  numOfAddedLines: number;
  numOfDeletedLines: number;
  numberOfResolvedComments: number;
  numberOfActiveComments: number;
}
function FileHeader({
  fileName,
  author,
  lastUpdate,
  numOfAddedLines,
  numOfDeletedLines,
  numberOfResolvedComments,
  numberOfActiveComments,
}: FileHeaderProps) {
  return (
    <Paper w="100%" h="100px">
      <Box my="sm">
        <Title order={3} mb="sm">
          {fileName}
        </Title>
        <Flex gap="md">
          <Text c="dimmed">
            Last updated on {lastUpdate.toDateString()} by {}
            <UnstyledButton c="blue">{author}</UnstyledButton>
          </Text>
          <Divider orientation="vertical" />
          <Text c="green"> + {numOfAddedLines}</Text>
          <Text c="red"> - {numOfDeletedLines}</Text>
          <Divider orientation="vertical" />
          <IconMessage style={{ width: rem(22), height: rem(22) }} />
          {numberOfActiveComments} / {numberOfResolvedComments} Resolved
        </Flex>
      </Box>
      <Divider />
    </Paper>
  );
}

export default FileHeader;
