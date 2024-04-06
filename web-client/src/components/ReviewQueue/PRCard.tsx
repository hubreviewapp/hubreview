import { Tooltip, Button, Avatar, Blockquote, Box, Card, Flex, Group, Text, Title, Collapse, rem } from "@mantine/core";
import { Link } from "react-router-dom";
import LabelButton, { HubReviewLabelType } from "../LabelButton";
import { useDisclosure } from "@mantine/hooks";
import {
  IconMessages,
  IconCaretDown,
  IconCaretUp,
  IconCircleCheck,
  IconXboxX,
  IconMessage,
  IconFiles,
  IconThumbUp,
} from "@tabler/icons-react";
import { PRInfo } from "../../models/PRInfo.tsx";
import PriorityBadge, { PriorityBadgeLabel } from "../PriorityBadge";

export interface PullRequestCardProps {
  data: PRInfo;
}
const formatDate = (dateString: string) => {
  const currentDate = new Date();
  const pastDate = new Date(dateString);
  const timeDifference = currentDate.getTime() - pastDate.getTime();
  const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
  if (daysDifference == 0) {
    return "today";
  } else if (daysDifference == 1) {
    return "yesterday";
  }
  return `${daysDifference} days ago`;
};
function PRCard({ data: pr }: PullRequestCardProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const iconDown = <IconCaretDown style={{ width: rem(22), height: rem(22) }} />;
  const iconUp = <IconCaretUp style={{ width: rem(22), height: rem(22) }} />;

  function stateToMessage(state: string) {
    if (state == "APPROVED") {
      return (
        <Text c="dimmed">
          <Tooltip label="Approved">
            <IconThumbUp color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
          </Tooltip>
        </Text>
      );
    } else if (state == "COMMENTED") {
      return (
        <Tooltip label="Commented">
          <IconMessage color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
        </Tooltip>
      );
    }
  }

  return (
    <Card withBorder>
      {pr.labels
        .filter((l) => l.name.includes("Priority"))
        .map((label) => (
          <PriorityBadge key={label.id} label={label.name.replace("Priority: ", "") as PriorityBadgeLabel} size="md" />
        ))}
      <Link to={`pulls/pullrequest/${pr.repoOwner}/${pr.repoName}/${pr.prNumber}`} style={{ textDecoration: "none" }}>
        <Group grow>
          <Box>
            <Text c="dimmed">{pr.repoName}</Text>
            <Group>
              <Title order={4}>{pr.title}</Title>
              <Text c="dimmed">Updated {formatDate(pr.updatedAt)}</Text>
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
              pr.labels
                .filter((l) => !l.name.includes("Priority"))
                .map((label) => <LabelButton key={label.id} label={label.name as HubReviewLabelType} size="md" />)
            )}
          </Group>
        </Group>
      </Link>
      <Flex justify="space-between">
        <Box my="sm">
          <IconMessages style={{ width: rem(18), height: rem(18) }} />
          {pr.comments} comments, {"  "}
          <IconFiles style={{ width: rem(18), height: rem(18) }} />
          {pr.files} files
        </Box>
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
          <Text c="green" mb="sm">
            +{pr.additions} lines added ,{" "}
            <Text span c="red">
              -{pr.deletions} lines deleted
            </Text>
          </Text>
          {pr.checks.length == 0 ? (
            <div />
          ) : (
            <Group mb="sm">
              <Text c="dimmed">
                Checks: {pr.checksSuccess} passed, {pr.checksFail} failed
              </Text>
              {pr.checks
                .filter((c) => c.conclusion?.StringValue == "failure")
                .map((c) => (
                  <Group key={c.id}>
                    <Text color="red">{c.name}</Text>
                    <IconXboxX color="red" style={{ width: rem(22), height: rem(22), color: "red" }} />
                  </Group>
                ))}
              {pr.checks
                .filter((c) => c.conclusion?.StringValue == "success")
                .map((c) => (
                  <Group key={c.id}>
                    <Text color="green">{c.name}</Text>
                    <IconCircleCheck color="green" style={{ width: rem(22), height: rem(22), color: "green" }} />
                  </Group>
                ))}
            </Group>
          )}

          <Group>
            {pr.reviews.length == 0 ? (
              <Text c="dimmed">No reviews added.</Text>
            ) : (
              <Group>
                <Text c="dimmed">Review status:</Text>
                {pr.reviews.map((r) => (
                  <Group key={r.login}>
                    <Text>{r.login}:</Text>
                    <Text c="dimmed">{stateToMessage(r.state)}</Text>
                  </Group>
                ))}
              </Group>
            )}
          </Group>
        </Blockquote>
      </Collapse>
    </Card>
  );
}

export default PRCard;
