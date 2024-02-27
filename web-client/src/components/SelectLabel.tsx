import { useEffect, useState } from "react";
import { PillsInput, Pill, Combobox, CheckIcon, Group, useCombobox, Badge } from "@mantine/core";
import LabelButton from "./LabelButton";
import axios from "axios";
import { useParams } from "react-router-dom";

export interface SelectLabelProps {
  githubAddedLabels: object[];
}

const hubReviewLabels = [
  { name: "bug", color: "d73a4a", key: "bug" },
  { name: "enhancement", color: "a2eeef", key: "enhancement" },
  { name: "refactoring", color: "6f42c1", key: "refactoring" },
  { name: "question", color: "0075ca", key: "question" },
  { name: "suggestion", color: "28a745", key: "suggestion" },
];

function SelectLabel({ githubAddedLabels }: SelectLabelProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const [search, setSearch] = useState("");
  const [value, setValue] = useState<string[]>([]);
  const { owner, repoName, prnumber } = useParams();

  useEffect(() => {
    if (githubAddedLabels.length != 0) {
      let temp = githubAddedLabels.map((itm) => itm.name);
      temp = temp.filter(itm => !itm.includes("Priority"));

      setValue(temp);
    }
  }, [githubAddedLabels]);

  function handleValueSelect(val: string) {
    setValue((current) => (current.includes(val) ? current.filter((v) => v !== val) : [...current, val]));

    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/addLabel`;
    axios
      .post(apiUrl, [val], {
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }

  function handleValueRemove(val: string) {
    setValue((current) => current.filter((v) => v !== val));
    // [HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/{labelName}")]

    const apiUrl = `http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}/${val}`;
    axios
      .delete(apiUrl, {
        withCredentials: true,
        baseURL: "http://localhost:5018/api/github",
      })
      .then(function () {})
      .catch(function (error) {
        console.log(error);
      });
  }
  const values = value.map((item) => (
    <Pill key={item} withRemoveButton onRemove={() => handleValueRemove(item)}>
      {item}
    </Pill>
  ));

  const options = hubReviewLabels
    .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
    .map((item) => (
      <Combobox.Option value={item.name} key={item.name} active={value.includes(item.name)}>
        <Group gap="sm">
          {value.includes(item.name) ? <CheckIcon size={12} /> : null}
          <span>{item.name}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <div>
      <Combobox store={combobox} onOptionSubmit={handleValueSelect} label="Add Label">
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
                      handleValueRemove(value[value.length - 1]);
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
          value.map((itm) => <LabelButton key={itm} label={itm} size="md" />)
        )}
      </Group>
    </div>
  );
}

export default SelectLabel;
