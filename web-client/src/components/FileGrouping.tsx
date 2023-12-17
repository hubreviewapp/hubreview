import { Text, Box, Paper, Group, Button, rem, Collapse, List } from "@mantine/core";
import { IconFiles } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

interface FileGroupingProps {
  name: string;
  id: number;
  files: string[];
  reviewers: string[];
}

function FileGrouping({ name, id, files, reviewers }: FileGroupingProps) {
  const iconFiles = <IconFiles style={{ width: rem(18), height: rem(18) }} />;
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box m={"md"}>
      <Button variant={"outline"} onClick={toggle} leftSection={iconFiles}>
        {id} . {name}
      </Button>
      <Collapse in={opened}>
        <Paper p={"md"} w={"300px"} withBorder>
          <Group mb={"md"}>
            <Box>
              <Text>Group Files</Text>
              <List size={"sm"} withPadding type={"ordered"}>
                {files.map((itm) => (
                  <List.Item key={itm}>
                    <Text size={"sm"} color={"#76aacc"}>
                      {itm}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </Box>

            <Box>
              <Text>Group Reviewers</Text>
              <List size={"sm"} withPadding type={"ordered"}>
                {reviewers.map((itm) => (
                  <List.Item key={itm}>
                    <Text size={"sm"} color={"#76aacc"}>
                      {itm}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </Box>
          </Group>

          <Group justify={"flex-end"}>
            <Button size={"compact-xs"} color={"red"}>
              Delete
            </Button>
            <Button size={"compact-xs"}>Edit</Button>
          </Group>
        </Paper>
      </Collapse>
    </Box>
  );
}

export default FileGrouping;
