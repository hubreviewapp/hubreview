import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import axios from "axios";

function ReviewLineChart() {
  //user/monthlysummary
  const [data, setData] = useState([]);
  useEffect(() => {
    const getRepos = async () => {
      try {
        const res = await axios.get(`http://localhost:5018/api/github/user/monthlysummary`, {
          withCredentials: true,
        });
        if (res.data) {
          setData(res.data);
          console.log(res.data);
        }
      } catch (error) {
        console.error("Error fetching repositories", error);
      }
    };

    getRepos();
  }, []);
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Review Chart
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="week"
        series={[
          { name: "submitted", color: "indigo.6" },
          { name: "received", color: "yellow.6" },
        ]}
        curveType="linear"
        withLegend
        connectNulls
      />
    </Paper>
  );
}

export default ReviewLineChart;
