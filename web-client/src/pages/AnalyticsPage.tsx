import {Box, Button, SimpleGrid, Grid, Paper, Title, Container, Divider, Flex} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import ReviewSummaryAnalytics from "../components/Analytics/ReviewSummaryAnalytics";
import ReviewLineChart from "../components/Analytics/ReviewLineChart";
import axios from "axios";
import ReviewerSpeedAnalytics from "../components/Analytics/ReviewerSpeedAnalytics";

function AnalyticsPage() {
  const navigate = useNavigate();
  const [repoList, setRepoList]  =useState([]);
  useEffect(() => {
    if (localStorage.getItem("userLogin") === null) {
      navigate("/signIn");
    }
  }, [navigate]);
  useEffect(() => {
    const getRepos = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5018/api/github/getRepository`,
          {
            withCredentials: true,
          },
        );
        if (res.data) {
          setRepoList(res.data.repoNames);
        }
      } catch (error) {
        console.error("Error fetching repositories", error);
      }
    };

    getRepos();
  }, []);

  return (
    <Container fluid my="md">
      <Box mb="sm" align="center" >
        <Title order={3}>Dashboard</Title>
      </Box>
      <SimpleGrid cols={{ base: 1, sm: 1 }} spacing="md">
        <Grid gutter="md">
          <Grid.Col span={5}>
            <ReviewSummaryAnalytics/>
          </Grid.Col>
          <Divider orientation="vertical"/>
          <Grid.Col span={6}>
            <ReviewLineChart/>
          </Grid.Col>
        </Grid>
        <Divider/>
        <Grid gutter="md">
          <Grid.Col span={5}>
            <Paper p="md" ta="center">
              <Title order={4} mb="md">Repository Analytics</Title>
              <Flex direction="column" justify="center" align="center">
              {
                repoList.map(r=>(
                  <Button key={r.id} mb="sm" w="50%" variant="outline" color="blue">{r.name}</Button>
                ))
              }
              </Flex>
            </Paper>
          </Grid.Col>
          <Divider orientation="vertical"/>
          <Grid.Col span={6}>
            <ReviewerSpeedAnalytics/>
          </Grid.Col>
        </Grid>
      </SimpleGrid>
    </Container>
  );
}

export default AnalyticsPage;
