import UserLogo from "../assets/icons/user.png";
import GitHubLogo from "../assets/icons/github-mark-white.png";
import {Text, Box, Flex, Paper, Group, Button} from '@mantine/core';
import classes from "../styles/PRList.module.css";
import LabelButton from "./LabelButton";
import {Link} from "react-router-dom";
import PriorityBadge from "./PriorityBadge";

interface FileGroupingProps {
  name: string;
  id:number;
  files: string[];
  reviewers: string [];
}

function FileGrouping({files, reviewers}: FileGroupingProps) {

  return(
    <Paper w={"300px"} h={"200px"} withBorder>
      <Group>
        <Text>Files</Text>
        {
          files.map(itm=>(
            <Text key={1}>{itm}</Text>
          ))
        }
      </Group>
      <Group>
        <Button color={"red"}>Delete</Button>
        <Button>Edit</Button>
      </Group>
  </Paper>)}


export default FileGrouping;

