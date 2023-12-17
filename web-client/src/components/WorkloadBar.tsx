import { Button, Flex, Grid, Group, Paper, Box, Progress, rem, Stack, Text, Tooltip, Badge } from "@mantine/core";
import { IconCirclePlus, IconInfoCircle } from "@tabler/icons-react";

function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}
function WorkloadBar() {
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
    <Box w="370px">
      <Paper h="280px" shadow="xl" radius="md" p="sm" mt="lg" withBorder>
        <Stack>
          <Text ta="center" fw={500} size="lg">
            Assign Reviewer
          </Text>
          <Grid>
            <Grid.Col span={5}></Grid.Col>
            <Grid.Col span={5}>
              <Text size="sm" c="dimmed">
                Reviewer Workload
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Box>
                <Tooltip label="waiting reviews / reviewer capacity">
                  <Badge leftSection={iconInfo} variant="transparent" />
                </Tooltip>
              </Box>
            </Grid.Col>
          </Grid>

          {reviewers.map((itm) => (
            <Grid key={itm.id}>
              <Grid.Col span={6}>
                <Group>
                  <Box>
                    <IconCirclePlus color="green" style={{ width: rem(22), height: rem(22), cursor: "pointer" }} />
                  </Box>
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
            </Grid>
          ))}
          <Flex justify="space-evenly">
            <Button size="xs" variant="filled">
              Assign
            </Button>
          </Flex>
        </Stack>
      </Paper>
    </Box>
  );
}

export default WorkloadBar;
