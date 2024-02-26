import { ActionIcon, Box, Button, Checkbox, Divider, Group, Paper, Select, Text, Textarea } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { useState } from "react";
import DiffComment from "./DiffComment";

interface SyntaxHighlighterProps {
  content: string[];
  language?: string;
}

function SyntaxHighlighter({ content, language }: SyntaxHighlighterProps): JSX.Element {
  const highlightedLines = content.map((line) =>
    language ? hljs.highlight(language, line) : hljs.highlightAuto(line),
  );

  const [linesWithPendingComment, setLinesWithPendingComment] = useState<number[]>([]);
  const [linesWithComment] = useState<number[]>([Math.floor(Math.random() * content.length) + 1]);

  return (
    <Box>
      {highlightedLines.map((line, i) => (
        <Box>
          <Group>
            {!linesWithComment.includes(i + 1) && (
              <ActionIcon size="xs" onClick={() => setLinesWithPendingComment((prev) => [...prev, i + 1])}>
                <IconPlus />
              </ActionIcon>
            )}

            <Text px="sm" bg="black" opacity={0.5}>
              {i + 1}
            </Text>

            <pre className="hljs" style={{ margin: 0, flexGrow: 1 }}>
              <code dangerouslySetInnerHTML={{ __html: line.value }} />
            </pre>
          </Group>

          {linesWithComment.includes(i + 1) && <DiffComment />}

          {linesWithPendingComment.includes(i + 1) && (
            <Paper withBorder p="sm">
              <Textarea my="sm">
                This could be wrapped in a Boolean to make sure the type is a boolean instead of string. Isn't that in
                our latest style guideline, @ecekahraman?
              </Textarea>

              <Group>
                <Select value="NIT" data={["NIT"]} label="Label" />
                <Checkbox checked label="Blocking" />
                <Select value="STYLE" data={["STYLE"]} label="Subject" />
              </Group>

              <Divider my={10} />
              <Group justify="end" mt={5}>
                <Button size="sm" color="green">
                  Add single comment
                </Button>
                <Button size="sm" color="green">
                  Start review
                </Button>
              </Group>
            </Paper>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default SyntaxHighlighter;
