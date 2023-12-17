import { Link } from "react-router-dom";
import { Container, Button, Title, Grid, Box, rem } from "@mantine/core";
import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";

function NavBar() {
  const [isActive, setIsActive] = useState(1);
  const iconLogout = <IconLogout style={{ width: rem(15), height: rem(15) }} />;
  const handleClick = (buttonId: number) => {
    setIsActive(buttonId);
  };
  return (
    <Box bg="#0D1B2A" p="20px">
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
              Review Queue
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
            <Button
              rightSection={iconLogout}
              disabled={isActive == 0}
              component={Link}
              variant="transparent"
              to="/signIn"
              onClick={() => handleClick(0)}
            >
              Log out
            </Button>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}

export default NavBar;
