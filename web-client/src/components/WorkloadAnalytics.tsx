import { Button, Flex, Grid, Group, Paper, Box, Progress, rem, Stack, Text, Tooltip, Badge } from "@mantine/core";
import { IconUser, IconInfoCircle } from "@tabler/icons-react";

function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}
function WorkloadAnalytics() {
  const reviewers = [
    {
      id: 1,
      username: "ayse_kelleci",
      capacity: 10,
      waiting: 3,
    },
    {
      id: 2,
      username: "ece_kahraman",
      capacity: 8,
      waiting: 5,
    },
    {
      id: 3,
      username: "alper_mumcular",
      capacity: 10,
      waiting: 9,
    },
  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
  return (
    <Box w="470px">
      <Paper h="250px" shadow="xl" radius="md" p="sm" mt="lg" withBorder>
        <Stack>
          <Text ta="center" fw={500} size="lg" mb="sm">
            Reviewer Workload
            <Tooltip label="The workload percentage was calculated based on the number of reviews assigned to users in relation to the specified review capacity.">
              <Badge leftSection={iconInfo} variant="transparent" />
            </Tooltip>
          </Text>
          {reviewers.map((itm) => (
            <Grid key={itm.id}>
              <Grid.Col span={4}>
                <Group>
                  <IconUser style={{ width: rem(22), height: rem(22), cursor: "pointer" }} />
                  <Text size="sm">{itm.username}</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={4}>
                <Progress.Root m="5px" size="lg">
                  <Progress.Section
                    color={barColor(itm.capacity, itm.waiting)}
                    value={(itm.waiting / itm.capacity) * 100}
                  >
                    <Progress.Label>{(itm.waiting / itm.capacity) * 100}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Grid.Col>
              <Grid.Col span={2}>
                  <Text c="dimmed" size="sm">
                    {itm.waiting}/{itm.capacity}{" "}
                  </Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Text td="underline" color="blue">Details</Text>
              </Grid.Col>

            </Grid>
          ))}
          <Flex justify="space-evenly">
            <Button variant="filled">See More</Button>
          </Flex>
        </Stack>
      </Paper>
    </Box>
  );
}

export default WorkloadAnalytics;
