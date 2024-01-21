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
  Badge,
  Avatar, ScrollArea, MultiSelect, TextInput, Divider,
} from "@mantine/core";
import {IconInfoCircle } from "@tabler/icons-react";
import {useState} from "react";
import UserLogo from "../assets/icons/user.png";
import UserLogo2 from "../assets/icons/user2.png";
import UserLogo3 from "../assets/icons/user3.png";
import UserLogo4 from "../assets/icons/user4.png";
import {PriorityBadgeLabel} from "./PriorityBadge";
import LabelButton from "./LabelButton";
import {IconCheck, IconClock} from '@tabler/icons-react';

function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}
function PRDetailSideBar() {
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
    {
      id: 2,
      username: "ece_kahraman",
      capacity: 8,
      waiting: 5,
    },
    {
      id: 3,
      username: "aysekelleci",
      capacity: 10,
      waiting: 3,
    },

  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
  const [reviewerList, setReviewerList] = useState<number[]>([]);
  const [labelValue, setLabelValue] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const filtered = reviewers.filter((item) => item.username.toLowerCase().includes(query.toLowerCase()));

  const removeFromReviewerList = (id:number) => {
    setReviewerList(reviewerList.filter(itm=> itm !=id));
  }

  return (
    <Box >
      <Paper p="sm" withBorder>
        <Box>
          <Grid>
            <Grid.Col span={10}>
              <Text fw={500} size="md">
                Reviewers
              </Text>
              <Group style={{marginBottom:5}}>
                <Box>
                  <Avatar src={UserLogo} size="sm"  />
                </Box>
                <Text size="sm"> aysekelleci </Text>
                <IconCheck
                  color= "green" style={{ width: rem(20), height: rem(20), marginLeft:25}} />
              </Group>

              <Group style={{marginBottom:5}}>
                <Box>
                  <Avatar src={UserLogo2} size="sm"  />
                </Box>
                <Text size="sm"> ece_kahraman </Text>
                <IconCheck
                  color= "green" style={{ width: rem(20), height: rem(20)}} />
              </Group>

              <Group>
                <Box>
                  <Avatar src={UserLogo3} size="sm"  />
                </Box>
                <Text size="sm"> alper_mumcular </Text>
                <IconClock
                  style={{ width: rem(20), height: rem(20)}} />
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
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
          <Divider mt="md"/>
          <Grid>
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
                  <Badge leftSection={iconInfo} variant="transparent" />
                </Tooltip>
              </Box>
            </Grid.Col>
          </Grid>
          <ScrollArea h={65} mt="5px" scrollbars="y">
            {filtered.map((itm) => (
              <Grid key={itm.id}>
                <Grid.Col span={5}>
                  <Group>
                    <Box>
                      <Avatar src={UserLogo} size="sm"  />
                    </Box>
                    <Text size="xs">{itm.username}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Progress.Root mt="5px" size="lg">
                    <Progress.Section color={barColor(itm.capacity, itm.waiting)} value={(itm.waiting / itm.capacity) * 100}>
                      <Progress.Label>{(itm.waiting / itm.capacity) * 100}%</Progress.Label>
                    </Progress.Section>
                  </Progress.Root>
                </Grid.Col>
                <Grid.Col span={1}>
                  {
                    reviewerList.find(id => id == itm.id) == undefined ?
                      <UnstyledButton style={{fontSize:"12px"}} onClick={()=>setReviewerList([...reviewerList, itm.id])}>Request</UnstyledButton>
                      :
                      <UnstyledButton style={{color:"darkcyan", fontSize:"12px", alignContent:"end"}} onClick={()=>removeFromReviewerList(itm.id)}>Requested</UnstyledButton>
                  }
                </Grid.Col>
              </Grid>
            ))}
          </ScrollArea>
        </Box>
        <Divider mt="md"/>
        <Grid>
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
              <Badge leftSection={iconInfo} variant="transparent" />
            </Tooltip>
          </Grid.Col>
        </Grid>
        <Group style={{marginBottom:5}}>
          <Box>
            <Avatar src={UserLogo4} size="sm"  />
          </Box>
          <Text size="sm"> irem_aydın </Text>
        </Group>
        <Divider mt="md"/>
        <MultiSelect
          label="Add Label"
          placeholder="Select Label"
          data={["Bug Fix" , "Enhancement" , "Refactoring" , "Question" , "Suggestion"]}
          clearable
          value={labelValue}
          hidePickedOptions
          onChange={setLabelValue}
        />
        <Group mt="md">
          {labelValue.length == 0 ? (
            <Badge variant="light">No Label Added</Badge>
          ) : (
            labelValue.map((itm) => <LabelButton key={itm} label={itm} size="md"/>)
          )}
        </Group>
      </Paper>
    </Box>
  );
}

export default PRDetailSideBar;
