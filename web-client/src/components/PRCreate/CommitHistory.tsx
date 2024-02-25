import { Avatar, Box, Group, Paper, rem, Title, Text, Divider, Flex, UnstyledButton, Loader } from "@mantine/core";
import { IconGitCommit } from "@tabler/icons-react";
import UserLogo from "../../assets/icons/user5.png";
import GitHubLogo from "../../assets/icons/github-mark-white.png";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_commits")]
function CommitHistory() {
  const { owner, repoName, prnumber } = useParams();
  const [commits, setCommits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommitInfo = async () => {
    try {
      const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/get_commits`;
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });

      if (res) {
        setCommits(res.data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching PR info:", error);
      setTimeout(fetchCommitInfo, 1000);
    }
  };

  useEffect(() => {
    fetchCommitInfo();
  }, []);

  return (
    <Box my="md">
      <Box align="center">{isLoading && <Loader color="blue" />}</Box>
      {commits.map((itm) => (
        <Box key={itm.date}>
          <Text color="#778DA9">
            <IconGitCommit color="#778DA9" style={{ width: rem(18), height: rem(18) }} />
            Commits on {} {itm.date}
          </Text>
          <Box p="sm">
            <Paper withBorder>
              {itm.commits?.map((commit) => (
                <Box key={commit.title}>
                  <Flex m="xs" justify="space-between">
                    <Box>
                      <Title mb="xs" order={5}>
                        {commit.title}
                      </Title>
                      <Group>
                        <Avatar src={UserLogo} size="sm" />
                        {commit.author}
                        <Text c="dimmed">committed on {itm.date}</Text>
                      </Group>
                      {commit.description == null ? (
                        <></>
                      ) : (
                        <Text mt="sm" c="dimmed">
                          Description: {commit.description}
                        </Text>
                      )}
                    </Box>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <UnstyledButton component="a" href={commit.githubLink} target="_blank">
                        <Group>
                          check on GitHub
                          <Avatar src={GitHubLogo} size="sm" />
                        </Group>
                      </UnstyledButton>
                    </div>
                  </Flex>
                  <Divider />
                </Box>
              ))}
            </Paper>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default CommitHistory;
