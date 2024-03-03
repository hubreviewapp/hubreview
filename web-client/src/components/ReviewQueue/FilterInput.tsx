import { TagsInput, rem, Flex, MultiSelect, Select } from "@mantine/core";
import { IconSearch, IconUser, IconTag, IconCalendarTime, IconChartArrows, IconSortDescending } from "@tabler/icons-react";
import { useState } from "react";

/**
 * This component should allow easy manipulation of filters in a keyboard-oriented flow.
 * Similar to filter inputs used on GitHub, and many other platforms.
 */

export interface FilterInputProps {
  authors?: string[]
  labels?: string[]
  assignees?: string[]

}
function FilterInput() {
  const [filterValues, setFilterValues] = useState(["review-requested:@me", "sort-by:priority:desc"]);
  const [labels, setLabels] = useState(["bug", "enhancement", "question"]);

  return (
    <>
      <Flex  my="md">
        <Select
          radius="xl"
          placeholder="Author"
          leftSection={<IconUser width={rem(15)} />}
          data={['aysekelleci', 'irem_aydın', 'ecekahraman']}
        />

        <MultiSelect
          radius="xl"
          placeholder="Labels"
          data={labels}
          leftSection={<IconTag width={rem(15)} />}

          clearable
        />

        <Select
          radius="xl"
          placeholder="Priority"
          leftSection={<IconChartArrows width={rem(15)} />}
          data={['Critical', 'High', 'Medium', 'Low']}
        />

        <Select
          radius="xl"
          placeholder="Assignee"
          leftSection={<IconUser width={rem(15)} />}
          data={['aysekelleci', 'irem_aydın', 'ecekahraman']}
        />

        <Select
          radius="xl"
          placeholder="Date"
          leftSection={<IconCalendarTime width={rem(15)} />}
          data={['Today', 'This week', 'This Month', 'This year']}
        />

        <Select
          radius="xl"
          placeholder="Sort"
          leftSection={<IconSortDescending width={rem(15)} />}
          data={['Newest', 'Oldest', 'Priority', 'Recently updated']}
        />

      </Flex>

      <TagsInput
        value={labels}
        onChange={setLabels}
        leftSection={<IconSearch width={rem(18)} />}
        description="Filter"
        placeholder="Tags"
        w="100%"
      />


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
