import {
  Grid,
  Group,
  Paper,
  Box,
  Progress,
  rem,
  UnstyledButton,
  Text,
  Tooltip,
  Badge, Flex,
  Avatar, ScrollArea, MultiSelect, TextInput, Divider, Select, CloseButton
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import UserLogo4 from "../assets/icons/user4.png";
import PriorityBadge, {PriorityBadgeLabel} from "./PriorityBadge";
import LabelButton from "./LabelButton";
import {IconXboxX} from '@tabler/icons-react';
import {useParams} from "react-router-dom";
import axios from "axios";

function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}

export interface PRDetailSideBarProps {
  addedReviewers: object[],
  assignees: string[],
  labels: object[],
}

const hubReviewLabels = [
  {name: "bug", color: "d73a4a", key: "bug"},
  {name: "enhancement", color: "a2eeef", key: "enhancement"},
  {name: "refactoring", color: "6f42c1", key: "refactoring"},
  {name: "question", color: "0075ca", key: "question"},
  {name: "suggestion", color: "28a745", key: "suggestion"},
];

function PRDetailSideBar({addedReviewers, labels}: PRDetailSideBarProps) {
  const {owner, repoName, prnumber} = useParams();
  const reviewers = [
    {
      id: 0,
      username: "cgtysafak",
      capacity: 10,
      waiting: 9,
    },
    {
      id: 1,
      username: "vedat-arican",
      capacity: 10,
      waiting: 6,
    },

  ];
  const iconInfo = <IconInfoCircle style={{width: rem(18), height: rem(18)}}/>;
  const [reviewerList, setReviewerList] = useState<number[]>([]);
  const [labelList, setLabelList] = useState<object[]>([]);
  const [addedReviewer, setAddedReviewers] = useState<object[]>([]);
  const [priority, setPriority] = useState<PriorityBadgeLabel>(null);
  const [query, setQuery] = useState('');
  const filtered = reviewers.filter((item) => item.username.toLowerCase().includes(query.toLowerCase()));
  const removeFromReviewerList = (id: number) => {
    setReviewerList(reviewerList.filter(itm => itm != id));
  }

  const handleAddLabel = (labelName) => {
    if (labelName.length < labelList.length) {
      console.log("delete label");
      return;
    }

    const stringToObject = hubReviewLabels.filter(l => labelName.includes(l.name));
    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addLabel`;
    axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    }).post(apiUrl, labelName)
      .then(function (response) {
        setLabelList(labelList.concat(stringToObject.filter((elem2) => !labelList.some((elem1) => elem1.name === elem2.name))));
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  useEffect(() => {
    if (labels.length != 0) {
      setLabelList(labels);
    }
  }, [labels]);

  useEffect(() => {
    if (addedReviewers.length != 0) {
      setAddedReviewers(addedReviewers);
    }
  }, [addedReviewers]);

  //HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/remove_reviewer/{reviewer}")]
  const deleteReviewer = (reviewer) => {
    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/remove_reviewer/${reviewer}`;
    axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    }).delete(apiUrl)
      .then(function () {
        console.log(reviewer);
        setAddedReviewers(addedReviewer.filter(item => item.login.toString() != reviewer))
        console.log(addedReviewer);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

return (
  <Box w="300px">
    <Paper p="sm" withBorder>
      <Box>
        <Grid>
          <Grid.Col span={10}>
            <Text fw={500} size="md" mb="sm">
              Reviewers
            </Text>
            {
              addedReviewer.length == 0 ?
                <Text c="dimmed">No reviewer added</Text>
                :
                addedReviewer.map(reviewer => (
                  <Flex justify="space-between" key={reviewer.id} mb="sm">
                    <Group>
                      <Avatar src={reviewer.avatarUrl} size="sm"/>
                      <Text size="sm"> {reviewer.login} </Text>
                    </Group>
                    <CloseButton onClick={()=>deleteReviewer(reviewer.login)} icon={<IconXboxX size={18} stroke={1.5}/>}/>
                  </Flex>
                ))
            }
          </Grid.Col>
          <Grid.Col span={6}>
          </Grid.Col>
        </Grid>
        <Divider mb="md"/>
        <Grid my="sm">
          <Grid.Col span={5}>
            <Text fw={500} size="md">
              Suggestions
            </Text>
          </Grid.Col>
          <Grid.Col span={5}>
            <Text size="xs" c="dimmed">
              Reviewer Workload
            </Text>
          </Grid.Col>
          <Grid.Col span={1}>
            <Box>
              <Tooltip label="waiting reviews / reviewer capacity">
                <Badge leftSection={iconInfo} variant="transparent"/>
              </Tooltip>
            </Box>
          </Grid.Col>
        </Grid>
        <Box my="sm">
          <TextInput
            size="xs"
            radius="xl"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            placeholder="Search Users"
          />
        </Box>
        <ScrollArea h={100} mt="5px" scrollbars="y">
          {filtered.map((itm) => (
            <Grid key={itm.id}>
              <Grid.Col span={5}>
                <Group>
                  <Text size="xs">{itm.username}</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={4}>
                <Progress.Root mt="5px" size="lg">
                  <Progress.Section color={barColor(itm.capacity, itm.waiting)}
                                    value={(itm.waiting / itm.capacity) * 100}>
                    <Progress.Label>{(itm.waiting / itm.capacity) * 100}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Grid.Col>
              <Grid.Col span={1}>
                {
                  reviewerList.find(id => id == itm.id) == undefined ?
                    <UnstyledButton style={{fontSize: "12px"}}
                                    onClick={() => setReviewerList([...reviewerList, itm.id])}>Request</UnstyledButton>
                    :
                    <UnstyledButton style={{color: "darkcyan", fontSize: "12px", alignContent: "end"}}
                                    onClick={() => removeFromReviewerList(itm.id)}>Requested</UnstyledButton>
                }
              </Grid.Col>
            </Grid>
          ))}
        </ScrollArea>
      </Box>
      <Divider mt="md"/>
      <Grid my="sm">
        <Grid.Col span={6}>
          <Group>
            <Text fw={500} size="md">
              Assignees
            </Text>
          </Group>
        </Grid.Col>
        <Grid.Col span={4}>
        </Grid.Col>
        <Grid.Col span={2}>
          <Tooltip label="assign up to 1 person" style={{marginLeft: -50}}>
            <Badge leftSection={iconInfo} variant="transparent"/>
          </Tooltip>
        </Grid.Col>
      </Grid>
      <Group style={{marginBottom: 5}}>
        <Box>
          <Avatar src={UserLogo4} size="sm"/>
        </Box>
        <Text size="sm"> irem_aydın </Text>
      </Group>

      <Divider mt="md"/>
      <Box mt="sm">
        <Select
          label="Assign Priority"
          value={priority}
          onChange={(val) => setPriority(val as PriorityBadgeLabel)}
          placeholder="Assign Priority"
          data={["High", "Medium", "Low"]}
          clearable
          mb="sm"
        />
        <PriorityBadge label={priority} size="md"/>
      </Box>
      <Divider mt="md"/>

      <MultiSelect
        my="sm"
        label="Add Label"
        placeholder="Select Label"
        value={labelList.map(l => l.name)}
        data={hubReviewLabels.map(l => l.name)}
        clearable
        hidePickedOptions
        onChange={(lbl) => handleAddLabel(lbl)}
      />
      <Group mt="md">
        {labelList.length == 0 ? (
          <Badge variant="light">No Label Added</Badge>
        ) : (
          labelList.map((itm) => <LabelButton key={itm.name} label={itm.name} color={itm.color} size="md"/>)
        )}
      </Group>

    </Paper>
  </Box>
);
}

export default PRDetailSideBar;
