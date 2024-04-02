import { LineChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";
import { WeekData } from "../../pages/AnalyticsPage.tsx";

export interface ReviewLineChartProps {
  weekData: WeekData[];
}
function ReviewLineChart(weekData: ReviewLineChartProps) {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Review Chart
      </Title>
      <LineChart
        h={300}
        data={weekData.weekData}
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
