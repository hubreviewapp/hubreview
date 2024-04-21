import { Flex, Paper, SegmentedControl, Text, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { AnalyticsProps } from "./ReviewStatusAnalytics.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";

interface UpdateValues {
  refactoring: number;
  suggestion: number;
  bug: number;
  enhancement: number;
  documentation: number;
  question: number;
}
function RepoLabel({ repoName, owner }: AnalyticsProps) {
  const data = [
    { name: "refactoring", value: 0, color: "violet.6" },
    { name: "bug", value: 0, color: "red.6" },
    { name: "enhancement", value: 0, color: "cyan.6" },
    { name: "question", value: 0, color: "blue.6" },
    { name: "documentation", value: 0, color: "gray.6" },
    { name: "suggestion", value: 0, color: "green.6" },
  ];

  function handlePriority(resData: UpdateValues) {
    data[0].value = resData.refactoring;
    data[1].value = resData.bug;
    data[2].value = resData.enhancement;
    data[3].value = resData.question;
    data[4].value = resData.documentation;
    data[5].value = resData.suggestion;

    return data;
  }

  //[HttpGet("analytics/{owner}/{repoName}/label/all")]

  const [repoData, setRepoData] = useState(data);
  const [value, setValue] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const end = value == "all" ? "all" : "";
        const res = await axios.get(`${BASE_URL}/api/github/analytics/${owner}/${repoName}/label/${end}`, {
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
        Label Distribution of PRs
      </Title>
      <SegmentedControl
        value={value}
        onChange={setValue}
        data={[
          { label: "All PRs", value: "all" },
          { label: "Active PRs", value: "active" },
        ]}
      />
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

export default RepoLabel;
