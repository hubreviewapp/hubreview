import { Box, Button, Divider, Group, Flex, Radio, Stack, Text, Title, Popover } from "@mantine/core";
import SyntaxHighlighter from "../components/SyntaxHighlighter";
import TextEditor from "../components/TextEditor";

export type ModifiedFile = {
  fileName: string;
  lines: string[]; // FIXME: this needs to be replaced with an actual diff parser
};

function ModifiedFilesTab() {
  const modifiedFiles: ModifiedFile[] = [
    {
      fileName: "sample1.ts",
      lines: ["-const isEnabled = inputText;", "+const isEnabled = Boolean(inputText)"],
    },
    {
      fileName: "sample2.ts",
      lines: ["-const isEnabled = inputText;", "+const isEnabled = Boolean(inputText)"],
    },
    {
      fileName: "sample3.ts",
      lines: ["-const isEnabled = inputText;", "+const isEnabled = Boolean(inputText)"],
    },
  ];

  return (
    <Box w="90%">
      <Flex justify="flex-end" mb="sm">
        <Popover width={700} trapFocus position="bottom" shadow="md">
          <Popover.Target>
            <Button>Submit Review</Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Box>
              <Title order={5}>Submit Review</Title>
              <TextEditor content="" />
              <Title order={5}>Status</Title>
              <Stack mt="sm">
                <Radio checked label="Comment indifferently" styles={{ label: { color: "lightgray" } }} />
                <Radio label="Approve" styles={{ label: { color: "lime" }, radio: { border: "1px solid lime" } }} />
                <Radio
                  label="Request changes"
                  styles={{ label: { color: "crimson" }, radio: { border: "1px solid crimson" } }}
                />
              </Stack>

              <Divider my={10} />
              <Group justify="end" mt={5}>
                <Text fs="italic">Including 4 comments</Text>
                <Button size="sm" color="green">
                  Submit
                </Button>
              </Group>
            </Box>
          </Popover.Dropdown>
        </Popover>
      </Flex>

      {modifiedFiles.map((f) => (
        <Box key={f.fileName} mb="md" style={{ border: "1px solid gray", borderRadius: "5px" }} p="sm">
          <Box>
            <Text>{f.fileName}</Text>
          </Box>
          <SyntaxHighlighter content={f.lines} language="diff" />
        </Box>
      ))}
    </Box>
  );
}

export default ModifiedFilesTab;
