import { Badge, Box, Flex, rem, Text, Button } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import UserLogo from "../assets/icons/user.png";
import classes from "../styles/PRList.module.css";

export default function PrContextTab() {
  const contextText =
    "This pull request addresses a critical bug in the user authentication " +
    "module. The issue stemmed from improper handling of user sessions, leading to unexpected logouts. The changes in this " +
    "PR include a comprehensive fix to the session management, ensuring a seamless user experience by preventing inadvertent logouts. " +
    "Additionally, the code has been optimized for better performance, and thorough testing, including unit and integration " +
    "tests, has been conducted to validate the solution. Reviewers are encouraged to focus on the modifications in the " +
    "authentication module, paying attention to code readability, maintainability, and adherence to coding standards. " +
    "This PR is a crucial step in maintaining the reliability and stability of our application.";

  const iconSparkles = <IconSparkles style={{ width: rem(22), height: rem(22) }} />;

  return (
    <Box>
      <Box>
        <Badge leftSection={iconSparkles} mb={3} variant={"gradient"} style={{ visibility: "visible" }}>
          Context
        </Badge>
        <Flex direction="column" style={{ border: "solid 0.5px cyan", borderRadius: "10px" }}>
          <Text size="md" style={{ textAlign: "center", padding: "10px" }}>
            {" "}
            {contextText}
          </Text>
        </Flex>
        <Text size="sm" style={{ marginTop: "3px", color: "gray", marginBottom: "3px" }}>
          Context seems unclear/problematic?
        </Text>
        <Button variant="filled" color="#415A77">
          {" "}
          Generate new one{" "}
        </Button>
      </Box>

      <Badge size={"lg"} color={""} style={{ marginTop: 25 }}>
        Contributers
      </Badge>
      <Box style={{ display: "flex", marginBottom: "3px" }}>
        <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
        <Text size={"md"} style={{ padding: "3px" }}>
          aysekelleci
        </Text>
      </Box>
      <Box style={{ display: "flex", marginBottom: "3px" }}>
        <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
        <Text size={"md"} style={{ padding: "3px" }}>
          {" "}
          irem_aydın
        </Text>
      </Box>
    </Box>
  );
}
