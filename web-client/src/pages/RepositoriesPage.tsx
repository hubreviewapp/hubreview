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
  Loader,
  Container,
  SegmentedControl,
  Tooltip,
} from "@mantine/core";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { Repository } from "../models/Repository";
import axios from "axios";
import { BASE_URL, GITHUB_APP_NAME } from "../env";

interface Config {
  name: string;
  onlyAdmin: boolean;
}

function RepositoriesPage() {
  const iconPlus = <IconCirclePlus style={{ width: rem(22), height: rem(22) }} />;
  const [query, setQuery] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;

  const filteredRepos = repositories.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const [isLoading, setIsLoading] = useState(true);

  const [configList, setConfigList] = useState<Config[]>([]);

  const getRepos = async () => {
    const axiosInstance = axios.create({
      withCredentials: true,
      baseURL: `${BASE_URL}/api/github`,
    });

    const res = await axiosInstance.get("/getRepository");
    if (res) {
      setRepositories(res.data.repoNames);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    getRepos();
  }, []);

  useEffect(() => {
    const newList: Config[] = [];
    for (let i = 0; i < repositories.length; i++) {
      const newConfig: Config = { name: repositories[i].name, onlyAdmin: repositories[i].onlyAdmin };
      newList.push(newConfig);
    }
    setConfigList(newList);

    console.log(configList);
  }, [repositories]);
  function selectRepositories() {
    console.log("Button clicked");
    window.location.assign(`https://github.com/apps/${GITHUB_APP_NAME}/installations/new`);
  }
  const updateOnlyAdminByName = (name: string, newOnlyAdmin: boolean) => {
    // Find index of config with given name
    const configIndex = configList.findIndex((config) => config.name === name);
    if (configIndex !== -1) {
      // Update onlyAdmin value immutably
      const updatedConfigList = [...configList];
      updatedConfigList[configIndex] = {
        ...updatedConfigList[configIndex],
        onlyAdmin: newOnlyAdmin,
      };
      // Set the updated list as new state
      setConfigList(updatedConfigList);
    } else {
      console.error(`Config with name '${name}' not found`);
    }
  };

  function changeAdminSetting(repoOwner: string, repoName: string) {
    //[HttpPatch("{repoOwner}/{repoName}/changeonlyadmin/{onlyAdmin}")]
    //
    // Bu repo sayfasındaki ayarı değiştirmek için atacağın request
    // onlyAdmin kısmı false verirsen,  all collaborators can assign priority
    //
    // true verirsen only admins can assign priority

    const value = !configList.find((itm) => itm.name == repoName)?.onlyAdmin;

    updateOnlyAdminByName(repoName, value);
    console.log(configList);
    const patchAdmin = async () => {
      const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: `${BASE_URL}/api/github`,
      });

      const res = await axiosInstance.get(`/${repoOwner}/${repoName}/changeonlyadmin/${value}`);
      if (!res) console.log(res);
    };

    patchAdmin();
  }

  const rows = filteredRepos.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td>
        <Text fw="700">{element.name.toString()}</Text>
      </Table.Td>
      <Table.Td c="dimmed">
        created by <UnstyledButton c="blue">{element.ownerLogin.toString()}</UnstyledButton> on{" "}
        {element.createdAt.toString()}
      </Table.Td>
      <Table.Td>
        <Tooltip label="Select who can assign priority to Pull Requests">
          <Text c="dimmed" size="sm" fw={500} mt={3}>
            Priority assignment:
          </Text>
        </Tooltip>
        <Tooltip disabled={element.isAdmin} label="Only repo admins can change this configuration">
          <SegmentedControl
            color="cyan.9"
            value={configList.find((itm) => itm.name == element.name)?.onlyAdmin ? "admin" : "all"}
            onChange={() => changeAdminSetting(element.ownerLogin, element.name)}
            data={[
              { label: "All Contributors", value: "all" },
              { label: "Only Admins", value: "admin" },
            ]}
            disabled={!element.isAdmin}
          />
        </Tooltip>
      </Table.Td>
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
      <Text c="dimmed">
        These are all the repositories that HubReview can access. To add a repository, you will be directed to GitHub.
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
        {!isLoading && rows.length === 0 && (
          <Text size="lg" fw={500}>
            {" "}
            There is no current repository
          </Text>
        )}
        <Table verticalSpacing="md" striped>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}

export default RepositoriesPage;
