import { Progress } from "@mantine/core";
import BarColor from "../../utility/WorkloadBarColor.ts";
import { Contributor } from "../PRDetailSideBar.tsx";

function RepoAnalytics() {
  const data: Contributor[] = [
    {
      id: "1",
      login: "user1",
      avatarUrl: "https://example.com/avatar1.jpg",
      currentLoad: 5,
      maxLoad: 10,
    },
    {
      id: "2",
      login: "user2",
      avatarUrl: "https://example.com/avatar2.jpg",
      currentLoad: 8,
      maxLoad: 15,
    },
    {
      id: "3",
      login: "user3",
      avatarUrl: "https://example.com/avatar3.jpg",
      currentLoad: 3,
      maxLoad: 12,
    },
  ];

  return (
    <div>
      {data.map((itm) => (
        <Progress.Root mt="5px" size="lg" key={itm.id}>
          <Progress.Section
            color={BarColor(itm.maxLoad, itm.currentLoad)}
            value={(itm.currentLoad / itm.maxLoad) * 100}
          >
            <Progress.Label>{(itm.currentLoad / itm.maxLoad) * 100}%</Progress.Label>
          </Progress.Section>
        </Progress.Root>
      ))}
    </div>
  );
}

export default RepoAnalytics;
