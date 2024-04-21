import { Flex, Paper, Text, Title } from "@mantine/core";
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/analytics/${owner}/${repoName}`, {
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
  }, []); // eslint-disable-line
  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Priority Distribution of PRs
      </Title>
      <Flex justify="center">
        {repoData.map((itm) => (
          <Text c="dimmed" key={itm.name} mr="sm">
            {itm.name}:{itm.value}
          </Text>
        ))}
      </Flex>
      <DonutChart mt="md" data={repoData} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default PriorityDataAnalytics;
