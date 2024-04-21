import { BarChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../env.ts";
import formatDateInterval from "./dateUtils.ts";

export interface AnalyticsProps {
  repoName: string | undefined;
  owner: string | undefined;
}

interface ReviewStatusData {
  firstDay: string;
  lastDay: string;
  commentedCount: string;
  pendingCount: string;
  approvedCount: string;
  changesReqCount: string;
}
function ReviewStatusAnalytics({ repoName, owner }: AnalyticsProps) {
  //   [HttpGet("analytics/{owner}/{repoName}/review_statuses")]
  const [repoData, setRepoData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/analytics/${owner}/${repoName}/review_statuses`, {
          withCredentials: true,
        });
        if (res) {
          setRepoData(
            res.data.map((item: ReviewStatusData) => ({
              ...item,
              week: formatDateInterval(item.firstDay, item.lastDay),
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching ReviewStatusAnalytics info:", error);
      }
    };

    fetchData().then();
  }, []); // eslint-disable-line
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Review Status of PRs
      </Title>
      <BarChart
        h={300}
        data={repoData}
        dataKey="week"
        series={[
          { name: "commentedCount", color: "violet.6" },
          { name: "pendingCount", color: "blue.6" },
          { name: "approvedCount", color: "teal.6" },
          { name: "changesReqCount", color: "pink.6" },
        ]}
        tickLine="y"
      />
    </Paper>
  );
}

export default ReviewStatusAnalytics;
