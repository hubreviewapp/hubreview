import {
  Grid,
  Group,
  Paper,
  Box,
  Progress,
  rem,
  UnstyledButton,
  Text,
  Tooltip,
  Badge,
  Avatar,
  ScrollArea,
  TextInput,
  Divider,
  Select,
  CloseButton,
  Popover,
  Flex,
  ActionIcon,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconCirclePlus,
  IconCheck,
  IconXboxX,
  IconThumbUp,
  IconMessage,
  IconHourglassHigh,
  IconFilePencil,
  IconSearch,
  IconUserPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import PriorityBadge, { PriorityBadgeLabel } from "./PriorityBadge";
import { useParams } from "react-router-dom";
import axios from "axios";
import SelectLabel from "./SelectLabel";
import BarColor from "../utility/WorkloadBarColor.ts";
import { BASE_URL } from "../env.ts";
import {
  APIPullRequestAssignee,
  APIPullRequestDetails,
  APIPullRequestReviewMetadata,
  APIPullRequestReviewState,
  APIPullRequestReviewer,
  APIPullRequestReviewerActorType,
} from "../api/types.ts";
import { useQueryClient } from "@tanstack/react-query";

export interface Contributor {
  id: string;
  login: string;
  avatarUrl: string;
  currentLoad: number;
  maxLoad: number;
}

export interface Label {
  name: string;
}

interface AssigneesRequest {
  assignees: string[];
}

const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;

export interface PRDetailSideBarProps {
  pullRequestDetails: APIPullRequestDetails;
}

function PRDetailSideBar({ pullRequestDetails }: PRDetailSideBarProps) {
  const queryClient = useQueryClient();
  const { owner, repoName, prnumber } = useParams();

  const [contributors, setContributors] = useState<Contributor[]>([]);

  const [addedReviewers, setAddedReviewers] = useState<APIPullRequestReviewer[]>([]);

  const [query, setQuery] = useState("");
  const filteredReviewers = contributors.filter((item) => item.login.toLowerCase().includes(query.toLowerCase()));

  const reviewsPerReviewer = pullRequestDetails.reviews.reduce(
    function (result, review) {
      (result[review.author.login] = result[review.author.login] || []).push(review);
      return result;
    },
    {} as { [key: string]: APIPullRequestReviewMetadata[] },
  );
  const latestReviewsPerReviewer = Object.values(reviewsPerReviewer).map(
    (reviews) => reviews.sort((a, b) => +b.createdAt - +a.createdAt)[0],
  );

  const pendingReviewerReviews = addedReviewers.map((r) => ({
    id: r.id,
    author:
      r.actor.type === APIPullRequestReviewerActorType.USER
        ? {
            login: r.actor.login,
            avatarUrl: r.actor.avatarUrl,
          }
        : null!, // TODO: support team reviewers
    state: APIPullRequestReviewState.PENDING,
  }));

  const [priority, setPriority] = useState<PriorityBadgeLabel>(null);

  const [addedAssigneesList, setAddedAssigneesList] = useState<APIPullRequestAssignee[]>([]);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeList, setAssigneeList] = useState<APIPullRequestAssignee[]>([]);
  const removedAssignees = assigneeList.filter(
    (assignee) => !addedAssigneesList.some((addedItem) => addedItem.login === assignee.login),
  );
  const filteredAssignees = removedAssignees.filter((item) =>
    item.login.toLowerCase().includes(assigneeQuery.toLowerCase()),
  );

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/github/GetPRReviewerSuggestion/${owner}/${repoName}/${pullRequestDetails.author.login}`,
          {
            withCredentials: true,
          },
        );
        if (res.data) {
          setContributors(res.data);
        }
      } catch (error) {
        console.error("Error fetching contributors:", error);
      }
    };
    fetchContributors();
  }, [pullRequestDetails.author.login, owner, repoName]);

  useEffect(() => {
    if (pullRequestDetails.reviewers.length !== 0) {
      setAddedReviewers(pullRequestDetails.reviewers);
    }
  }, [pullRequestDetails.reviewers]);

  useEffect(() => {
    if (pullRequestDetails.assignees.length !== 0) {
      setAddedAssigneesList(pullRequestDetails.assignees);
    }
  }, [pullRequestDetails.assignees]);

  useEffect(() => {
    if (pullRequestDetails.labels.length !== 0) {
      const temp = pullRequestDetails.labels.find((itm) => itm.name.includes("Priority"));
      if (temp != undefined) {
        pullRequestDetails.labels.filter((itm) => itm !== temp);
        setPriority(temp.name.slice("Priority: ".length) as PriorityBadgeLabel);
      }
    }
  }, [pullRequestDetails.labels]);

  function addReviewer(reviewer: Contributor) {
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/request_review`, [reviewer.login], {
        withCredentials: true,
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [`/pullrequests/${owner}/${repoName}/${prnumber}`], exact: true });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  //HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/remove_reviewer/{reviewer}")]
  const deleteReviewer = (reviewerId: string) => {
    const reviewer = addedReviewers.find((r) => r.id === reviewerId);
    if (reviewer === undefined) {
      console.warn(`Couldn't find reviewer with ID ${reviewerId}`);
      return;
    }

    const reviewerAPIIdentifier =
      reviewer.actor.type === APIPullRequestReviewerActorType.USER ? reviewer.actor.login : null;
    if (reviewerAPIIdentifier === undefined) {
      console.error(`Couldn't find API-side reviewer ID`);
      return;
    }

    setAddedReviewers(addedReviewers.filter((item) => item.id !== reviewerId));
    axios
      .delete(
        `${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/remove_reviewer/${reviewerAPIIdentifier}`,
        {
          withCredentials: true,
        },
      )
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  };

  //HttpGet("getRepoAssignees/{owner}/{repoName}
  useEffect(() => {
    const fetchAssigneeList = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/getRepoAssignees/${owner}/${repoName}`, {
          withCredentials: true,
        });
        if (res.data) {
          console.log("sdvfb", res.data);
          setAssigneeList(res.data);
        }
      } catch (error) {
        console.error("Error fetching contributors:", error);
      }
    };
    fetchAssigneeList();
  }, [owner, repoName]);

  //[HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addAssignees")]
  function addAssignee(assignee: APIPullRequestAssignee) {
    const assigneesRequest: AssigneesRequest = {
      assignees: [assignee.login],
    };
    setAddedAssigneesList([assignee, ...addedAssigneesList]);
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addAssignees`, assigneesRequest, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }

  //[HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/removeAssignees")]
  const deleteAssignee = (assignee: APIPullRequestAssignee) => {
    setAddedAssigneesList(addedAssigneesList.filter((item) => item.id !== assignee.id));
    const assigneesRequest: AssigneesRequest = {
      assignees: [assignee.login.toString()],
    };
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/removeAssignees`, assigneesRequest, {
        withCredentials: true,
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  };

  function changePriority(value: PriorityBadgeLabel) {
    console.log("value", value);
    console.log(priority);
    // delete the priority label

    if (priority != null) {
      axios
        .delete(
          `${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/${"Priority: ".concat(
            priority.toString(),
          )}`,
          {
            withCredentials: true,
          },
        )
        .then(function () {})
        .catch(function (error) {
          console.log(error);
        });
    }
    if (value == null) {
      setPriority(value);
      return;
    }
    setPriority(value);
    axios
      .post(
        `${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addLabel`,
        ["Priority: ".concat(value.toString())],
        {
          withCredentials: true,
        },
      )
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }

  function stateToMessage(state: APIPullRequestReviewState) {
    if (state === APIPullRequestReviewState.APPROVED) {
      return (
        <Text c="dimmed">
          <Tooltip label="Approved">
            <IconThumbUp color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
          </Tooltip>
        </Text>
      );
    } else if (state === APIPullRequestReviewState.COMMENTED) {
      return (
        <Tooltip label="Commented">
          <IconMessage color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
        </Tooltip>
      );
    } else if (state === APIPullRequestReviewState.PENDING) {
      return (
        <Tooltip label="Pending">
          <IconHourglassHigh color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
        </Tooltip>
      );
    } else if (state === APIPullRequestReviewState.CHANGES_REQUESTED) {
      return (
        <Tooltip label="Changes requested">
          <IconFilePencil color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
        </Tooltip>
      );
    }
  }

  return (
    <Box w="300px">
      <Paper p="sm" withBorder>
        <Box>
          <Grid>
            <Grid.Col span={10}>
              <Text fw={500} size="md" mb="sm">
                Reviewers
              </Text>
              {latestReviewsPerReviewer.length === 0 && addedReviewers.length === 0 && (
                <Text c="dimmed">No reviewer added</Text>
              )}
              {latestReviewsPerReviewer.map((review) => (
                <Grid key={review.id} mb="sm">
                  <Grid.Col span={2}>
                    <Avatar src={review.author.avatarUrl} size="sm" />
                  </Grid.Col>
                  <Grid.Col span={7}>
                    <Text size="sm"> {review.author.login} </Text>
                  </Grid.Col>
                  <Grid.Col span={2}>{stateToMessage(review.state)}</Grid.Col>
                  <Grid.Col span={1}>
                    {review.state === APIPullRequestReviewState.PENDING && (
                      <Tooltip label="Delete">
                        <CloseButton
                          onClick={() => deleteReviewer(review.id)}
                          icon={<IconXboxX color="gray" size={18} stroke={1.5} />}
                        />
                      </Tooltip>
                    )}
                  </Grid.Col>
                </Grid>
              ))}
              {addedReviewers.length !== 0 && (
                <Box>
                  <Text ta="center" size="xs" c="dimmed" mb="sm">
                    Pending Reviewers
                  </Text>
                  {pendingReviewerReviews.map((review) => (
                    <Grid key={review.id} mb="sm">
                      <Grid.Col span={2}>
                        <Avatar src={review.author.avatarUrl} size="sm" />
                      </Grid.Col>
                      <Grid.Col span={7}>
                        <Text size="sm"> {review.author.login} </Text>
                      </Grid.Col>
                      <Grid.Col span={2}>{stateToMessage(review.state)}</Grid.Col>
                      <Grid.Col span={1}>
                        <Tooltip label="Delete">
                          <CloseButton
                            onClick={() => deleteReviewer(review.id)}
                            icon={<IconXboxX color="gray" size={18} stroke={1.5} />}
                          />
                        </Tooltip>
                      </Grid.Col>
                    </Grid>
                  ))}
                </Box>
              )}
            </Grid.Col>
            <Grid.Col span={6}></Grid.Col>
          </Grid>
          <Divider mb="md" />
          <Grid my="sm">
            <Grid.Col span={5}>
              <Text fw={500} size="md">
                Suggestions
              </Text>
            </Grid.Col>
            <Grid.Col span={5}>
              <Text size="xs" c="dimmed">
                Reviewer Workload
              </Text>
            </Grid.Col>
            <Grid.Col span={1}>
              <Box>
                <Tooltip label="waiting reviews / reviewer capacity">
                  <Badge leftSection={iconInfo} variant="transparent" />
                </Tooltip>
              </Box>
            </Grid.Col>
          </Grid>
          <Box my="sm">
            <TextInput
              size="xs"
              radius="xl"
              value={query}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
              }}
              placeholder="Search Users"
            />
          </Box>
          <ScrollArea h={100} mt="5px" scrollbars="y">
            {filteredReviewers.map((itm) => (
              <Grid key={itm.id}>
                <Grid.Col span={6}>
                  <Group>
                    <Avatar src={itm.avatarUrl} size="xs" />
                    <Text size="xs">{itm.login}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Tooltip label={Math.ceil((itm.currentLoad / itm.maxLoad) * 100) + "%"}>
                    <Progress.Root mt="5px" size="lg">
                      <Progress.Section
                        animated
                        color={BarColor(itm.maxLoad, itm.currentLoad)}
                        value={Math.ceil((itm.currentLoad / itm.maxLoad) * 100)}
                      >
                        <Progress.Label>{Math.ceil((itm.currentLoad / itm.maxLoad) * 100)}%</Progress.Label>
                      </Progress.Section>
                    </Progress.Root>
                  </Tooltip>
                </Grid.Col>
                <Grid.Col span={1}>
                  {addedReviewers.find((itm2) => itm.id == itm2.id) == undefined ? (
                    <UnstyledButton onClick={() => addReviewer(itm)} style={{ fontSize: "12px" }}>
                      <IconCirclePlus size={18} stroke={1.5} />
                    </UnstyledButton>
                  ) : (
                    <IconCheck color="green" size={18} stroke={1.5} />
                  )}
                </Grid.Col>
              </Grid>
            ))}
          </ScrollArea>
        </Box>
        <Divider mt="md" />
        <Grid my="sm">
          <Grid.Col span={5}>
            <Flex>
              <Text fw={500} size="md">
                Assignees
              </Text>
              <Tooltip label="assign up to 10 person" style={{ marginLeft: -50 }}>
                <Badge leftSection={iconInfo} variant="transparent" />
              </Tooltip>
            </Flex>
          </Grid.Col>
          <Grid.Col span={3}></Grid.Col>
          <Grid.Col span={2}></Grid.Col>
          <Grid.Col span={2}>
            <Popover width={250} position="bottom" clickOutsideEvents={["mouseup", "touchend"]}>
              <Popover.Target>
                <ActionIcon variant="outline">
                  <IconUserPlus size={16} stroke={1.5} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                {assigneeList.length - addedAssigneesList.length === 0 && <Text c="dimmed">No assignee to add </Text>}
                {assigneeList.length - addedAssigneesList.length > 0 && (
                  <Box my="sm">
                    <TextInput
                      size="xs"
                      radius="xl"
                      value={assigneeQuery}
                      leftSection={iconSearch}
                      onChange={(event) => {
                        setAssigneeQuery(event.currentTarget.value);
                      }}
                      placeholder="Search Assignees"
                    />
                  </Box>
                )}
                {filteredAssignees.map((itm) => (
                  <Grid key={itm.id} style={{ marginBottom: 5 }}>
                    <Grid.Col span={2}>
                      <Avatar src={itm.avatarUrl} size="sm" />
                    </Grid.Col>
                    <Grid.Col span={8}>
                      <Text size="sm"> {itm.login} </Text>
                    </Grid.Col>
                    <Grid.Col span={2}>
                      <UnstyledButton onClick={() => addAssignee(itm)} style={{ fontSize: "12px" }}>
                        <IconCirclePlus size={18} stroke={1.5} />
                      </UnstyledButton>
                    </Grid.Col>
                  </Grid>
                ))}
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>
        </Grid>
        {addedAssigneesList.length === 0 ? (
          <Text c="dimmed">No assignee added </Text>
        ) : (
          addedAssigneesList.map((itm) => (
            <Group key={itm.id} style={{ marginBottom: 5 }}>
              <Box>
                <Avatar src={itm.avatarUrl} size="sm" />
              </Box>
              <Text size="sm"> {itm.login} </Text>
              <CloseButton
                onClick={() => deleteAssignee(itm)}
                icon={<IconXboxX color="gray" size={18} stroke={1.5} />}
              />
            </Group>
          ))
        )}

        <Divider mt="md" />
        <Box mt="sm">
          <Select
            label="Assign Priority"
            value={priority}
            onChange={(val) => changePriority(val as PriorityBadgeLabel)}
            placeholder="Assign Priority"
            data={["Critical", "High", "Medium", "Low"]}
            clearable
            mb="sm"
          />
          <PriorityBadge label={priority} size="md" />
        </Box>
        <Divider mt="md" />
        <SelectLabel
          githubAddedLabels={pullRequestDetails.labels.map(({ name }) => ({ name, key: name, color: "ffffff" }))}
        />
      </Paper>
    </Box>
  );
}

export default PRDetailSideBar;
