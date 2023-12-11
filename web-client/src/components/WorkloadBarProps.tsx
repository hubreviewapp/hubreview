import {Progress, Box} from "@mantine/core";

interface WorkloadBarProps {
  workload: number;
}
function WorkloadBarProps({ workload }: WorkloadBarProps){
  const color : string = workload > 80 ? "red" :
    workload > 60 ? "orange" : workload > 40 ?"yellow" :
      "green";
  return(
    <Box w={"130px"} m={0}>
      <Progress m={"5px"} size={"lg"} color={color} value={workload}/>
    </Box>
  );
}

export default WorkloadBarProps;
