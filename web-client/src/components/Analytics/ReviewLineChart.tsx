import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
const data = [
  {
    date: "Mar 22",
    submitted: 9,
    received: 8,
    waiting: 2,
  },
  {
    date: "Mar 23",
    submitted: 12,
    received: 6,
    waiting: 4,
  },
  {
    date: "Mar 24",
    submitted: 8,
    received: 11,
    waiting: 3,
  },
  {
    date: "Mar 25",
    submitted: 9,
    received: 8,
    waiting: 2,
  },
];
function ReviewLineChart() {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Review Chart
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: "submitted", color: "indigo.6" },
          { name: "received", color: "yellow.6" },
          { name: "waiting", color: "gray.6" },
        ]}
        curveType="linear"
        withLegend
      />
    </Paper>
  );
}

export default ReviewLineChart;
