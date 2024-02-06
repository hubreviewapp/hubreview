import { Grid, Box, Text, TextInput, Card, Button, Stack, Group, Image } from "@mantine/core";
import GitHubLogo from "../assets/icons/github-mark-white.png";
import SignIn from "../assets/icons/signin.png";
import axios from "axios";


const CLIENT_ID = "64318456282bb1488063";

function SignInPage() {

  async function loginWithGithub() {

    const axiosInstance = axios.create({
      withCredentials: true,
      baseURL: "http://localhost:5018/api/github"
    });

    try {
      const res = await axiosInstance.get("/getUserInfo");
      localStorage.setItem("userLogin", res.data.userLogin)
      console.log(res.data.userLogin);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    window.location.assign( "https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID + "&scope=user:email,read:repo,read:org" );
  }
  
  return (
    <Box h={600} p={5} m={0} w="100%">
      <Grid m="30px">
        <Grid.Col span={8}>
          <Image src={SignIn} />
        </Grid.Col>
        <Grid.Col span={4}>
          <Card shadow="sm" padding="40px" radius="md" withBorder h="400px">
            <Stack justify="space-between">
              <Group>
                <Text fw={500} size="xl">
                  {" "}
                  SIGN IN WITH GITHUB{" "}
                </Text>
                <Box component="img" src={GitHubLogo} alt="logo" ml="20px" w="55px" />
              </Group>
              <TextInput
                leftSectionPointerEvents="none"
                label="Email or Username"
                placeholder="Your email or username"
                withAsterisk
              />
              <TextInput leftSectionPointerEvents="none" label="Password" placeholder="Your password" withAsterisk />
              <Text c="dimmed">Forgot Password?</Text>
              <Button onClick={loginWithGithub} variant="gradient">Sign In</Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default SignInPage;
