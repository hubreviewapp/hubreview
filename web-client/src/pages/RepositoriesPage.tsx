import "../styles/temp-styles.module.css";
import GitHubLogo from "../assets/icons/github-mark-white.png";
import { Flex, Box, Card, Group, Text, Button, Badge, rem, Modal, Switch } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import repoData from "../repo_data.json";

function RepositoriesPage() {
  const repos = repoData;
  const [selectedRepos, setSelectedRepos] = useState<string[]>(["ReLink"]);
  const iconLock = <IconLock style={{ width: rem(12), height: rem(12) }} />;
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box h={600} p={5} m={0} w="100%">
      <Modal opened={opened} onClose={close} title="Add GitHub Repositories to HubReview">
        <Switch.Group value={selectedRepos} onChange={setSelectedRepos}>
          {repos.map((itm) => (
            <Switch
              key={itm.id}
              value={itm.name}
              label={
                <Text>
                  {itm.name}{" "}
                  <Text size="sm" c="dimmed">
                    created by {itm.owner}{" "}
                  </Text>
                </Text>
              }
              m="md"
            />
          ))}
        </Switch.Group>
        <Box>
          <Button color="gray" onClick={close}>
            Close
          </Button>
        </Box>
      </Modal>
      <Flex p={5} mt="20px" justify="center">
        {selectedRepos.length == 0 ? (
          <Text size="lg">You have no repository here.</Text>
        ) : (
          selectedRepos
            .map((i) => repos.find((r) => r.name === i))
            .filter((i): i is (typeof repos)[0] => i !== undefined)
            .map((repo) => (
              <Card key={repo.id} w="300px" h="170px" shadow="sm" padding="lg" radius="md" m={5} bg="#0D1B2A">
                <Flex direction="column" justify="space-between" m={5}>
                  <Flex justify="space-between">
                    <Text fw={500} size="xl">
                      {repo.name}
                    </Text>
                    <Badge rightSection={iconLock} variant="outline" color="gray" size="sm" mt={4}>
                      Private
                    </Badge>
                  </Flex>
                  <Text size="sm" c="dimmed">
                    Owner: {repo.owner}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Created: {repo.created}
                  </Text>
                </Flex>
                <Group justify="flex-end" m={5}>
                  <Button size="xs" variant="outline" color="white">
                    Edit
                  </Button>
                </Group>
              </Card>
            ))
        )}
      </Flex>
      <Flex justify="center" mt="30px">
        <Button onClick={open}>
          Add Repository
          <Box component="img" src={GitHubLogo} alt="logo" ml="20px" w="25px" />
        </Button>
      </Flex>
    </Box>
  );
}

export default RepositoriesPage;
