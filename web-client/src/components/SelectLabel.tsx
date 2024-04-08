import { useState } from "react";
import { PillsInput, Pill, Combobox, CheckIcon, Group, useCombobox, Badge } from "@mantine/core";
import LabelButton, { HubReviewLabelType } from "./LabelButton";
import axios from "axios";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../env";

const hubReviewLabels = [
  { name: "bug", color: "d73a4a", key: "bug" },
  { name: "enhancement", color: "a2eeef", key: "enhancement" },
  { name: "refactoring", color: "6f42c1", key: "refactoring" },
  { name: "question", color: "0075ca", key: "question" },
  { name: "suggestion", color: "28a745", key: "suggestion" },
];
export type HubReviewLabel = (typeof hubReviewLabels)[0];

export interface SelectLabelProps {
  githubAddedLabels: HubReviewLabel[];
}

function SelectLabel({ githubAddedLabels }: SelectLabelProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const [search, setSearch] = useState("");
  const [value, setValue] = useState<HubReviewLabel[]>(githubAddedLabels.filter((l) => !l.name.includes("Priority")));
  const { owner, repoName, prnumber } = useParams();

  function handleValueSelect(val: string) {
    setValue((current) =>
      current.find((v) => v.name === val) !== undefined
        ? current.filter((v) => v.name !== val)
        : [...current, { name: val, key: val, color: "ffffff" }],
    );

    axios
      .post(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addLabel`, [val], {
        withCredentials: true,
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  function handleValueRemove(val: string) {
    setValue((current) => current.filter((v) => v.name !== val));
    // [HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/{labelName}")]

    axios
      .delete(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/${val}`, {
        withCredentials: true,
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  const values = value.map((item) => (
    <Pill key={item.key} withRemoveButton onRemove={() => handleValueRemove(item.name)}>
      {item.name}
    </Pill>
  ));

  const options = hubReviewLabels
    .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
    .map((item) => (
      <Combobox.Option value={item.name} key={item.name} active={value.find((v) => v.name === item.name) !== undefined}>
        <Group gap="sm">
          {value.find((v) => v.name === item.name) !== undefined ? <CheckIcon size={12} /> : null}
          <span>{item.name}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <div>
      <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
        <Combobox.DropdownTarget>
          <PillsInput onClick={() => combobox.openDropdown()}>
            <Pill.Group>
              {values}

              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={search}
                  placeholder="Search labels"
                  onChange={(event) => {
                    combobox.updateSelectedOptionIndex();
                    setSearch(event.currentTarget.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && search.length === 0) {
                      event.preventDefault();
                      handleValueRemove(value[value.length - 1].name);
                    }
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown>
          <Combobox.Options>
            {options.length > 0 ? options : <Combobox.Empty>Nothing found...</Combobox.Empty>}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      <Group mt="md">
        {value.length == 0 ? (
          <Badge variant="light">No Label Added</Badge>
        ) : (
          value.map((itm) => <LabelButton key={itm.key} label={itm.name as HubReviewLabelType} size="md" />)
        )}
      </Group>
    </div>
  );
}

export default SelectLabel;
