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

export interface Reviewer {
  login: string;
  state: string;
  avatarUrl: string;
}

export interface Assignee {
  id: string;
  login: string;
  avatarUrl: string;
}

export interface PRDetailSideBarProps {
  addedReviewers: Reviewer[];
  addedAssignees: Assignee[];
  labels: Label[];
  author: string;
}

interface AssigneesRequest {
  assignees: string[];
}

function PRDetailSideBar({ addedReviewers, labels, addedAssignees, author }: PRDetailSideBarProps) {
  const { owner, repoName, prnumber } = useParams();
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
  const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [addedReviewer, setAddedReviewer] = useState<Reviewer[]>([]);
  const [addedAssigneesList, setAddedAssigneesList] = useState<Assignee[]>([]);
  const [priority, setPriority] = useState<PriorityBadgeLabel>(null);
  const [query, setQuery] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeList, setAssigneeList] = useState<Assignee[]>([]);
  const filteredReviewers = contributors.filter((item) => item.login.toLowerCase().includes(query.toLowerCase()));
  const removedAssignees = assigneeList.filter(
    (assignee) => !addedAssigneesList.some((addedItem) => addedItem.login === assignee.login),
  );
  const filteredAssignees = removedAssignees.filter((item) =>
    item.login.toLowerCase().includes(assigneeQuery.toLowerCase()),
  );

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/GetPRReviewerSuggestion/${owner}/${repoName}/${author}`, {
          withCredentials: true,
        });
        if (res.data) {
          setContributors(res.data);
        }
      } catch (error) {
        console.error("Error fetching contributors:", error);
      }
    };
    fetchContributors();
  }, [author, owner, repoName]);

  useEffect(() => {
    if (addedReviewers.length != 0) {
      setAddedReviewer(addedReviewers);
    }
  }, [addedReviewers]);

  useEffect(() => {
    if (addedAssignees.length != 0) {
      setAddedAssigneesList(addedAssignees);
    }
  }, [addedAssignees]);

  useEffect(() => {
    if (labels.length != 0) {
      const temp = labels.find((itm) => itm.name.includes("Priority"));
      if (temp != undefined) {
        labels.filter((itm) => itm !== temp);
        setPriority(temp.name.slice("Priority: ".length) as PriorityBadgeLabel);
      }
    }
  }, [labels]);

  useEffect(() => {
    if (addedReviewers.length != 0) {
      setAddedReviewer(addedReviewers);
    }
  }, [addedReviewers]);

  function addReviewer(reviewer: Contributor) {
    const newReviewer = {
      login: reviewer.login,
      state: "PENDING",
      avatarUrl: reviewer.avatarUrl,
    };
    setAddedReviewer([newReviewer, ...addedReviewer]);
    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/request_review`, [reviewer.login], {
        withCredentials: true,
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }

  //HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/remove_reviewer/{reviewer}")]
  const deleteReviewer = (reviewer: string) => {
    setAddedReviewer(addedReviewer.filter((item) => item.login.toString() != reviewer));
    axios
      .delete(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/remove_reviewer/${reviewer}`, {
        withCredentials: true,
      })
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
  function addAssignee(assignee: Assignee) {
    const newAssignee = {
      login: assignee.login,
      avatarUrl: assignee.avatarUrl,
      id: assignee.id,
    };
    const assigneesRequest: AssigneesRequest = {
      assignees: [assignee.login.toString()],
    };
    setAddedAssigneesList([newAssignee, ...addedAssigneesList]);
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
  const deleteAssignee = (assignee: Assignee) => {
    setAddedAssigneesList(addedAssigneesList.filter((item) => item != assignee));
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
    // delete the priority label
    if (value == null) {
      if (priority) {
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
    } else if (state == "PENDING") {
      return (
        <Tooltip label="Pending">
          <IconHourglassHigh color="#40B5AD" style={{ width: rem(22), height: rem(22) }} />
        </Tooltip>
      );
    } else if (state == "CHANGES_REQUESTED") {
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
              {addedReviewer.length == 0 ? (
                <Text c="dimmed">No reviewer added</Text>
              ) : (
                addedReviewer.map((reviewer) => (
                  <Grid key={reviewer.login} mb="sm">
                    <Grid.Col span={2}>
                      <Avatar src={reviewer.avatarUrl} size="sm" />
                    </Grid.Col>
                    <Grid.Col span={7}>
                      <Text size="sm"> {reviewer.login} </Text>
                    </Grid.Col>
                    <Grid.Col span={2}>{stateToMessage(reviewer.state)}</Grid.Col>
                    <Grid.Col span={1}>
                      <Tooltip label="Delete">
                        <CloseButton
                          onClick={() => deleteReviewer(reviewer.login)}
                          icon={<IconXboxX color="gray" size={18} stroke={1.5} />}
                        />
                      </Tooltip>
                    </Grid.Col>
                  </Grid>
                ))
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
                  {addedReviewer.find((itm2) => itm.login == itm2.login) == undefined ? (
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
        <SelectLabel githubAddedLabels={labels.map(({ name }) => ({ name, key: name, color: "ffffff" }))} />
      </Paper>
    </Box>
  );
}

export default PRDetailSideBar;
