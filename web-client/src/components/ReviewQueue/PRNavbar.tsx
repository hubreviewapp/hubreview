import { useCallback, useEffect, useState } from "react";
import {
  Group,
  Accordion,
  Box,
  rem,
  TextInput,
  Text,
  ScrollArea,
  Button,
  Popover,
  NumberInput,
  Progress,
  Tooltip,
  Center,
} from "@mantine/core";
import { Checkbox } from "@mantine/core";
import { IconNotebook, IconSearch, IconCirclePlus, IconSettings } from "@tabler/icons-react";
import axios from "axios";
import classes from "../../styles/NavbarSimple.module.css";
import { Repository } from "../../models/Repository.tsx";
import { Link } from "react-scroll";
import { UseListStateHandlers } from "@mantine/hooks";
import { SelectedRepos } from "../../pages/ReviewQueuePage.tsx";
import { BASE_URL, GITHUB_APP_NAME } from "../../env";
import { useUser } from "../../providers/context-utilities";

const data = [
  //{ link: "", label: "New PRs", icon: IconBellRinging },
  { link: "", label: "Needs your review" },
  { link: "", label: "Your PRs" },
  { link: "", label: "Waiting for author" },
  { link: "", label: "All open PRs" },
  { link: "", label: "Merged" },
  { link: "", label: "Closed" },
];

interface PRNavbarProps {
  setActiveSection: (section: string) => void;
  activeSection: string;
  setSelectedRepos: UseListStateHandlers<SelectedRepos>;
  selectedRepos: SelectedRepos[];
}

interface Workload {
  currentLoad: number;
  maxLoad: number;
}

function barColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}

export function PRNavbar({ setActiveSection, activeSection, selectedRepos, setSelectedRepos }: PRNavbarProps) {
  //const [repository, setRepository] = useState<Repository[]>([]);
  const { user } = useUser();
  const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;
  const iconPlus = <IconCirclePlus style={{ width: rem(16), height: rem(16) }} />;
  const [query, setQuery] = useState("");
  const [prWorkload, setPrWorkload] = useState<string | number>(10);
  const [opened, setOpened] = useState<boolean>(false);
  const [userWorkload, setUserWorkload] = useState<Workload>({ currentLoad: 0, maxLoad: 1000 });

  //[HttpGet("user/{userName}/workload")]
  const getWorkload = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/github/user/${user?.login}/workload`, {
        withCredentials: true,
      });
      if (res) {
        setUserWorkload(res.data);
      }
    } catch (error) {
      console.error("Error getting user workload:", error);
    }
  }, [user]);

  useEffect(() => {
    getWorkload();
  }, [getWorkload]);

  //[HttpPost("user/{userLogin}/workload")]
  function editWorkload() {
    setOpened(false);
    if (typeof prWorkload === "string") {
      return;
    }
    axios
      .post(`${BASE_URL}/api/github/user/${user?.login}/workload`, prWorkload * 100, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })
      .then(function () {
        getWorkload();
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  useEffect(() => {
    const getRepos = async () => {
      const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: `${BASE_URL}/api/github`,
      });

      const res = await axiosInstance.get("/getRepository");
      if (res) {
        //setRepository(res.data.repoNames);

        const updatedRepos = res.data.repoNames.map((value: Repository) => ({
          name: value.name.toString(),
          selected: true,
        }));

        setSelectedRepos.setState(updatedRepos);
      }
    };

    getRepos();
  }, []); // eslint-disable-line

  const allChecked = selectedRepos.every((value) => value.selected);
  const indeterminate = selectedRepos.some((value) => value.selected) && !allChecked;

  const reposCount = selectedRepos.filter((value) => value.selected).length;

  const filtered = selectedRepos.filter((item) => item.name.includes(query));
  const items = filtered.map((value, index) => (
    <Checkbox
      mt="xs"
      ml={33}
      label={value.name}
      key={value.name}
      checked={value.selected}
      color="cyan"
      variant="outline"
      onChange={(event) => setSelectedRepos.setItemProp(index, "selected", event.currentTarget.checked)}
    />
  ));

  const repos = (
    <Accordion.Item key="repos" value="repos">
      <Accordion.Control>
        {" "}
        <IconNotebook />
        {`Selected Repos (${reposCount})`}
      </Accordion.Control>
      {selectedRepos.length > 0 && (
        <Accordion.Panel style={{ marginTop: -20 }}>
          <ScrollArea h={180}>
            <Box>
              <TextInput
                my="md"
                radius="md"
                leftSection={iconSearch}
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                }}
                placeholder="Search Repository"
              />
            </Box>
            <Checkbox
              checked={allChecked}
              indeterminate={indeterminate}
              label="Select all"
              variant="outline"
              onChange={() =>
                setSelectedRepos.setState((current) => current.map((value) => ({ ...value, selected: !allChecked })))
              }
            />
            {items}
          </ScrollArea>
        </Accordion.Panel>
      )}
      {selectedRepos.length == 0 && (
        <Accordion.Panel>
          <Text> There is no current repository </Text>
          <Button
            component="a"
            href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new`}
            target="_blank"
            leftSection={iconPlus}
          >
            {" "}
            Add new repository
          </Button>
        </Accordion.Panel>
      )}
    </Accordion.Item>
  );

  const links = data.map((item) => (
    <Link
      className={classes.link}
      data-active={item.label === activeSection || undefined}
      href={item.link}
      activeClass="active"
      to={item.label.replace(/\s+/g, "-").toLowerCase()}
      spy={true}
      smooth={true}
      duration={500}
      key={item.label}
      onClick={() => setActiveSection(item.label)}
    >
      {/*{item.icon && <item.icon className={classes.linkIcon} stroke={1.5} />} */}
      <span>{item.label}</span>
    </Link>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header}>
          <Accordion style={{ width: 300 }} chevronPosition="right" variant="contained">
            {repos}
          </Accordion>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        {/*
        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconActivity className={classes.linkIcon} stroke={1.5} />
          <span> Insights / Activity</span>
        </a>
        */}
        <Popover
          opened={opened}
          width={300}
          trapFocus
          position="bottom"
          withArrow
          shadow="md"
          clickOutsideEvents={["mouseup", "touchend"]}
        >
          <Popover.Target>
            <a href="#" className={classes.link} onClick={() => setOpened(true)}>
              <IconSettings className={classes.linkIcon} stroke={1.5} />
              <span> Set your workload </span>
            </a>
          </Popover.Target>
          <Popover.Dropdown>
            <Text>
              {" "}
              Current Workload: {userWorkload.currentLoad} / {userWorkload.maxLoad}{" "}
            </Text>
            <Tooltip label={Math.ceil((userWorkload.currentLoad / userWorkload.maxLoad) * 100) + "%"}>
              <Progress.Root m="5px" size="lg">
                <Progress.Section
                  color={barColor(userWorkload.maxLoad, userWorkload.currentLoad)}
                  value={(userWorkload.currentLoad / userWorkload.maxLoad) * 100}
                ></Progress.Section>
              </Progress.Root>
            </Tooltip>
            <br />
            <NumberInput
              label="Set Workload"
              placeholder="Enter PR workload"
              size="sm"
              value={prWorkload}
              onChange={setPrWorkload}
            />
            <br />
            <Center>
              <Button size="sm" onClick={editWorkload}>
                {" "}
                Update{" "}
              </Button>
            </Center>
          </Popover.Dropdown>
        </Popover>
      </div>
    </nav>
  );
}
