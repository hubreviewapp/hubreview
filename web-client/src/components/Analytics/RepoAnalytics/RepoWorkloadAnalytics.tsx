import { Avatar, Grid, Group, Progress, ScrollArea, Text, Tooltip } from "@mantine/core";
import BarColor from "../../../utility/WorkloadBarColor.ts";
import { Contributor } from "../../PRDetailSideBar.tsx";

function RepoWorkloadAnalytics() {
  const data: Contributor[] = [
    {
      id: "1",
      login: "user1",
      avatarUrl: "https://example.com/avatar1.jpg",
      currentLoad: 5,
      maxLoad: 10,
    },
    {
      id: "2",
      login: "user2",
      avatarUrl: "https://example.com/avatar2.jpg",
      currentLoad: 8,
      maxLoad: 15,
    },
    {
      id: "3",
      login: "user3",
      avatarUrl: "https://example.com/avatar3.jpg",
      currentLoad: 3,
      maxLoad: 12,
    },
  ];

  return (
    <div>
      <ScrollArea h={200} m="md" scrollbars="y">
        {data.map((itm) => (
          <Grid key={itm.id}>
            <Grid.Col span={4}>
              <Group>
                <Avatar src={itm.avatarUrl} />
                <Text>{itm.login}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={8}>
              <Tooltip label={Math.ceil((itm.currentLoad / itm.maxLoad) * 100) + "%"}>
                <Progress.Root mt="5px" size="lg">
                  <Progress.Section
                    animated
                    color={BarColor(itm.maxLoad, itm.currentLoad)}
                    value={Math.ceil((itm.currentLoad / itm.maxLoad) * 100)}
                  >
                    <Progress.Label>{Math.ceil((itm.currentLoad / itm.maxLoad) * 100)}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Tooltip>
            </Grid.Col>
          </Grid>
        ))}
      </ScrollArea>
    </div>
  );
}

export default RepoWorkloadAnalytics;
