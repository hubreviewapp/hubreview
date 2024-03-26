import { useEffect, useState } from "react";
import { Group, Accordion, Box, rem, TextInput, Text, ScrollArea } from "@mantine/core";
import { IconBellRinging, IconNotebook, IconSearch } from "@tabler/icons-react";
import classes from "../../styles/NavbarSimple.module.css";
import { Repository } from "../../models/Repository.tsx";
import axios from "axios";
import { Checkbox } from "@mantine/core";
import { Link } from "react-scroll";
import { UseListStateHandlers } from "@mantine/hooks";
import { SelectedRepos } from "../../pages/ReviewQueuePage.tsx";

const data = [
  { link: "", label: "New PRs", icon: IconBellRinging },
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

export function PRNavbar({ setActiveSection, activeSection, selectedRepos, setSelectedRepos }: PRNavbarProps) {
  //const [repository, setRepository] = useState<Repository[]>([]);
  const iconSearch = <IconSearch style={{ width: rem(16), height: rem(16) }} />;
  const [query, setQuery] = useState("");

  useEffect(() => {
    const getRepos = async () => {
      const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      });

      const res = await axiosInstance.get("/getRepository");
      if (res) {
        //setRepository(res.data.repoNames);

        const updatedRepos = res.data.repoNames.map((value: Repository) => ({
          name: value.name.toString(),
          selected: false,
        }));

        setSelectedRepos.setState(updatedRepos);
      }
    };

    getRepos();
  }, []);

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
          <Text> Add new repositories</Text>
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
      {item.icon && <item.icon className={classes.linkIcon} stroke={1.5} />}
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

      {/*
      <div className={classes.footer}>
        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconActivity className={classes.linkIcon} stroke={1.5} />
          <span> Insights / Activity</span>
        </a>

        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconSettings className={classes.linkIcon} stroke={1.5} />
          <span> Settings </span>
        </a>
      </div>

      */}
    </nav>
  );
}
