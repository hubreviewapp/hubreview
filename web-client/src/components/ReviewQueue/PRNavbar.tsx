import {useEffect, useState} from 'react';
import { Group, Text, Accordion, Box} from '@mantine/core';
import {
  IconBellRinging,
  IconNotebook,
} from '@tabler/icons-react';
import classes from '../../styles/NavbarSimple.module.css';
import { Repository } from "../../models/Repository.tsx";
import axios from "axios";
import { Checkbox } from "@mantine/core";
import { Link } from 'react-scroll';

const data = [
  { link: '', label: 'New PRs', icon: IconBellRinging },
  { link: '', label: 'Needs your review' },
  { link: '', label: 'Your PRs' },
  { link: '', label: 'Waiting for author' },
  { link: '', label: 'All open PRs' },
  { link: '', label: 'Merged' },
  { link: '', label: 'Closed' },
];

interface PRNavbarProps {
  setActiveSection: (section: string) => void;
  activeSection: string;
}

export function PRNavbar({ setActiveSection, activeSection }: PRNavbarProps) {
  const [repository, setRepository] = useState<Repository[]>([]);

  useEffect(() => {
    const getRepos = async () => {
      const axiosInstance = axios.create({
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github"
      });

      const res = await axiosInstance.get("/getRepository");
      if (res) {
        setRepository(res.data.repoNames);
      }
    };

    getRepos();
  }, []);

  const reposCount = repository.length; // Count of repositories

  const repos = (
    <Accordion.Item key="repos" value="repos">
      <Accordion.Control > <IconNotebook />{`Selected Repos (${reposCount})`}</Accordion.Control>
      <Accordion.Panel>
        <Box>
          {repository.map((repo, index) => (
            <Box>
              <Text style={{ display: "flex" }} key={index} > <Checkbox variant="outline" /> {" "} {repo.name.toString()}</Text>
              <br />
            </Box>
          ))}
        </Box>
      </Accordion.Panel>
    </Accordion.Item>
  );

  const links = data.map((item) => (
    <Link
      className={classes.link}
      data-active={item.label === activeSection || undefined}
      href={item.link}
      activeClass="active"
      to={item.label.replace(/\s+/g, '-').toLowerCase()}
      spy={true}
      smooth={true}
      duration={500}
      key={item.label}
      onClick={() => setActiveSection(item.label)}
    >
      {item.icon && (
        <item.icon className={classes.linkIcon} stroke={1.5} />)}
      <span>{item.label}</span>
    </Link>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} >
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

