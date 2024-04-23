import { IconCircleCheck, IconGitPullRequestClosed } from "@tabler/icons-react";
import { rem, Button, Modal, Center } from "@mantine/core";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { BASE_URL } from "../env";

//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/merge")]

export interface ClosePRButtonProps {
  isClosed: boolean;
}
function ClosePRButton({ isClosed }: ClosePRButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { owner, repoName, prnumber } = useParams();
  const icon = <IconGitPullRequestClosed style={{ width: rem(30), height: rem(30), marginTop: 0, marginLeft: 5 }} />;
  const closeModal = () => {
    window.location.reload();
    close();
  };

  const title = isClosed ? "PR Reopen is Successful" : "Close PR Successful";
  const handleButtonClick = async () => {
    try {
      const end = isClosed ? "open" : "close";
      await axios.get(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/${end}`, {
        withCredentials: true,
      });
      open();
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  return (
    <div>
      <Modal opened={opened} onClose={closeModal} title={title}>
        <IconCircleCheck color="teal" style={{ width: rem(20), height: rem(20), marginRight: "10px" }} />
        {isClosed ? "Pull Request is successfully reopened!" : "Pull Request is successfully closed!"}

        <Center mt="md">
          <Button onClick={closeModal}>Done</Button>
        </Center>
      </Modal>
      {isClosed ? (
        <Button variant="outline" leftSection={icon} mr="sm" color="green" onClick={handleButtonClick}>
          Reopen Pull Request
        </Button>
      ) : (
        <Button variant="outline" leftSection={icon} onClick={handleButtonClick}>
          Close Pull Request
        </Button>
      )}
    </div>
  );
}

export default ClosePRButton;
