import { Avatar, Blockquote, Box, Card, Divider, Flex, Group, Text, Title } from "@mantine/core";
import { ReviewQueuePullRequest } from "../../pages/ReviewQueuePage";
import { Link } from "react-router-dom";
import UserLogo from "../../assets/icons/user.png";
import LabelButton from "../LabelButton";

export interface PullRequestCardProps {
  data: ReviewQueuePullRequest;
}

function PullRequestCard({ data: pr }: PullRequestCardProps) {
  return (
    <Card my="sm" withBorder>
      <Group grow>
        <Box>
          <Link to={"pulls/" + pr.id} style={{ textDecoration: "none" }}>
            <Title order={3}>{pr.title}</Title>
          </Link>
          <Text>
            #{pr.id} opened by {pr.author}
            <Avatar src={UserLogo} size="sm" display="inline-block" mx={4} />
            at {pr.creationTimestamp}
          </Text>
        </Box>

        <Flex justify="end">
          {pr.labels.map((label) => (
            <LabelButton key={label} label={label} size="md" />
          ))}
        </Flex>
      </Group>

      <Divider my="xs" />

      <Text>
        Changes{" "}
        <Text span c="green">
          +{pr.diffstat.additions}
        </Text>{" "}
        <Text span c="red">
          -{pr.diffstat.deletions}
        </Text>{" "}
        over {pr.diffstat.fileCount} files
      </Text>

      <Text>
        Currently{" "}
        <Text span c="green">
          {pr.ciChecks.passedCount} passed
        </Text>
        , {""}
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

      <Divider my="xs" />

      <Text>
        Review requested of{" "}
        <Text span fs="italic">
          {pr.reviewers[0].name}
        </Text>{" "}
        for {pr.reviewers[0].reviewTypes.join(", ")}
      </Text>
      <Text>
        Includes {pr.reviewers[0].comments?.length ?? 0} comments and {pr.reviewers[0].fileCount} files
      </Text>

      <Blockquote p="sm">{pr.contextComment}</Blockquote>

      <Text>
        Currently has {pr.comments.length} comments:{" "}
        {Object.entries(
          pr.comments.reduce((acc, c) => ({ ...acc, [c.label]: (acc[c.label as keyof typeof acc] ?? 0) + 1 }), {}),
        )
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")}{" "}
        ({pr.comments.filter((c) => c.decorations.blocking).length} blocking)
      </Text>

      <Text>
        Estimated workload is {pr.reviewLoad.estimatedLoad}{" "}
        {pr.reviewLoad.previouslyApproved && "(Previously approved)"}
      </Text>
    </Card>
  );
}

export default PullRequestCard;
