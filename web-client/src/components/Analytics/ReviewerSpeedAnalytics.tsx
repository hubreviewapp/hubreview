import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
import { ReviewLineChartProps } from "./ReviewLineChart.tsx";

function ReviewerSpeedAnalytics(data: ReviewLineChartProps) {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Reviewer Speed
      </Title>
      <LineChart
        h={300}
        data={data.weekData}
        dataKey="week"
        series={[{ name: "speedInHours", color: "pink.6" }]}
        curveType="monotone"
        unit=" hours"
      />
    </Paper>
  );
}

export default ReviewerSpeedAnalytics;
