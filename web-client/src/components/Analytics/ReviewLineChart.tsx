import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
const data = [
  {
    date: "Mar 22",
    Submitted: 9,
    Received: 8,
    Waiting: 2,
  },
  {
    date: "Mar 23",
    Submitted: 12,
    Received: 6,
    Waiting: 4,
  },
  {
    date: "Mar 24",
    Submitted: 8,
    Received: 11,
    Waiting: 3,
  },
  {
    date: "Mar 25",
    Submitted: 9,
    Received: 8,
    Waiting: 2,
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
          { name: "Submitted", color: "indigo.6" },
          { name: "Received", color: "yellow.6" },
          { name: "Waiting", color: "gray.6" },
        ]}
        curveType="linear"
        withLegend
      />
    </Paper>
  );
}

export default ReviewLineChart;
