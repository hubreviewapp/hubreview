import "../styles/common.css";
//import GitHubLogo from "../assets/icons/github-logo.png";
import {Flex, Box, Card, Group, Text, Button} from "@mantine/core";
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
      <Flex p={5} mt={"20px"} >
        {repos.map((repo) =>(
          <Card key ={repo.id} w={"300px"} h={"170px"} shadow="sm" padding="lg" radius="md" withBorder m={5}  bg={"#1B263B"} >
            <Flex direction="column" justify="space-between" m={5}>
              <Text fw={500} size="xl"  >{repo.name}</Text>

            <Text size="sm" c="dimmed">
              Owner: {repo.owner}
            </Text>
            <Text size="sm" c="dimmed">
              Created: {repo.created}
            </Text>
            </Flex>
              <Group justify={"flex-end"} m={5}>
                <Button size={"xs"} variant={"outline"} color="white" >Edit</Button>
                <Button size={"xs"} variant="outline" color="red">Delete</Button>
              </Group>

          </Card>
        ))}
      </Flex>

      <Button variant={"outline"} m={"20px"}>Add Repository</Button>
    </Box>
  );
}

export default RepositoriesPage;
