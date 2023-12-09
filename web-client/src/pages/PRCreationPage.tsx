import {Container, Grid, NativeSelect, Text, TextInput} from "@mantine/core";
import {useState} from "react";

function PRCreationPage() {
  const repos :string[] = ["All", "ReLink", "Eventium"]
  const authors :string[] = ["All", "Ece-Kahraman", "Ayse-Kelleci"]

  const [filteredRepo, setFilteredRepo] = useState("All");
  const [filteredAuthor, setFilteredAuthor] = useState("All");
  return (
    <Container>
      <Text fw={500} size={"xl"}>Create a New PR</Text>
      <Grid w={"70%"}>
        <Grid.Col span={2}>
        </Grid.Col>
        <Grid.Col span={2}>
          <NativeSelect
            description="Select Repo"
            value={filteredRepo}
            onChange={(event) => setFilteredRepo(event.currentTarget.value)}
            data={repos}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <NativeSelect
            description="Select Author"
            value={filteredAuthor}
            onChange={(event) => setFilteredAuthor(event.currentTarget.value)}
            data={authors}
          />
        </Grid.Col>
      </Grid>
    </Container>
   );
}

export default PRCreationPage;
