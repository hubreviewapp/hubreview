import { TagsInput, rem, Flex, MultiSelect, Select } from "@mantine/core";
import {
  IconSearch,
  IconUser,
  IconTag,
  IconCalendarTime,
  IconChartArrows,
  IconSortDescending,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { FilterList } from "../../pages/ReviewQueuePage.tsx";

/**
 * This component should allow easy manipulation of filters in a keyboard-oriented flow.
 * Similar to filter inputs used on GitHub, and many other platforms.
 */

export interface FilterInputProps {
  filterList: FilterList;
  setFilterList: (filterList: FilterList) => void;
}
function FilterInput({ filterList, setFilterList }: FilterInputProps) {
  const [filterValues, setFilterValues] = useState(["review-requested:@me", "sort-by:priority:desc"]);

  const [assignees, setAssignees] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const API = "http://localhost:5018/api/github/";
    const apiEnd = "GetFilterLists";

    const fetchGetFilterLists = async () => {
      try {
        const res = await axios.get(API + apiEnd, { withCredentials: true });
        if (res.data != undefined) {
          console.log(res.data);
          setAuthors(res.data.authors);
          setAssignees(res.data.assignees);
          setLabels(res.data.labels);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchGetFilterLists().then();
  }, []);

  return (
    <>
      <Flex my="md">
        <Select
          radius="xl"
          placeholder="Author"
          leftSection={<IconUser width={rem(15)} />}
          data={authors}
          searchable
          onChange={(val) =>
            setFilterList({
              ...filterList,
              author: val,
            })
          }
        />

        <MultiSelect
          radius="xl"
          placeholder="Labels"
          data={labels}
          leftSection={<IconTag width={rem(15)} />}
          searchable
          clearable
          className="hide-pills"
          maxDropdownHeight={150}
        />

        <Select
          radius="xl"
          placeholder="Priority"
          leftSection={<IconChartArrows width={rem(15)} />}
          data={["Critical", "High", "Medium", "Low"]}
        />

        <Select
          radius="xl"
          placeholder="Assignee"
          leftSection={<IconUser width={rem(15)} />}
          data={assignees}
          onChange={(val) =>
            setFilterList({
              ...filterList,
              assignee: val,
            })
          }
        />

        <Select
          radius="xl"
          placeholder="Date"
          leftSection={<IconCalendarTime width={rem(15)} />}
          data={["Today", "This week", "This Month", "This year"]}
        />

        <Select
          radius="xl"
          placeholder="Sort"
          leftSection={<IconSortDescending width={rem(15)} />}
          data={["Newest", "Oldest", "Priority", "Recently updated"]}
        />
      </Flex>

      <TagsInput
        value={filterValues}
        onChange={setFilterValues}
        leftSection={<IconSearch width={rem(18)} />}
        description="Filter"
        placeholder="Tags"
        w="100%"
      />
    </>
  );
}

export default FilterInput;
