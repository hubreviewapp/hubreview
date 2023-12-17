import {
  Container,
  Grid,
  Group,
  Text,
  Title,
  Badge,
  rem,
  Button,
  Paper,
  Stack,
  List,
  Flex,
  Textarea,
  Box,
  TextInput,
  Select,
  MultiSelect,
  Modal,
} from "@mantine/core";
import { IconGitBranch, IconGitCommit, IconUsersGroup, IconFile, IconLayoutGridAdd } from "@tabler/icons-react";
import LabelButton from "../components/LabelButton";

import { useState } from "react";
import WorkloadBar from "../components/WorkloadBar";
import PriorityBadge, { PriorityBadgeLabel } from "../components/PriorityBadge";
import FileGrouping from "../components/FileGrouping";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";

type FileGroup = {
  id: number;
  name: string;
  files: string[];
  reviewers: string[];
};

const prFiles = ["Tab.tsx", "style.css", "App.tsx", "data.json"];
const prReviewers = ["irem_aydin", "vedat_xyz", "alper_mum", "ece_kahraman"];

function PRCreationPage() {
  const branchIcon = <IconGitBranch style={{ width: rem(12), height: rem(12) }} />;
  const addIcon = <IconLayoutGridAdd style={{ width: rem(12), height: rem(12) }} />;
  const [labelValue, setLabelValue] = useState<string[]>([]);
  const [groupList, setGroupList] = useState<FileGroup[]>([]);
  const [groupCount, setGroupCount] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [reviewerList, setReviewerList] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityBadgeLabel>(null);
  const [opened, { open, close }] = useDisclosure(false);

  function addGroupToList() {
    const obj: FileGroup = {
      name: groupName,
      id: groupCount,
      files: fileList,
      reviewers: reviewerList,
    };
    setGroupList([...groupList, obj]);
    setGroupName("");
    setReviewerList([]);
    setFileList([]);
    setGroupCount(groupCount + 1);
    close();
  }
  /* TODO
  function removeGroup(id: number) {
    const obj: FileGroup[] = groupList.filter((itm) => itm.id != id);

    setGroupList(obj);
  }
   */
  return (
    <Container size={"lg"}>
      <Grid>
        <Grid.Col span={8}>
          <Title mt={"md"} order={3} c={"dimmed"}>
            Create a New PR
          </Title>
          <Group mt={"20px"} mb={"20px"}>
            <Title order={3}>Eventium</Title>
            <Text c={"dimmed"}>from</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{ textTransform: "lowercase" }}>
              add_button
            </Badge>
            <Text c={"dimmed"}>to</Text>
            <Badge leftSection={branchIcon} color={"gray"} size={"md"} style={{ textTransform: "lowercase" }}>
              main
            </Badge>
            <Text>
              <IconGitCommit style={{ width: rem(12), height: rem(12) }} /> 9 commits
            </Text>
            <Text c={"dimmed"} size={"xs"}>
              Last commit 3 days ago
            </Text>
          </Group>
          <Group>
            <Select
              label={"Assign Priority"}
              value={priority}
              onChange={(val) => setPriority(val as PriorityBadgeLabel)}
              placeholder="Assign Priority"
              data={["High", "Medium", "Low"]}
              clearable
            />
            <MultiSelect
              label={"Add Label"}
              placeholder="Select Label"
              data={["bug fix", "refactoring", "question", "enhancement"]}
              defaultValue={["React"]}
              clearable
              value={labelValue}
              hidePickedOptions
              onChange={setLabelValue}
            />
          </Group>
          <Group mt={"md"}>
            <PriorityBadge label={priority} size={"md"} />
            {labelValue.length == 0 ? (
              <Badge variant={"light"}>No Label Added</Badge>
            ) : (
              labelValue.map((itm) => <LabelButton key={itm} label={itm} size={"md"} />)
            )}
          </Group>
          <Grid mt={"md"}>
            <Grid.Col span={4}>
              <Button leftSection={addIcon} size={"sm"} variant={"subtle"} onClick={open}>
                Add File Group
              </Button>
            </Grid.Col>
            <Grid.Col span={8}>
              <Group>
                {groupList.map((itm) => (
                  <FileGrouping key={itm.id} name={itm.name} id={itm.id} files={itm.files} reviewers={itm.reviewers} />
                ))}
              </Group>
            </Grid.Col>
          </Grid>
          <Box mt={"md"}>
            <Stack>
              <Paper withBorder p={"md"}>
                Summary of PR (Generated by bot):
                <Text c={"dimmed"} size={"sm"}>
                  Added a new AuthenticationService to handle user authentication. Implemented a user login endpoint in
                  the UserController. Created a database migration script to add necessary tables for user
                  authentication. Updated the frontend login form to communicate with the new backend endpoint.
                </Text>
              </Paper>
              <TextInput withAsterisk label="Add a title" placeholder="Enter..." />
              <Textarea label="Add a description" placeholder="Enter..." />
              <Flex justify={"flex-end"}>
                <Button m={"md"} color={"red"}>
                  Delete
                </Button>
                <Button m={"md"} color={"gray"} variant={"outline"}>
                  Save Draft
                </Button>
                <Button m={"md"}>Create</Button>
              </Flex>
            </Stack>
          </Box>
        </Grid.Col>
        <Grid.Col span={4}>
          <Group mt={"md"}>
            <Paper mt={"md"} p={"sm"} withBorder>
              <Group>
                <IconUsersGroup style={{ width: rem(18), height: rem(18) }} />
                <Text>Contributors</Text>
              </Group>
              <List size={"sm"} withPadding type={"ordered"}>
                {prReviewers.map((itm) => (
                  <List.Item key={itm}>{itm}</List.Item>
                ))}
              </List>
            </Paper>
            <Paper mt={"md"} p={"sm"} withBorder>
              <Group>
                <IconFile style={{ width: rem(18), height: rem(18) }} />
                <Text>Changed Files</Text>
              </Group>
              <List size={"sm"} withPadding type={"ordered"}>
                {prFiles.map((itm) => (
                  <List.Item key={itm}>{itm}</List.Item>
                ))}
              </List>
            </Paper>
          </Group>
          <WorkloadBar />
        </Grid.Col>
      </Grid>

      <Modal opened={opened} onClose={close} title="Create a Group">
        <Stack m={"md"}>
          <TextInput
            withAsterisk
            label={"Group name"}
            value={groupName}
            onChange={(event) => setGroupName(event.currentTarget.value)}
          />
          <MultiSelect withAsterisk label="Select Files" data={prFiles} value={fileList} onChange={setFileList} />
          <MultiSelect
            withAsterisk
            label="Select Reviewers"
            data={prReviewers}
            value={reviewerList}
            onChange={setReviewerList}
          />
        </Stack>
        <Group justify={"flex-end"}>
          <Button color={"gray"} onClick={close}>
            Close
          </Button>
          <Link to={"/createPR"}>
            <Button variant="contained" onClick={addGroupToList}>
              Add
            </Button>
          </Link>
        </Group>
      </Modal>
    </Container>
  );
}

export default PRCreationPage;
