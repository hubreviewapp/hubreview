import {
  Container, Grid, Group, Text, Title, Badge, rem,
  Button, Paper, Stack, List,Flex
} from "@mantine/core";
import {IconGitBranch, IconGitCommit, IconStars,IconCirclePlus, IconSquarePlus, IconUsersGroup, IconFile} from "@tabler/icons-react";
import LabelButton from "../components/LabelButton";
import WorkloadBarProps from "../components/WorkloadBarProps";

function PRCreationPage() {
  const branchIcon = <IconGitBranch style={{ width: rem(12), height: rem(12) }} />;
  const sparklesIcon = <IconStars color={"yellow"} style={{ width: rem(18), height: rem(18) }} />;
  const squarePlusIcon = <IconSquarePlus style={{ width: rem(18), height: rem(18) }} />;
  return (
    <Container size={"lg"}>

      <Grid>
        <Grid.Col span={8}>
          <Title mt={"md"} order={3} c={"dimmed"}>Create a New PR</Title>
          <Group mt={"20px"} mb={"20px"}>
            <Text order={3}>Eventium</Text>
            <Text c={"dimmed"}>from</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{textTransform: "lowercase"}}>add_button</Badge>
            <Text c={"dimmed"}>to</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{textTransform: "lowercase"}}>main</Badge>
            <Text><IconGitCommit style={{ width: rem(12), height: rem(12) }} />  9 commits</Text>
            <Text c={"dimmed"} size={"xs"}>Last commit 3 days ago</Text>
          </Group>
          <Group>
            <Button leftSection={sparklesIcon} size={"xs"} variant={"subtle"} radius={"lg"}>Assign Priority</Button>
            <LabelButton key={1} label={"Refactoring"} size={"md"}/>
            <LabelButton key={2} label={"bug fix"} size={"md"}/>
            <Button leftSection={squarePlusIcon} size={"xs"} variant={"subtle"} radius={"lg"}>Add Label</Button>
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
          <Paper shadow="xl" radius="md" p="md" mt={"lg"} withBorder>
            <Stack>
              <Group>
                <Text fw={500} size={"lg"}>Assign Reviewer</Text>
                <Text ml={"md"} size={"sm"} color={"#415A77"}>Reviewer Workload</Text>
              </Group>
              <Grid>
                <Grid.Col span={6}>
                  <Group>
                    <IconCirclePlus color={"green"} style={{width: rem(22), height: rem(22) }} />
                    <Text>Ayse_Kelleci</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <WorkloadBarProps workload={40}/>
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={6}>
                  <Group>
                    <IconCirclePlus color={"green"} style={{width: rem(22), height: rem(22) }} />
                    <Text>Alper_Mumcular</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <WorkloadBarProps workload={60}/>
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={6}>
                  <Group>
                    <IconCirclePlus color={"green"} style={{width: rem(22), height: rem(22) }} />
                    <Text>Ece_kahraman</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <WorkloadBarProps workload={90}/>
                </Grid.Col>
              </Grid>

              <Flex justify={"space-evenly"}>
                <Button size={"xs"} variant={"filled"}>Assign</Button>
                <Button size={"xs"} variant={"light"} >Split PR into Reviewers</Button>
              </Flex>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

    </Container>
   );
}

export default PRCreationPage;
