import { Link, useLocation } from "react-router-dom";
import { Button, Grid, Box, rem, Avatar, Space, Image } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconLogout } from "@tabler/icons-react";
import { useUser } from "../providers/context-utilities";
import Logo from "../../assets/icons/logo-color.svg";

function NavBar() {
  const location = useLocation();
  const { logOut } = useUser();

  const [isActive, setIsActive] = useState(0);
  const iconLogout = <IconLogout style={{ width: rem(15), height: rem(15) }} />;
  const handleClick = (buttonId: number) => {
    setIsActive(buttonId);
    if (buttonId == 0) {
      logOut();
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
  const { user } = useUser();

  return (
    <Box bg="#0D1B2A" p="20px">
      <Grid>
        <Grid.Col span={2.5}>
          <Link to="/" style={{ color: "white", textDecoration: "none" }}>
            <Image h={50} src={Logo} />
          </Link>
        </Grid.Col>
        <Grid.Col span={2.5}></Grid.Col>
        <Grid.Col span={7} style={{ display: "flex", justifyContent: "space-evenly", marginTop: "10px" }}>
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
          {location.pathname !== "/signIn" && user && (
            <Button variant="transparent" component="a" href={"https://github.com/" + user.login} target="_blank">
              <Avatar src={user.avatarUrl} radius="xl" size="2rem" />
              <Space w="xs" />
              {user.login}
            </Button>
          )}

          <Button rightSection={iconLogout} variant="transparent" onClick={() => handleClick(0)}>
            Log out
          </Button>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default NavBar;
