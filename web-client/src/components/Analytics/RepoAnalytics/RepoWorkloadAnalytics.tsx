import { Avatar, Grid, Group, Progress, ScrollArea, Text, Tooltip } from "@mantine/core";
import BarColor from "../../../utility/WorkloadBarColor.ts";
import { Contributor } from "../../PRDetailSideBar.tsx";
import { AnalyticsProps } from "./ReviewStatusAnalytics.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";

function RepoWorkloadAnalytics({ repoName, owner }: AnalyticsProps) {
  //getPRReviewerSuggestion/hubreviewapp/hubreview/null
  const [data, setData] = useState<Contributor[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/getPRReviewerSuggestion/${owner}/${repoName}/null`, {
          withCredentials: true,
        });
        if (res) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Error fetching RepoWorkloadAnalytics info:", error);
      }
    };

    fetchData().then();
  }, []); // eslint-disable-line

  return (
    <div>
      <ScrollArea h={300} m="md" scrollbars="y">
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
