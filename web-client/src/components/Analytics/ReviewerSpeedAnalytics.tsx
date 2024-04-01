import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
import {useEffect, useState} from "react";
import axios from "axios";

function ReviewerSpeedAnalytics() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const getData = async () => {
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

    getData();
  }, []);


  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Reviewer Speed
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="week"
        series={[{ name: "speed", color: "pink.6" }]}
        curveType="natural"
        unit=" days"
      />
    </Paper>
  );
}

export default ReviewerSpeedAnalytics;
