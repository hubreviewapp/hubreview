import {Avatar, Box, Group, Paper, rem, Title, Text, Divider, Flex, UnstyledButton} from "@mantine/core";
import {IconGitCommit} from "@tabler/icons-react";
import UserLogo from "../../assets/icons/user5.png";
import GitHubLogo from "../../assets/icons/github-mark-white.png";
import {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router-dom";

const commitList = [
  {
    date: '2022-11-04',
    commits: [{
      name: 'Feature: Add login functionality',
      author: 'Jane Smith'
    },
      {
        name: 'Bugfix: Resolve issue with data validation',
        author: 'Alex Johnson'
      }, {
        name: 'Feature: Integrate user profile page',
        author: 'Emily White'
      }]
  },
  {
    date: '2022-01-01',
    commits: [{
      name: 'Refactor: Improve code readability',
      author: 'Samuel Lee',
    },
      {
        name: 'Refactor: Improve code readability',
        author: 'Samuel Lee',
      }]
  }];
//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_commits")]
function CommitHistory() {
  const {owner, repoName, prnumber} = useParams();
  const [commits, setCommits] = useState([]);

  const fetchCommitInfo = async () => {
    try {
      const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/get_commits`;
      const res = await axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github/pullrequest"
      }).get(apiUrl);

      if (res) {
        setCommits(res.data);
      }
    } catch (error) {
      console.error("Error fetching PR info:", error);
      setTimeout(fetchCommitInfo, 1000);
    }
  };

  useEffect(() => {
    fetchCommitInfo();
  }, [fetchCommitInfo]);



  return (
    <Box mt="md">
      {commits.map(itm => (
          <Box key={itm.date}>
            <Text color="#778DA9">
              <IconGitCommit color="#778DA9" style={{width: rem(18), height: rem(18)}}/>
              Commits on { } {itm.date}</Text>
            <Box p="sm">
            <Paper withBorder>
              {
                itm.commits?.map(commit =>(
                  <Box key={commit.summary} >
                    <Flex m="xs" justify="space-between">
                      <Box>
                        <Title order={5} mb="xs">
                          {commit.summary}
                        </Title>
                        <Group>
                          <Avatar src={UserLogo} size="sm"  />
                          {commit.author}
                          <Text c="dimmed">committed on {itm.date}</Text>
                        </Group>
                      </Box>
                        <UnstyledButton>
                          <Group>
                            check on GitHub
                            <Avatar src={GitHubLogo} size="sm"/>
                          </Group>
                        </UnstyledButton>
                    </Flex>
                    <Divider/>
                  </Box>
                ))}
            </Paper>
            </Box>
          </Box>
        ))
      }</Box>
  )}

export default CommitHistory;
