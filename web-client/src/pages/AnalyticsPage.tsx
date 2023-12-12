import { Group, Container} from "@mantine/core";
import WorkloadBar from "../components/WorkloadBar";
import ReviewBuddyBox from "../components/ReviewBuddyBox";
import ApprovalRejectionRates from "../components/ApprovalRejectionRates";

function AnalyticsPage() {
  return (
        <Container>
          <Group>
            <WorkloadBar/>
            <ReviewBuddyBox/>
            <ApprovalRejectionRates/>
          </Group>
        </Container>
  );
}

export default AnalyticsPage;
