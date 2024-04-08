import { Box, Center, Container, Divider, Grid, Paper, SimpleGrid, Title } from "@mantine/core";
import RepoWorkloadAnalytics from "../components/Analytics/RepoAnalytics/RepoWorkloadAnalytics.tsx";
import { useParams } from "react-router-dom";
import TimePRWaitingReview from "../components/Analytics/RepoAnalytics/TimePRWaitingReview.tsx";
import PriorityDataAnalytics from "../components/Analytics/RepoAnalytics/PriorityDataAnalytics.tsx";
import AverageMergeTimePR from "../components/Analytics/RepoAnalytics/AverageMergeTimePR.tsx";
import ReviewStatusAnalytics from "../components/Analytics/RepoAnalytics/ReviewStatusAnalytics.tsx";

function RepoAnalyticsPage() {
  const { repoName } = useParams();
  return (
    <Container fluid my="md">
      <Center mb="sm">
        <Title order={3}>{repoName} Analytics</Title>
      </Center>
      <SimpleGrid cols={{ base: 1, sm: 1 }} spacing="md">
        <Grid gutter="md">
          <Grid.Col span={5}>
            <Center>
              <Title order={4} mb="md">
                Reviewer Workloads
              </Title>
            </Center>

            <RepoWorkloadAnalytics />
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <TimePRWaitingReview />
          </Grid.Col>
        </Grid>
        <Divider />
        <Grid gutter="md">
          <Grid.Col span={5}>
            <Paper p="md" ta="center">
              <PriorityDataAnalytics />
            </Paper>
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <AverageMergeTimePR />
          </Grid.Col>
        </Grid>
      </SimpleGrid>
      <Box w="50%">
        <ReviewStatusAnalytics />
      </Box>
    </Container>
  );
}

export default RepoAnalyticsPage;
