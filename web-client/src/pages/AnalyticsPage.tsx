import {Box, Grid, Group, Container} from "@mantine/core";
import WorkloadBar from "../components/WorkloadBar";

function AnalyticsPage() {
  return (
        <Container>
          <Group>
            <WorkloadBar/>
            <WorkloadBar/>
          </Group>



        </Container>
  );
}

export default AnalyticsPage;
