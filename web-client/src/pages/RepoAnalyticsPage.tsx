import { Center, Container, Divider, Flex, Grid, Paper, rem, SimpleGrid, Title } from "@mantine/core";
import RepoWorkloadAnalytics from "../components/Analytics/RepoAnalytics/RepoWorkloadAnalytics.tsx";
import { Link, useParams } from "react-router-dom";
import PriorityDataAnalytics from "../components/Analytics/RepoAnalytics/PriorityDataAnalytics.tsx";
import AverageMergeTimePR from "../components/Analytics/RepoAnalytics/AverageMergeTimePR.tsx";
import ReviewStatusAnalytics from "../components/Analytics/RepoAnalytics/ReviewStatusAnalytics.tsx";
import { IconCircleArrowLeftFilled } from "@tabler/icons-react";
import RepoLabel from "../components/Analytics/RepoAnalytics/RepoLabel.tsx";

function RepoAnalyticsPage() {
  const { repoName, owner } = useParams();
  return (
    <Container fluid my="md">
      <Flex justify="end" mx="xl">
        <Link to="/analytics">
          <IconCircleArrowLeftFilled
            style={{ width: rem(18), height: rem(18), marginRight: "10px", marginTop: "4px" }}
          />
          Back to Dashboard
        </Link>
      </Flex>
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

            <RepoWorkloadAnalytics owner={owner} repoName={repoName} />
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <ReviewStatusAnalytics owner={owner} repoName={repoName} />
          </Grid.Col>
        </Grid>
        <Divider />
        <Grid gutter="md">
          <Grid.Col span={5}>
            <Paper p="md" ta="center">
              <PriorityDataAnalytics owner={owner} repoName={repoName} />
            </Paper>
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <RepoLabel repoName={repoName} owner={owner} />
          </Grid.Col>
        </Grid>
      </SimpleGrid>
      <Container mt="md">
        <AverageMergeTimePR owner={owner} repoName={repoName} />
      </Container>
    </Container>
  );
}

export default RepoAnalyticsPage;
