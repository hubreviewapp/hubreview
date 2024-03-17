import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
const data = [
  {
    date: "Mar 22",
    speed: 9,
  },
  {
    date: "Mar 23",
    speed: 12,
  },
  {
    date: "Mar 24",
    speed: 8,
  },
  {
    date: "Mar 25",
    speed: 9,
  },
];
function ReviewerSpeedAnalytics() {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Reviewer Speed
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "speed", color: "pink.6" }]}
        curveType="natural"
        unit=" days"
      />
    </Paper>
  );
}

export default ReviewerSpeedAnalytics;
