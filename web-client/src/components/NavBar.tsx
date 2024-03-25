import { Link, useLocation } from "react-router-dom";
import { Container, Button, Title, Grid, Box, rem, Avatar, Space } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconLogout } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../providers/context-utilities";
import axios from "axios";

function NavBar() {
  const location = useLocation();
  const [isActive, setIsActive] = useState(0);
  const navigate = useNavigate();
  const iconLogout = <IconLogout style={{ width: rem(15), height: rem(15) }} />;
  const handleClick = (buttonId: number) => {
    setIsActive(buttonId);
    if (buttonId == 0) {
      localStorage.clear();
      axios.get("http://localhost:5018/api/github/logoutUser");
    }
  };

  useEffect(() => {
    switch (location.pathname) {
      case "/":
        setIsActive(1);
        break;
      case "/repositories":
        setIsActive(2);
        break;
      case "/analytics":
        setIsActive(3);
        break;
      case "/signIn":
        setIsActive(0);
        break;
      default:
        setIsActive(0);
    }
  }, [location.pathname]);
  const { userLogin, userAvatarUrl } = useUser();

  useEffect(() => {
    if (localStorage.getItem("userLogin") === null || userLogin === null) {
      navigate("/signIn");
    }
  }, [navigate, userLogin]);

  return (
    <Box bg="#0D1B2A" p="20px">
      <Container size="xl">
        <Grid>
          <Grid.Col span={5}>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>
              <Title order={2}>HubReview </Title>
            </Link>
          </Grid.Col>
          <Grid.Col span={7} style={{ display: "flex", justifyContent: "space-evenly" }}>
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
            {location.pathname !== "/signIn" && userLogin && (
              <Button variant="transparent">
                <Avatar src={userAvatarUrl} radius="xl" size="2rem" />
                <Space w="xs" />
                {userLogin}
              </Button>
            )}

            <Button
              rightSection={iconLogout}
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
