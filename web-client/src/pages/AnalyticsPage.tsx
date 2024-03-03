import { Group, Container } from "@mantine/core";
import ReviewBuddyBox from "../components/ReviewBuddyBox";
import ApprovalRejectionRates from "../components/ApprovalRejectionRates";
import WorkloadAnalytics from "../components/WorkloadAnalytics";
import ApprovalRejectionRatesForReviewer from "../components/ApprovalRejectionRatesForReviewer.tsx";

function AnalyticsPage() {

  return (
    <Container size="responsive">
      <Group style={{ justifyContent: "center" }}>
        <WorkloadAnalytics />
        <ReviewBuddyBox />
        <ApprovalRejectionRates />
        <ApprovalRejectionRatesForReviewer />
      </Group>
    </Container>
  );
}

export default AnalyticsPage;
