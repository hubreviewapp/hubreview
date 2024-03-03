import { Container, Grid, Group, Title, Button, Stack, Flex, Box, TextInput, MultiSelect, Modal } from "@mantine/core";

import { useEffect, useState } from "react";
import PRDetailsBox from "../components/PRCreate/PRDetailsBox";
import FileGrouping from "../components/PRCreate/FileGrouping";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import PRSummaryBox from "../components/PRCreate/PRSummaryBox";
import CommitHistory from "../components/PRCreate/CommitHistory";
import CompareBranchBox from "../components/PRCreate/CompareBranchBox";
import ChangedFilesList from "../components/PRCreate/ChangedFilesList";
import PRDescription from "../components/PRCreate/PRDescription";

type FileGroup = {
  id: number;
  name: string;
  files: string[];
  reviewers: string[];
};

const prFiles = ["Tab.tsx", "style.css", "App.tsx", "data.json"];
const prReviewers = ["irem_aydin", "vedat_xyz", "alper_mum", "ece_kahraman"];

function PRCreationPage() {
  const [groupList, setGroupList] = useState<FileGroup[]>([]);
  const [groupCount, setGroupCount] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [reviewerList, setReviewerList] = useState<string[]>([]);
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

  return (
    <Container size="lg">
      <Box>
        <Title mt="md" order={3} c="dimmed">
          Create a New PR
        </Title>
        <Group mt="20px" mb="20px">
          <Title order={3}>Eventium</Title>
          <CompareBranchBox />
        </Group>
      </Box>
      <Grid>
        <Grid.Col span={8}>
          <Box>
            <Stack>
              <PRDescription />
              <TextInput withAsterisk label="Add a title" placeholder="Enter..." />
              <Flex justify="flex-end">
                <Button m="md" color="gray" variant="outline">
                  Save Draft
                </Button>
                <Button m="md">Create</Button>
              </Flex>
            </Stack>
          </Box>
        </Grid.Col>
        <Grid.Col span={4}>
          <PRDetailsBox />
        </Grid.Col>
      </Grid>
      <Box my="md">
        <PRSummaryBox numFiles={5} numCommits={8} addedLines={0} deletedLines={0} />
      </Box>
      <CommitHistory />
      <Group>
        <ChangedFilesList />
        <Box display="flex" w="70%" h="300px">
          {groupList.map((group) => (
            <FileGrouping
              key={group.id}
              name={group.name}
              id={group.id}
              files={group.files}
              reviewers={group.reviewers}
            />
          ))}
          <Button m="md" onClick={open}>
            Add File Group
          </Button>
        </Box>
      </Group>
      <Modal opened={opened} onClose={close} title="Create a Group">
        <Stack m="md">
          <TextInput
            withAsterisk
            label="Group name"
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
        <Group justify="flex-end">
          <Button color="gray" onClick={close}>
            Close
          </Button>
          <Link to="/createPR">
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
