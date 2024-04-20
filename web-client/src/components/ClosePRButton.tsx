import { IconGitMerge, IconCircleCheck } from "@tabler/icons-react";
import { rem, Button, Modal, Center } from "@mantine/core";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { BASE_URL } from "../env";

//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/merge")]

export interface ClosePRButtonProps {
  isClosed: boolean;
}
function ClosePRButton(props: ClosePRButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { owner, repoName, prnumber } = useParams();
  const icon = <IconGitMerge style={{ width: rem(30), height: rem(30), marginTop: 0, marginLeft: 5 }} />;
  const closeModal = () => {
    window.location.href = "/";
    close();
  };
  const handleButtonClick = async () => {
    try {
      await axios.patch(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/open`, {
        withCredentials: true,
      });
      open();
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  const handleClosePR = async ()=>{
    try {
      //[HttpPatch("pullrequest/{owner}/{repoName}/{prnumber}/close")]
      await axios.patch(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/close`, {
        withCredentials: true,
      });
      open();
    } catch (error) {
      console.error("Error calling API:", error);
    }
  }

  return (
    <div>
      <Modal opened={opened} onClose={closeModal} title="Close PR Successful">
        <IconCircleCheck color="teal" style={{ width: rem(20), height: rem(20), marginRight: "10px" }} />
        Pull Request is successfully closed!
        <Center mt="md">
          <Button onClick={closeModal}>Done</Button>
        </Center>
      </Modal>
      {props.isClosed ? (
        <Button leftSection={icon} color="green" onClick={handleButtonClick}>
          Reopen Pull Request
        </Button>
      ) : (
        <Button leftSection={icon} onClick={handleClosePR}>
          Close PR
        </Button>
      )}
    </div>
  );
}

export default ClosePRButton;
