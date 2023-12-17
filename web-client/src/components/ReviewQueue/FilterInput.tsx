import { TagsInput, rem } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";

/**
 * This component should allow easy manipulation of filters in a keyboard-oriented flow.
 * Similar to filter inputs used on GitHub, and many other platforms.
 */
function FilterInput() {
  const [filterValues, setFilterValues] = useState(["review-requested:@me", "sort-by:priority:desc"]);

  return (
    <TagsInput
      value={filterValues}
      onChange={setFilterValues}
      leftSection={<IconSearch width={rem(18)} />}
      description="Filter"
      placeholder="Tags"
      w="100%"
    />
  );
}

export default FilterInput;
