import { Button, Center, Flex, Paper, Popover, SegmentedControl, Text, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { AnalyticsProps } from "./ReviewStatusAnalytics.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";

function PriorityDataAnalytics({ repoName, owner }: AnalyticsProps) {
  const data = [
    { name: "Unassigned", value: 0, color: "gray.6" },
    { name: "Low", value: 0, color: "green.6" },
    { name: "Medium", value: 0, color: "yellow.6" },
    { name: "High", value: 0, color: "orange.6" },
    { name: "Critical", value: 0, color: "red.6" },
  ];

  function handlePriority(resData: number[]) {
    const newData = [];

    for (let i = 0; i < 5; i++) {
      newData.push({ name: data[i].name, value: resData[i], color: data[i].color });
    }
    return newData;
  }

  const [repoData, setRepoData] = useState(data);
  const [value, setValue] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const end = value == "all" ? "all" : "";
        const res = await axios.get(`${BASE_URL}/api/github/analytics/${owner}/${repoName}/${end}`, {
          withCredentials: true,
        });
        if (res) {
          setRepoData(handlePriority(res.data));
        }
      } catch (error) {
        console.error("Error fetching Priority Info info:", error);
      }
    };

    fetchData().then();
  }, [value]); // eslint-disable-line
  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Priority Distribution of PRs
      </Title>
      <SegmentedControl
        value={value}
        onChange={setValue}
        data={[
          { label: "All PRs", value: "all" },
          { label: "Active PRs", value: "active" },
        ]}
      />
      {repoData.length == 0 ? (
        <Center>
          <Paper m="xl" p="md" withBorder>
            No Data Available.
          </Paper>
        </Center>
      ) : (
        <></>
      )}
      <Flex justify="center">
        <Popover width={200} position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Button mt="sm" variant="light">
              See Labels
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            {repoData.map((itm) => (
              <Text c="dimmed" key={itm.name} mr="sm">
                {itm.name}:{itm.value}
              </Text>
            ))}
          </Popover.Dropdown>
        </Popover>
      </Flex>

      <DonutChart mt="md" data={repoData} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default PriorityDataAnalytics;
