import {Box, NativeSelect, rem, Text,Space, Group} from "@mantine/core";
import classes from "./CreatePR.module.scss";
import {IconGitBranch,IconCheck, IconX,IconArrowNarrowLeft} from "@tabler/icons-react";
import {useState} from "react";

function CompareBranchBox (){
  const isAbleToMerge = true;
  const branchList:string[] =
    ["main","irem/create_pr_page",  'feature/login',
      'bugfix/issue-123', 'feature/profile', 'hotfix/urgent-fix',];
  const [baseBranch, setBaseBranch] = useState('');
  const [compareBranch, setCompareBranch] = useState('');
  return(
    <Box className={classes.branchBox}>
      <IconGitBranch style={{width: rem(18), height: rem(18)}}/>
      <Space w="md"/>
      base:
      <NativeSelect
        size="xs"
        value={baseBranch}
        onChange={(event) => setBaseBranch(event.currentTarget.value)}
        data={branchList}
        mx="xs"/>
      <IconArrowNarrowLeft color="gray" style={{margin:"10px",width: rem(18), height: rem(18)}} />
      compare:
      <NativeSelect
        size="xs"
        value={compareBranch}
        onChange={(event) => setCompareBranch(event.currentTarget.value)}
        data={branchList}
        mx="xs"/>
      <Space w="md" />
      {
        isAbleToMerge ?
          <Group>
            <IconCheck color="green" style={{width: rem(18), height: rem(18)}}/>
            <Text color="green">Able to merge</Text>
            <Text className={classes.dimmed}>These branches can be automatically merged.</Text>
          </Group> :
          <Group w="290px">
            <IconX color="red" style={{width: rem(18), height: rem(18)}}/>
            <Text color="red">Can&apos;t automatically merge.</Text>
          </Group>
      }
    </Box>
  )

}
export default CompareBranchBox;
