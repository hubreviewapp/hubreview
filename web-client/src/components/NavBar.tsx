import { Link } from "react-router-dom";
import { Container, Button, Title, Grid, Box } from "@mantine/core";
import { useState } from "react";

function NavBar() {
  const [isActive, setIsActive] = useState(1);

  const handleClick = (buttonId: number) => {
    setIsActive(buttonId);
  };
  return (
    <Box bg={"#0D1B2A"} p={"20px"}>
      <Container size="xl">
        <Grid>
          <Grid.Col span={7}>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>
              <Title order={2}>HubReview</Title>
            </Link>
          </Grid.Col>
          <Grid.Col span={5} style={{ display: "flex", justifyContent: "space-evenly" }}>
            <Button
              component={Link}
              variant={isActive == 1 ? "outline" : "transparent"}
              to="/"
              onClick={() => handleClick(1)}
            >
              Pull Requests
            </Button>
            <Button
              component={Link}
              variant={isActive == 2 ? "outline" : "transparent"}
              to="/repositories"
              onClick={() => handleClick(2)}
            >
              Repositories
            </Button>
            <Button
              component={Link}
              variant={isActive == 3 ? "outline" : "transparent"}
              to="/analytics"
              onClick={() => handleClick(3)}
            >
              Analytics
            </Button>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}

export default NavBar;
