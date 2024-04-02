import { IconGitMerge, IconCircleCheck } from "@tabler/icons-react";
import { rem, Button, Modal, Center } from "@mantine/core";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

//[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/merge")]

export interface MergeButtonProps {
  canMerge: boolean;
}
function MergeButton(props: MergeButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { owner, repoName, prnumber } = useParams();
  const icon = <IconGitMerge style={{ width: rem(30), height: rem(30), marginTop: 0, marginLeft: 5 }} />;
  const closeModal = () => {
    window.location.href = "/";
    close();
  };
  const handleButtonClick = async () => {
    try {
      await axios.get(`http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/merge`, {
        withCredentials: true,
      });
      open();
      // Add your logic here for what to do after the API call succeeds
    } catch (error) {
      console.error("Error calling API:", error);
      // Add your logic here for handling errors
    }
  };

  return (
    <div>
      <Modal opened={opened} onClose={closeModal} title="Merge Successful">
        <IconCircleCheck color="teal" style={{ width: rem(20), height: rem(20), marginRight: "10px" }} />
        Pull Request is successfully merged!
        <Center mt="md">
          <Button onClick={closeModal}>Done</Button>
        </Center>
      </Modal>
      {props.canMerge ? (
        <Button leftSection={icon} color="green" onClick={handleButtonClick}>
          Merge Pull Request
        </Button>
      ) : (
        <Button leftSection={icon} disabled>
          Not able to merge
        </Button>
      )}
    </div>
  );
}

export default MergeButton;
