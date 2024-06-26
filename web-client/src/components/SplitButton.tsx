import { Button, rem, Text } from "@mantine/core";
import { Box, Popover } from "@mantine/core";
//import classes from "./SplitButton.module.scss";
import { IconGitMerge, IconX, IconCheck } from "@tabler/icons-react";
import { MergeInfo } from "../pages/PRDetailsPage.tsx";
import MergeButton from "./MergeButton.tsx";
import { APIMergeableState, APIMergeStateStatus } from "../api/types.ts";

export interface SplitButtonProps {
  mergeInfo: MergeInfo | null;
  mergeableState: APIMergeableState;
  mergeStateStatus: APIMergeStateStatus | null;
  conflictUrl: string;
}

function SplitButton({ mergeInfo, mergeableState, mergeStateStatus, conflictUrl }: SplitButtonProps) {
  const isMergeable = mergeableState === APIMergeableState.MERGEABLE;
  const resolveConflictUrl = conflictUrl + "/conflicts";

  return (
    <div>
      <Popover
        withArrow
        arrowOffset={14}
        arrowSize={15}
        width={200}
        position="right-start"
        offset={{ mainAxis: 15, crossAxis: 0 }}
      >
        <Popover.Target>
          <Box
            style={{
              position: "relative",
              backgroundColor: isMergeable && mergeStateStatus === APIMergeStateStatus.CLEAN ? "green" : "#C80000",
              width: 200,
              borderRadius: 10,
              display: "flex",
            }}
          >
            {(!isMergeable || mergeStateStatus !== APIMergeStateStatus.CLEAN) && (
              <>
                <IconGitMerge color="white" style={{ width: rem(40), height: rem(40), marginTop: 0, marginLeft: 10 }} />
                <Text style={{ marginTop: "5px" }} size="md" fw={500} c="white">
                  {" "}
                  Not Able to Merge
                </Text>
              </>
            )}
            {isMergeable && mergeStateStatus === APIMergeStateStatus.CLEAN && (
              <>
                <IconGitMerge style={{ width: rem(50), height: rem(50), marginTop: 0, marginLeft: 10 }} />
                <Text size="sm" fw={700}>
                  {" "}
                  Able to Merge
                </Text>
              </>
            )}
          </Box>
        </Popover.Target>
        <Popover.Dropdown style={{ width: 770 }}>
          {mergeInfo?.requiredConversationResolution && (
            <>
              <Box style={{ display: "flex", padding: "5px" }}>
                <Box>
                  <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 15 }} />
                </Box>
                <Text fw={700} size="lg" style={{ marginTop: 15, color: "red" }}>
                  Unresolved conversations
                </Text>
              </Box>
              <hr></hr>
            </>
          )}
          {mergeInfo?.requiredApprovals !== 0 && (
            <>
              <Box style={{ display: "flex" }}>
                <Box>
                  <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
                </Box>
                <Text c="red" fw={700} style={{ marginTop: 15 }}>
                  Review required (2/ {mergeInfo?.requiredApprovals})
                </Text>
              </Box>
              <Text size="sm">
                At least {mergeInfo?.requiredApprovals} approving review is required by reviewers with write access.
              </Text>
              {/*
              <Text size="sm" td="underline" c="blue">
                See all reviewers
              </Text>
              */}
            </>
          )}
          {mergeInfo?.requiredApprovals === 0 && (
            <>
              <Box style={{ display: "flex" }}>
                <Box>
                  <IconCheck color="green" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
                </Box>
                <Text c="white" fw={700} style={{ marginTop: 15 }}>
                  Approval not required
                </Text>
              </Box>
              <Text size="sm">This pull request may be merged without approvals.</Text>
              {/*
              <Text size="sm" td="underline" c="blue">
                See all reviewers
              </Text>
              */}
            </>
          )}
          <hr></hr>
          {mergeInfo && mergeInfo?.requiredChecks && mergeInfo.requiredChecks.length !== 0 && (
            <>
              <Box style={{ display: "flex" }}>
                <Box>
                  <IconCheck color="green" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
                </Box>
                <Text fw={700} style={{ marginTop: 15 }}>
                  All checks have passed
                </Text>
                <Text size="sm">2 successful checks {mergeInfo?.requiredChecks}</Text>
              </Box>
              <hr></hr>
            </>
          )}

          {mergeInfo?.isConflict && (
            <>
              <Box style={{ display: "flex" }}>
                <Box>
                  <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
                </Box>
                <Text style={{ marginTop: 15, marginRight: 30, color: "red" }}>
                  This branch has conflicts that must be resolved
                </Text>
                <Button component="a" target="_blank" href={resolveConflictUrl} color="gray">
                  {" "}
                  Resolve Conflicts{" "}
                </Button>
              </Box>
            </>
          )}
          {!mergeInfo?.isConflict && (
            <>
              <Box style={{ display: "flex" }}>
                <Box>
                  <IconCheck color="green" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
                </Box>
                <Text c="white" style={{ marginTop: 15 }}>
                  This branch has no conflicts with the base branch
                </Text>
              </Box>
              <Text size="sm"> Merging can be performed automatically.</Text>
            </>
          )}
          <hr></hr>
          {(!isMergeable || mergeStateStatus !== APIMergeStateStatus.CLEAN) && (
            <Box style={{ display: "flex" }}>
              <Box>
                <IconX color="red" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
              </Box>
              <Text style={{ marginTop: 15, color: "red" }}>Merging is blocked</Text>
            </Box>
          )}
          {isMergeable && mergeStateStatus === APIMergeStateStatus.CLEAN && (
            <Box style={{ display: "flex" }}>
              <Box>
                <IconCheck color="green" style={{ width: rem(30), height: rem(30), marginLeft: 5, marginTop: 10 }} />
              </Box>
              <Text style={{ marginTop: 15 }}>Mergeable</Text>
            </Box>
          )}
          <br />
          <MergeButton isMergeable={isMergeable && mergeStateStatus === APIMergeStateStatus.CLEAN} />
          <br />
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

export default SplitButton;
