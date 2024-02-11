import {Button, Avatar, Blockquote, Box, Card, Flex, Group, Text, Title, Collapse, rem} from "@mantine/core";
import {ReviewQueuePullRequest} from "../../pages/ReviewQueuePage";
import {Link} from "react-router-dom";
import UserLogo from "../../assets/icons/user.png";
import LabelButton from "../LabelButton";
import {useDisclosure} from "@mantine/hooks";
import {IconCaretDown, IconCaretUp} from "@tabler/icons-react";

export interface PullRequestCardProps {
  data: ReviewQueuePullRequest;
}

function PRCard({data: pr}: PullRequestCardProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const iconDown = <IconCaretDown style={{ width: rem(22), height: rem(22) }} />;
  const iconUp = <IconCaretUp style={{ width: rem(22), height: rem(22) }} />;


  return (
    <Card withBorder>
      <Link to={"pulls/" + pr.id} style={{textDecoration: "none"}}>
        <Group grow>
          <Box>
            <Link to={"pulls/" + pr.id} style={{textDecoration: "none"}}>
              <Group>
                <Title order={5}>{pr.title}</Title>
                <Text c="dimmed">waiting for {pr.lastActivityTimestamp} days</Text>
              </Group>
              </Link>
            <Text>
              #{pr.id} opened by
              <Avatar src={UserLogo} size="xs" display="inline-block" mx={4}/>
              {pr.author}

              {" "}
              at 12.11.2023
            </Text>
          </Box>
          <Flex justify="end">
            {pr.labels.map((label) => (
              <LabelButton key={label} label={label} size="md"/>
            ))}
          </Flex>
        </Group>
      </Link>
      <Flex justify="space-between">
        <Text c="dimmed">
          Includes {pr.reviewers[0].comments?.length ?? 0} comments and {pr.reviewers[0].fileCount} files
        </Text>
        {
          opened ?
            <Button leftSection={iconUp} variant="subtle" size="compact-sm" onClick={toggle}>Show Less</Button>
              :
            <Button leftSection={iconDown} variant="subtle" size="compact-sm" onClick={toggle}>Show More</Button>
        }
      </Flex>

      <Collapse in={opened}>
        <Blockquote p="sm">
          <Text>
            Currently{" "}
            <Text span c="green">
              {pr.ciChecks.passedCount} passed
            </Text>
            ,
            <Text span c="red">
              {pr.ciChecks.failedCount} failed
            </Text>{" "}
            of {pr.ciChecks.totalCount} CI checks (prereview checks:{" "}
            {pr.ciChecks.prereviewChecks.map((c, i) => (
              <>
                <Text span c={c.passed ? "green" : "red"}>
                  {c.name}
                </Text>
                {i !== pr.ciChecks.prereviewChecks.length - 1 && ", "}
              </>
            ))}
            )
          </Text>

        </Blockquote>
      </Collapse>
    </Card>
  );
}

export default PRCard;
