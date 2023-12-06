import "../styles/PRList.module.css";
import GitHubLogo from "../assets/icons/github-logo.png";
import {Flex, Box, Card, Group, Text, Button, Badge} from "@mantine/core";
import UserLogo from "../assets/icons/user.png";
import classes from "../styles/PRBox.module.css";
function RepositoriesPage() {
  const repos = [
    {
      id: 1,
      name: "HubReview",
      owner: "Ayse Kelleci",
      created: "01-01-2021"
    },{
    id: 2,
    name: "ReLink",
    owner: "Cagatay Safak",
    created: "01-01-2021"
  },
    {
    id: 3,
    name: "Eventium",
    owner: "Ece Kahraman",
    created: "01-01-2021"
},

  ]

  return (
    <Box h={600} p={5} m={0} w="100%" bg ="#1B263B" >
      <Flex p={5} mt={"20px"} justify={"center"}>
        {repos.map((repo) =>(
          <Card key ={repo.id} w={"300px"} h={"170px"} shadow="sm" padding="lg" radius="md" m={5}  bg={"#415A77"} >
            <Flex direction="column" justify="space-between" m={5}>
              <Flex justify={"space-between"}>
                <Text fw={500} size="xl"  >{repo.name}</Text>
                <Badge variant="outline" color="gray" size="sm" mt={4}>Private</Badge>
              </Flex>

              <Text size="sm" c="dimmed">
                Owner: {repo.owner}
              </Text>
              <Text size="sm" c="dimmed">
                Created: {repo.created}
              </Text>
            </Flex>
              <Group justify={"flex-end"} m={5}>
                <Button size={"xs"} variant={"outline"} color="white">Edit</Button>
                <Button size={"xs"} variant="filled" color="#DC3545">Delete</Button>
              </Group>

          </Card>
        ))}
      </Flex>
      <Flex justify={"center"} mt={"30px"}>
        <Button variant={"outline"}>
          Add Repository
          <Box component="img" src={GitHubLogo} alt={"logo"} ml={"20px"} w={"25px"} />
        </Button>
      </Flex>

    </Box>
  );
}

export default RepositoriesPage;
