import { Box } from "@mantine/core";
import { IconMessageCircle2 } from "@tabler/icons-react";

function ModifiedFilesTab() {
  const modifiedFiles = ["pointer.py", "gradient.py", "test.py"];
  return (
    <Box style={{ border: "2px groove gray", width: 800, borderRadius: 30 }}>
      {modifiedFiles.map((file, index) => (
        <Box
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: index === modifiedFiles.length - 1 ? "none" : "2px groove gray",
          }}
        >
          <h3 key={file}>
            {" "}
            &ensp;{index + 1} &ensp;{file}{" "}
          </h3>

          <h5>
            {" "}
            last modified 3 days ago by
            <span style={{ color: "#415A77" }}>&ensp; Ayse Kelleci</span>{" "}
          </h5>

          <h3 style={{ textAlign: "right", marginRight: 15 }} key={file}>
            <span style={{ color: "green" }}>+19</span>&ensp;
            <span style={{ color: "red" }}>-23</span>&ensp;&ensp;
            <span>
              {" "}
              <IconMessageCircle2 size={18} strokeWidth={3} /> 7{" "}
            </span>
          </h3>
        </Box>
      ))}
    </Box>
  );
}

export default ModifiedFilesTab;
