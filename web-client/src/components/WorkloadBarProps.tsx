import {Progress, Box} from "@mantine/core";

interface workloadBarProps {
  workload: number;
}
function WorkloadBarProps({ workload }: workloadBarProps){
  const color : string = workload > 70 ? "red" :
    workload > 50 ? "yellow" :
      "green";
  return(
    <Box w={"130px"} m={0}>
      <Progress m={"5px"} size={"lg"} color={color} value={workload}/>
    </Box>
  );
}

export default WorkloadBarProps;
