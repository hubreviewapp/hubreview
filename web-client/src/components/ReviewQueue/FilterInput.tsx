import { useEffect, useState } from "react";
import { rem, Flex, MultiSelect, Select, Avatar, SelectProps, Group, TextInput } from "@mantine/core";
import {
  IconUser,
  IconTag,
  IconCalendarTime,
  IconChartArrows,
  IconSortDescending,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import axios from "axios";
import { FilterList } from "../../pages/ReviewQueuePage.tsx";
import { BASE_URL } from "../../env.ts";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
/**
 * This component should allow easy manipulation of filters in a keyboard-oriented flow.
 * Similar to filter inputs used on GitHub, and many other platforms.
 */

export interface AuthorProps {
  login: string;
  avatarUrl: string;
}

export interface AssigneeProps {
  login: string;
  avatarUrl: string;
}

export interface FilterInputProps {
  filterList: FilterList;
  setFilterList: (filterList: FilterList) => void;
}
function FilterInput({ filterList, setFilterList }: FilterInputProps) {
  //const [filterValues, setFilterValues] = useState(["review-requested:@me", "sort-by:priority:desc"]);
  const [assignees, setAssignees] = useState<AssigneeProps[]>([]);
  const [authors, setAuthors] = useState<AuthorProps[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [debounced] = useDebouncedValue(value, 200);

  useEffect(() => {
    const fetchGetFilterLists = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/GetFilterLists`, { withCredentials: true });
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

  const iconProps = {
    stroke: 1.5,
    color: "currentColor",
    opacity: 0.6,
    size: 18,
  };

  useEffect(() => {
    setFilterList({
      ...filterList,
      name: debounced.toString(),
    });
  }, [debounced]); // eslint-disable-line

  const renderSelectOptionAuthor: SelectProps["renderOption"] = ({ option, checked }) => {
    const author = authors.find((author) => author.login === option.value);
    if (!author) return null;
    return (
      <Group flex="1" gap="xs" wrap="nowrap">
        <Avatar src={author.avatarUrl} size="sm" />
        {option.label}
        {checked && <IconCheck style={{ marginInlineStart: "auto" }} {...iconProps} />}
      </Group>
    );
  };

  const renderSelectOptionAssignee: SelectProps["renderOption"] = ({ option, checked }) => {
    const assignee = assignees.find((assignee) => assignee.login === option.value);
    if (!assignee) return null;
    return (
      <Group flex="1" gap="xs" wrap="nowrap">
        <Avatar src={assignee.avatarUrl} size="sm" />
        {option.label}
        {checked && <IconCheck style={{ marginInlineStart: "auto" }} {...iconProps} />}
      </Group>
    );
  };

  return (
    <>
      <Flex my="md">
        <Select
          clearable
          radius="xl"
          placeholder="Author"
          checkIconPosition="right"
          leftSection={<IconUser width={rem(15)} />}
          data={authors.map((author) => ({
            value: author.login,
            label: author.login,
          }))}
          styles={{ dropdown: { width: 300, maxHeight: "200" } }}
          searchable
          onChange={(val) =>
            setFilterList({
              ...filterList,
              author: val,
            })
          }
          renderOption={renderSelectOptionAuthor}
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
          onChange={(val) => {
            setFilterList({
              ...filterList,
              labels: val,
            });
          }}
        />

        <Select
          clearable
          radius="xl"
          placeholder="Priority"
          leftSection={<IconChartArrows width={rem(15)} />}
          data={["Critical", "High", "Medium", "Low", "Not specified"]}
          onChange={(val) => {
            let priorityValue;
            switch (val) {
              case "Critical":
                priorityValue = "4";
                break;
              case "High":
                priorityValue = "3";
                break;
              case "Medium":
                priorityValue = "2";
                break;
              case "Low":
                priorityValue = "1";
                break;
              case "Not specified":
                priorityValue = "0";
                break;
              default:
                priorityValue = null;
            }
            setFilterList({
              ...filterList,
              priority: priorityValue,
            });
          }}
        />

        <Select
          clearable
          radius="xl"
          placeholder="Assignee"
          checkIconPosition="right"
          leftSection={<IconUser width={rem(15)} />}
          data={assignees.map((assignee) => ({
            value: assignee.login,
            label: assignee.login,
          }))}
          onChange={(val) =>
            setFilterList({
              ...filterList,
              assignee: val,
            })
          }
          renderOption={renderSelectOptionAssignee}
        />
        {/*
        <Select
          radius="xl"
          placeholder="Date"
          leftSection={<IconCalendarTime width={rem(15)} />}
          data={["Today", "This week", "This Month", "This year", "Specific Date"]}
          onChange={(val) =>
            setFilterList({
              ...filterList,
              fromDate: val?.toLowerCase().replace(/\s/g, ""),
            })
          }
        />  */}

        <DatePickerInput
          clearable
          w={200}
          radius="xl"
          placeholder="Date"
          leftSection={<IconCalendarTime width={rem(15)} />}
          maxDate={new Date()}
          onChange={(val) => {
            const dateObject = new Date(val ? val : "");
            dateObject.setDate(dateObject.getDate() + 1);
            setFilterList({
              ...filterList,
              fromDate: val ? dateObject.toISOString().split("T")[0] : null,
            });
          }}
        />

        <Select
          clearable
          radius="xl"
          placeholder="Sort"
          leftSection={<IconSortDescending width={rem(15)} />}
          data={["Newest", "Oldest", "Priority", "Recently updated"]}
          onChange={(val) =>
            setFilterList({
              ...filterList,
              orderBy: val?.toLowerCase().replace(/\s/g, ""),
            })
          }
        />
      </Flex>

      <TextInput
        leftSection={<IconSearch width={rem(18)} />}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        placeholder="Search..."
      />
    </>
  );
}

export default FilterInput;
