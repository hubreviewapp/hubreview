import { Button, SimpleGrid, Grid, Paper, Title, Container, Divider, Flex, Center } from "@mantine/core";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ReviewSummaryAnalytics from "../components/Analytics/ReviewSummaryAnalytics";
import ReviewLineChart from "../components/Analytics/ReviewLineChart";
import axios from "axios";
import ReviewerSpeedAnalytics from "../components/Analytics/ReviewerSpeedAnalytics";
import ConvertWeekInterval from "../utility/ConvertWeekInterval.ts";
import { BASE_URL } from "../env.ts";

export interface WeekData {
  week: string;
  submitted: number;
  received: number;
  speed: string;
}
function AnalyticsPage() {
  const [repoList, setRepoList] = useState<RepoListResponse>({ repoNames: [] });

  type Repo = {
    id: number;
    name: string;
    ownerLogin: string;
  };

  interface RepoListResponse {
    repoNames: [];
  }

  useEffect(() => {
    const getRepos = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/getRepository`, {
          withCredentials: true,
        });
        if (res.data) {
          setRepoList(res.data);
        }
      } catch (error) {
        console.error("Error fetching repositories", error);
      }
    };

    const promise = getRepos();
    console.log(promise);
  }, []);

  //user/monthlysummary
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  useEffect(() => {
    const getRepos = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/user/monthlysummary`, {
          withCredentials: true,
        });
        if (res.data) {
          setWeekData(ConvertWeekInterval(res.data.reverse()));
        }
      } catch (error) {
        console.error("Error fetching monthly summary", error);
      }
    };

    getRepos();
  }, []);

  return (
    <Container fluid my="md">
      <Center mb="sm">
        <Title order={3}>Dashboard</Title>
      </Center>
      <SimpleGrid cols={{ base: 1, sm: 1 }} spacing="md">
        <Grid gutter="md">
          <Grid.Col span={5}>
            <ReviewSummaryAnalytics />
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <ReviewLineChart weekData={weekData} />
          </Grid.Col>
        </Grid>
        <Divider />
        <Grid gutter="md">
          <Grid.Col span={5}>
            <Paper p="md" ta="center">
              <Title order={4} mb="md">
                Repository Analytics
              </Title>
              <Flex direction="column" justify="center" align="center">
                {repoList.repoNames.map((r: Repo) => (
                  <Link to={`${r.name}/${r.ownerLogin}`} key={r.id} style={{ textDecoration: "none" }}>
                    <Button w={250} mb="sm" variant="outline" color="blue">
                      {r.name}
                    </Button>
                  </Link>
                ))}
              </Flex>
            </Paper>
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col span={6}>
            <ReviewerSpeedAnalytics weekData={weekData} />
          </Grid.Col>
        </Grid>
      </SimpleGrid>
    </Container>
  );
}

export default AnalyticsPage;
