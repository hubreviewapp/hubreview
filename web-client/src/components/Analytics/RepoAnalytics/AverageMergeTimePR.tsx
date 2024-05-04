import { Center, Paper, Title } from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import { AnalyticsProps } from "./ReviewStatusAnalytics.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";

interface MergedTime {
  mergedDate: string;
  prCount: number;
  avgMergeTime: string;
  speedInHours: number;
}
function toDate(data: MergedTime) {
  const [daysString, time] = data.avgMergeTime.split(".");
  const days = parseInt(daysString);
  const [hours, minutes] = time.split(":").map(parseFloat);

  // Calculate total hours
  const totalHours = (days * 24 + hours + minutes / 60).toFixed(2);

  return {
    ...data,
    speedInHours: totalHours,
  };
}
function AverageMergeTimePR({ repoName, owner }: AnalyticsProps) {
  // [HttpGet("analytics/{owner}/{repoName}/avg_merged_time")]
  const [repoData, setRepoData] = useState<MergedTime[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/analytics/${owner}/${repoName}/avg_merged_time`, {
          withCredentials: true,
        });
        if (res) {
          if (res.data.length == 0) {
            setRepoData([]);
          } else setRepoData(res.data.map((itm: MergedTime) => toDate(itm)));
        }
      } catch (error) {
        console.error("Error fetching AverageMergeTimePR info:", error);
      }
    };

    fetchData().then();
  }, []); // eslint-disable-line
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Average Merge Times of PRs
      </Title>
      {repoData.length == 0 ? (
        <Center>
          <Paper m="xl" p="md" withBorder>
            No Data Available.
          </Paper>
        </Center>
      ) : (
        <AreaChart
          h={300}
          data={repoData}
          dataKey="mergedDate"
          series={[{ name: "speedInHours", color: "blue.6" }]}
          unit=" days"
          curveType="linear"
        />
      )}
    </Paper>
  );
}

export default AverageMergeTimePR;
