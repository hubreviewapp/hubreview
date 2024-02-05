import {Group, Container} from "@mantine/core";
import ReviewBuddyBox from "../components/ReviewBuddyBox";
import ApprovalRejectionRates from "../components/ApprovalRejectionRates";
import WorkloadAnalytics from "../components/WorkloadAnalytics";
import ApprovalRejectionRatesForReviewer from "../components/ApprovalRejectionRatesForReviewer.tsx";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function AnalyticsPage() {
  const navigate = useNavigate();

  useEffect(() => {    
  if ( localStorage.getItem("userLogin") === null ){
    navigate("/signIn");
  }
  }, [navigate]);

  return (
    <Container size="responsive" >
      <Group style={{justifyContent:"center"}}>
        <WorkloadAnalytics />
        <ReviewBuddyBox />
        <ApprovalRejectionRates />
        <ApprovalRejectionRatesForReviewer />
      </Group>

    </Container>
  );
}

export default AnalyticsPage;
