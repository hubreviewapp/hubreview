import {
  Container, Grid, Group, Text, Title, Badge, rem,
  Button, Paper, Stack, List, Flex, Modal, Checkbox, Textarea, Box, TextInput
} from "@mantine/core";
import {IconSquareRoundedCheckFilled,IconGitBranch, IconGitCommit, IconStars, IconSquarePlus, IconUsersGroup, IconFile} from "@tabler/icons-react";
import LabelButton from "../components/LabelButton";
import {useDisclosure} from "@mantine/hooks";
import {useState} from "react";
import WorkloadBar from "../components/WorkloadBar";

function PRCreationPage() {
  const branchIcon = <IconGitBranch style={{ width: rem(12), height: rem(12) }} />;
  const sparklesIcon = <IconStars color={"yellow"} style={{ width: rem(18), height: rem(18) }} />;
  const squarePlusIcon = <IconSquarePlus style={{ width: rem(18), height: rem(18) }} />;
  const iconSquare = <IconSquareRoundedCheckFilled color={"blue"} style={{ width: rem(18), height: rem(18) }}/>;

  const [opened, { open, close }] = useDisclosure(false);
  const [checkboxValue, setCheckboxValue] = useState<string[]>([]);

  const labelList: { label: string, key: number }[] = [
    { label: "enhancement", key: 1 },
    { label: "bug fix", key: 1 },
    { label: "refactoring", key: 3 },
    { label: "question", key: 4 }
  ];
  return (
    <Container size={"lg"}>
      <Modal opened={opened} onClose={close} title="Add Label">
        <Checkbox.Group value={checkboxValue} onChange={setCheckboxValue}>
        {
            labelList.map(itm =>
                <Checkbox
                  key={itm.key}
                  label={itm.label.toUpperCase()}
                  value={itm.label}
                  color="lime"
                  radius="lg"
                  size="md"
                  mt={"md"}
                />
            )
          }
        </Checkbox.Group>
        <Group justify={"flex-end"}>
          <Button onClick={close} color={"gray"} size={"sm"} >Close</Button>
          <Button onClick={()=>setCheckboxValue([])} color={"gray"} variant={"outline"} size={"sm"} >Clear</Button>
        </Group>
      </Modal>
      <Grid>
        <Grid.Col span={8}>
          <Title mt={"md"} order={3} c={"dimmed"}>Create a New PR</Title>
          <Group mt={"20px"} mb={"20px"}>
            <Title order={3}>Eventium</Title>
            <Text c={"dimmed"}>from</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{textTransform: "lowercase"}}>add_button</Badge>
            <Text c={"dimmed"}>to</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{textTransform: "lowercase"}}>main</Badge>
            <Text><IconGitCommit style={{ width: rem(12), height: rem(12) }} />  9 commits</Text>
            <Text c={"dimmed"} size={"xs"}>Last commit 3 days ago</Text>
          </Group>
          <Group>
            {iconSquare}
            Able to merge
            <Button leftSection={sparklesIcon} size={"xs"} variant={"subtle"} radius={"lg"}>Assign Priority</Button>
            {
              checkboxValue.map(itm =>(
                <LabelButton key={itm} label={itm} size={"md"}/>
              ))
            }
            <Button onClick={open} leftSection={squarePlusIcon} size={"xs"} variant={"subtle"} radius={"lg"}>Add Label</Button>
          </Group>
          <Group>
          <Paper mt={"md"} p={"sm"} withBorder>
            <Group>
              <IconUsersGroup style={{ width: rem(18), height: rem(18) }} />
              <Text>Contributors</Text>
            </Group>
            <List size={"sm"} withPadding type={"ordered"}>
              <List.Item>Vedat_Arican</List.Item>
              <List.Item>Irem_Aydin</List.Item>
              <List.Item>Gulcin_Eyupoglu</List.Item>
            </List>
          </Paper>
          <Paper mt={"md"} p={"sm"} withBorder>
            <Group>
              <IconFile style={{ width: rem(18), height: rem(18) }} />
              <Text>Changed Files</Text>
            </Group>
            <List size={"sm"} withPadding type={"ordered"}>
              <List.Item>SignIn.tsx</List.Item>
              <List.Item>App.tsx</List.Item>
              <List.Item>style.css</List.Item>
            </List>
          </Paper>
          </Group>
        </Grid.Col>
        <Grid.Col span={4}>
          <WorkloadBar/>
        </Grid.Col>
      </Grid>
      <Box w={"60%"} mt={"md"}>
        <Stack>
          <TextInput
            withAsterisk
            label="Add a title"
            placeholder="Enter..."
          />
          <Textarea
            label="Add a description"
            placeholder="Enter..."
          />
          <Flex justify={"flex-end"}>
            <Button m={"md"} color={"red"}>Delete</Button>
            <Button m={"md"} color={"gray"} variant={"outline"}>Save Draft</Button>
            <Button m={"md"}>Create</Button>
          </Flex>
        </Stack>

      </Box>
    </Container>
   );
}

export default PRCreationPage;
