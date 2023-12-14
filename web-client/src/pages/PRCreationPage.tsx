import {
  Container, Grid, Group, Text, Title, Badge, rem,
  Button, Paper, Stack, List, Flex, Textarea, Box, TextInput, Select, MultiSelect
} from "@mantine/core";
import {IconGitBranch, IconGitCommit, IconUsersGroup, IconFile} from "@tabler/icons-react";
import LabelButton from "../components/LabelButton";

import {useState} from "react";
import WorkloadBar from "../components/WorkloadBar";
import PriorityBadge from "../components/PriorityBadge";
import FileGrouping from "../components/FileGrouping";

function PRCreationPage() {
  const branchIcon = <IconGitBranch style={{ width: rem(12), height: rem(12) }} />;
  //const sparklesIcon = <IconStars color={"yellow"} style={{ width: rem(18), height: rem(18) }} />;
 // const squarePlusIcon = <IconSquarePlus style={{ width: rem(18), height: rem(18) }} />;
  //const iconSquare = <IconSquareRoundedCheckFilled color={"blue"} style={{ width: rem(18), height: rem(18) }}/>;

  const [labelValue, setLabelValue] = useState<string[]>([]);
  const [priority, setPriority] = useState<string | null>('');

  return (
    <Container size={"lg"}>
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
            <Select
              label={"Assign Priority"}
              value={priority} onChange={setPriority}
              placeholder="Assign Priority"
              data={["High", "Medium", "Low"]}
              clearable
            />
            <MultiSelect
               label={"Add Label"}
               placeholder="Select Label"
               data={['bug fix', 'refactoring', 'question', 'enhancement']}
               defaultValue={['React']}
               clearable value={labelValue}
               hidePickedOptions
               onChange={setLabelValue} />
          </Group>
          <Group mt={"md"}>
            <PriorityBadge label={priority} size={"md"}/>
            {
              labelValue.length == 0 ? <Badge variant={"light"}>No Label Added</Badge> : labelValue.map(itm =>(
                <LabelButton key={itm} label={itm} size={"md"}/>
              ))
            }
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


      <FileGrouping name={"Group 1"} id={""} files={["add.py", "add22.py"]} reviewers={["ayse","irem"]}/>


      <Box w={"60%"} mt={"md"}>
        <Stack>
          <Paper withBorder p={"md"}>
            Summary of PR (Generated by bot):
            <Text c={"dimmed"} size={"sm"}>Added a new AuthenticationService to handle user authentication.
              Implemented a user login endpoint in the UserController.
              Created a database migration script to add necessary tables for user authentication.
              Updated the frontend login form to communicate with the new backend endpoint.</Text>
          </Paper>
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
