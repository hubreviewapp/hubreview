import { Button, Avatar, Blockquote, Box, Card, Flex, Group, Text, Title, Collapse, rem } from "@mantine/core";
import { Link } from "react-router-dom";
import UserLogo from "../../assets/icons/user.png";
import LabelButton, { HubReviewLabelType } from "../LabelButton";
import { useDisclosure } from "@mantine/hooks";
import { IconCaretDown, IconCaretUp } from "@tabler/icons-react";
import { PRInfo } from "../../models/PRInfo.tsx";

export interface PullRequestCardProps {
  data: PRInfo;
}

function PRCard({ data: pr }: PullRequestCardProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const iconDown = <IconCaretDown style={{ width: rem(22), height: rem(22) }} />;
  const iconUp = <IconCaretUp style={{ width: rem(22), height: rem(22) }} />;
  return (
    <Card withBorder>
      <Link to={`pulls/pullrequest/${pr.repoOwner}/${pr.repoName}/${pr.prNumber}`} style={{ textDecoration: "none" }}>
        <Group grow>
          <Box>
            <Text c="dimmed">{pr.repoName}</Text>
            <Group>
              <Title order={4}>{pr.title}</Title>
              <Text c="dimmed">Last updated at {pr.updatedAt}</Text>
            </Group>
            <Text>
              #{pr.prNumber} opened by <Avatar src={pr.authorAvatarURL} size="xs" display="inline-block" mx={4} />{" "}
              {pr.author}
            </Text>
          </Box>
          <Group justify="end">
            {pr.labels.length === 0 ? (
              <></>
            ) : (
              pr.labels.map((label) => (
                <LabelButton key={label.id} label={label.name as HubReviewLabelType} size="md" />
              ))
            )}
          </Group>
        </Group>
      </Link>
      <Flex justify="space-between">
        <Text c="dimmed">
          Includes {pr.comments} comments and {pr.files} files
        </Text>
        {opened ? (
          <Button leftSection={iconUp} variant="subtle" size="compact-sm" onClick={toggle}>
            Show Less
          </Button>
        ) : (
          <Button leftSection={iconDown} variant="subtle" size="compact-sm" onClick={toggle}>
            Show More
          </Button>
        )}
      </Flex>

      <Collapse in={opened}>
        <Blockquote p="sm">
          <Text>
            Checkler buraya gelecek.
            {/*Currently{" "}
            <Text span c="green">
              2 passed
            </Text>
            ,
            <Text span c="red">
              0 failed
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
            )*/}
          </Text>
          <Text c="green">
            +{pr.additions} lines added ,{" "}
            <Text span c="red">
              -{pr.deletions} lines deleted
            </Text>
          </Text>
          <Group>
            <Text c="dimmed">Reviewers:</Text>
            <Text>
              <Avatar src={UserLogo} size="xs" display="inline-block" mx={4} />
              ece_kahraman
            </Text>
            <Text>
              <Avatar src={UserLogo} size="xs" display="inline-block" mx={4} />
              ayse_kelleci
            </Text>
          </Group>
        </Blockquote>
      </Collapse>
    </Card>
  );
}

export default PRCard;
