import { Button, Center, Paper, Popover, SegmentedControl, Text, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { AnalyticsProps } from "./ReviewStatusAnalytics.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";

function RepoLabel({ repoName, owner }: AnalyticsProps) {
  const data = [
    { name: "refactoring", value: 0, color: "violet.6" },
    { name: "bug", value: 0, color: "red.6" },
    { name: "enhancement", value: 0, color: "cyan.6" },
    { name: "question", value: 0, color: "blue.6" },
    { name: "documentation", value: 0, color: "gray.6" },
    { name: "suggestion", value: 0, color: "green.6" },
  ];

  function handlePriority(obj: { [x: string]: never }) {
    return Object.keys(obj).map((key) => ({
      name: key,
      value: obj[key],
      color: data.find((item) => item.name === key)?.color || "gray.6",
    }));
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
          if (Object.keys(res.data).length === 0) {
            setRepoData([]);
          } else setRepoData(handlePriority(res.data));

          console.log(repoData);
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

      {repoData.length == 0 ? (
        <Center>
          <Paper m="xl" p="md" withBorder>
            No Data Available.
          </Paper>
        </Center>
      ) : (
        <></>
      )}

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
      <DonutChart mt="md" data={repoData} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default RepoLabel;
