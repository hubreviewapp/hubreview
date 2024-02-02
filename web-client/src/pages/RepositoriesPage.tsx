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
import {useState, useEffect} from "react";
import repoData from "../repo_data.json";
import { Repository } from "../models/Repository";
import axios from "axios";
import parseJson from "parse-json";

function RepositoriesPage() {
  const iconPlus = <IconCirclePlus style={{width: rem(22), height: rem(22)}}/>;
  //const [query, setQuery] = useState('');
  const [repository, setRepository] = useState<Repository[]>([]); 
  //const filtered = repoData.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const getRepos = async () => {
      const res = await axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github"
      }).get("/getRepository");
      if (res) {
        setRepository(res.data.repoNames);
      }
    };

    getRepos();
  }, []);

  /*async function getRepoNames() {
    console.log("AAAAAAAAAAAAA");
    const result = await axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    }).get("/getRepository");
    if( result && result.data){ console.log(result.data.repoNames) };
  } */

  function selectRepositories() {
    console.log("Button clicked");
    window.location.assign( "https://github.com/apps/hubreviewapp/installations/new" );
  }


  const rows = repository.map((element) => (
    <Table.Tr key={element.Id}>
      <Table.Td><Text fw="700">{element.Name}</Text></Table.Td>
      <Table.Td c="dimmed">created by <UnstyledButton c="blue">{element.OwnerLogin}</UnstyledButton> on {element.CreatedAt?.toString()}
      </Table.Td>
      <Table.Td><Button variant="light" /*onClick={getRepoNames}*/>Configure</Button></Table.Td>
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
            /*value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}*/
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
