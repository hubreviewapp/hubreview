import { Group, Container } from "@mantine/core";
import ReviewBuddyBox from "../components/ReviewBuddyBox";
import ApprovalRejectionRates from "../components/ApprovalRejectionRates";
import WorkloadAnalytics from "../components/WorkloadAnalytics";

function AnalyticsPage() {
  return (
    <Container>
      <Group>
        <WorkloadAnalytics />
        <ReviewBuddyBox />
        <ApprovalRejectionRates />
      </Group>
    </Container>
  );
}

export default AnalyticsPage;
