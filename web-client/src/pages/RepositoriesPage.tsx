import "../styles/temp-styles.module.css";
import {
  Flex,
  Box,
  Table,
  UnstyledButton,
  Text,
  Button,
  Paper,
  rem,
  Title,
  TextInput
} from "@mantine/core";
import {IconCirclePlus} from "@tabler/icons-react";
import {useState} from "react";
import repoData from "../repo_data.json";
import axios from "axios";

function RepositoriesPage() {
  const iconPlus = <IconCirclePlus style={{width: rem(22), height: rem(22)}}/>;
  const [query, setQuery] = useState('');
  const filtered = repoData.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  
  async function getRepoNames() {
    console.log("AAAAAAAAAAAAA");
    const result = await axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    }).get("/getRepository");
    if( result && result.data){ console.log(result.data) };
  } 

  function selectRepositories() {
    console.log("Button clicked");
    window.location.assign( "https://github.com/apps/hubreviewapp/installations/new" );
  }

  const rows = filtered.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td><Text fw="700">{element.name}</Text></Table.Td>
      <Table.Td c="dimmed">created by <UnstyledButton c="blue">{element.owner}</UnstyledButton> on {element.created}
      </Table.Td>
      <Table.Td><Button variant="light" onClick={getRepoNames}>Configure</Button></Table.Td>
    </Table.Tr>
  ));

  return (
    <Box p="lg">
      <Flex justify="space-between" my="md">
        <Title order={3}>Repositories</Title>
        <Button size="md" leftSection={iconPlus} onClick={selectRepositories}>
          Add Repositories
        </Button>
      </Flex>
      <Text c="dimmed">These are all the repositories that HubReview can access. To add a repository, you will be
        directed to GitHub.
      </Text>
      <Paper my="lg">
        <Box w="300px">
          <TextInput
            my="md"
            label="Search for repository"
            radius="md"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            placeholder="Search Repository"
          />
        </Box>

        <Table verticalSpacing="md" striped>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Box>
  );
}

export default RepositoriesPage;
