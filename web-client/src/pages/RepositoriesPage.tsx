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
  TextInput,
  Loader, Container
} from "@mantine/core";
import {IconCirclePlus, IconSearch} from "@tabler/icons-react";
import {useState, useEffect} from "react";
import { Repository } from "../models/Repository";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RepositoriesPage() {
  const iconPlus = <IconCirclePlus style={{width: rem(22), height: rem(22)}}/>;
  const [query, setQuery] = useState('');
  const [repository, setRepository] = useState<Repository[]>([]);
  const navigate = useNavigate();
  const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;

  useEffect(() => {
  if ( localStorage.getItem("userLogin") === null ){
    navigate("/signIn");
  }
  }, [navigate]);

  const filtered = repository.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const getRepos = async () => {
      const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github"
      })

      const res = await axiosInstance.get("/getRepository");
      if (res) {
        setRepository(res.data.repoNames);
      }
      setIsLoading(false)
    };

    getRepos();
  }, []);

  function selectRepositories() {
    console.log("Button clicked");
    window.location.assign( "https://github.com/apps/hubreviewapp/installations/new" );
  }

  async function getPulls(id: number) {
    console.log(id);
    await axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    }).get(`/getRepository/${id}`);
  }

  const rows = filtered.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td><Text fw="700">{element.name.toString()}</Text></Table.Td>
      <Table.Td c="dimmed">created by <UnstyledButton c="blue">{element.ownerLogin.toString()}</UnstyledButton> on {element.createdAt.toString()}
      </Table.Td>
      <Table.Td><Button variant="light" onClick={() => getPulls(element.id)}>Configure</Button></Table.Td>
    </Table.Tr>
  ));

  return (
    <Container p="lg">
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
            radius="md"
            leftSection={iconSearch}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            placeholder="Search Repository"
          />
        </Box>

        {isLoading && <Loader color="blue" />}
        <Table verticalSpacing="md" striped>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}

export default RepositoriesPage;
