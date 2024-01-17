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
  Avatar, ScrollArea, Select, MultiSelect, TextInput,
} from "@mantine/core";
import {IconInfoCircle } from "@tabler/icons-react";
import {useState} from "react";
import UserLogo from "../../assets/icons/user2.png";
import PriorityBadge, {PriorityBadgeLabel} from "../PriorityBadge";
import LabelButton from "../LabelButton";
import classes from "./CreatePR.module.scss";


function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}
function PRDetailsBox() {
  const reviewers = [
    {
      id: 0,
      username: "ayse_kelleci",
      capacity: 10,
      waiting: 3,
    },
    {
      id: 1,
      username: "ece_kahraman",
      capacity: 8,
      waiting: 5,
    },
    {
      id: 2,
      username: "alper_mumcular",
      capacity: 10,
      waiting: 9,
    },
    {
      id: 3,
      username: "ayse_kelleci",
      capacity: 10,
      waiting: 6,
    },
    {
      id: 4,
      username: "ayse_kelleci",
      capacity: 10,
      waiting: 4,
    },
  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;

  const [reviewerList, setReviewerList] = useState<number[]>([]);
  const [priority, setPriority] = useState<PriorityBadgeLabel>(null);
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
            <Grid.Col span={5}>
              <Text fw={500} size="md">
                Reviewers
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

        <ScrollArea h={130} mt="5px" scrollbars="y">
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
        <Box className={classes.borderBottom}/>
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
        <Box className={classes.borderBottom}/>
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

export default PRDetailsBox;
