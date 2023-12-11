import {
  Button,
  Flex,
  Grid,
  Group,
  Paper,
  Box,
  Progress,
  rem,
  Stack,
  Text,
  Tooltip,
  Badge,
} from "@mantine/core";
import {IconCirclePlus, IconInfoCircle} from "@tabler/icons-react";


function barColor(capacity:number, waiting:number){
  const workload = waiting / capacity * 100;
  return workload > 80 ? "red" :
    workload > 60 ? "orange" : workload > 40 ? "yellow" :
      "green";
}
function WorkloadBar(){

  const reviewers = [
    {
      id: 1,
      username: "ayse_kelleci",
      capacity: 10,
      waiting: 3
    },
    {
      id: 2,
      username: "ece_kahraman",
      capacity: 8,
      waiting: 5
    },
    {
      id: 3,
      username: "alper_mumcular",
      capacity: 10,
      waiting: 9
    },
  ]
    const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }}/>;
  return(
  <Paper shadow="xl" radius="md" p="sm" mt={"lg"} withBorder>
    <Stack>
      <Group>
        <Text fw={500} size={"lg"}>Assign Reviewer</Text>
        <Text size={"sm"} color={"#415A77"}>Reviewer Workload</Text>
        <Box>
          <Tooltip label={"The workload percentage was calculated based on the number of reviews assigned to " +
          "users in relation to the specified review capacity."}>
            <Badge leftSection={iconInfo} variant={"transparent"}/>
          </Tooltip>
        </Box>
      </Group>
      {
        reviewers.map(itm=>(
          <Grid key={itm.id}>
            <Grid.Col span={6}>
              <Group>
                <IconCirclePlus color={"green"} style={{width: rem(22), height: rem(22) }} />
                <Text size={"sm"}>{itm.username}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={4}>
              <Progress m={"5px"} size={"lg"} color={barColor(itm.capacity, itm.waiting)} value={(itm.waiting/ itm.capacity)*100}/>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text c={"dimmed"} size={"sm"}>
                {itm.waiting}/
                  {itm.capacity} </Text>
            </Grid.Col>
          </Grid>
        ))
      }
      <Flex justify={"space-evenly"}>
        <Button size={"xs"} variant={"filled"}>Assign</Button>
        <Button size={"xs"} variant={"light"} >Split PR into Reviewers</Button>
      </Flex>
    </Stack>
  </Paper>
  );
}

export default WorkloadBar;
