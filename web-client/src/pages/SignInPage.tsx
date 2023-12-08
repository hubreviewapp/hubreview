import {Grid, Box, Text, TextInput, Card, Button, Stack, Group} from "@mantine/core";
import GitHubLogo from "../assets/icons/github-icon-large.png";

function SignInPage() {


  return(
    <Box h={600} p={5} m={0} w="100%" bg ="#1B263B">
      <Grid m={"30px"} >
        <Grid.Col span={8}>Review Faster, add some cool stuff</Grid.Col>
        <Grid.Col span={4}>
          <Card  shadow="sm" padding="40px" radius="md"  withBorder h={"400px"}>
            <Stack justify="space-between">
              <Group>
                <Text fw={500} size={"xl"} > SIGN IN WITH GITHUB </Text>
                <Box component="img" src={GitHubLogo} alt={"logo"} ml={"20px"} w={"55px"} />
              </Group>

            <TextInput
              leftSectionPointerEvents="none"
              label="Email or Username"
              placeholder="Your email or username"
              withAsterisk
            />
            <TextInput
              leftSectionPointerEvents="none"
              label="Password"
              placeholder="Your password"
              withAsterisk
            />
            <Text c={"dimmed"}>Forgot Password?</Text>
            <Button variant={"gradient"} >Sign In</Button>
            </Stack>
            </Card>
        </Grid.Col>

      </Grid>

    </Box>

  );

}

export default SignInPage;
