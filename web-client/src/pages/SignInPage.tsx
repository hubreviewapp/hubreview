import {Grid, Box, Text, Card, Button, Stack, Group, Image, Title} from "@mantine/core";
import GitHubLogo from "../assets/icons/github-mark-white.png";
import SignIn from "../assets/icons/signin.png";


const CLIENT_ID = "64318456282bb1488063";

function SignInPage() {

  function loginWithGithub() {
    console.log("Button clicked");
    window.location.assign( "https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID + "&scope=user:email,read:repo" );
  }

  return (
    <Box h={600} p={5} m={0} w="100%">
      <Group p="20px">
        <Title order={2}>HubReview</Title>
        <Text>The NextGen Code Review Hub</Text>
      </Group>
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

              <Text>You will be authenticated through GitHub</Text>

              <Button onClick={loginWithGithub} variant="gradient">Sign In</Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default SignInPage;
