import {
  Box,
  Button,
  Divider,
  Group,
  Flex,
  Radio,
  Stack,
  Text,
  Title,
  Collapse,
  Textarea,
  Paper,
  Avatar,
  Badge,
} from "@mantine/core";
import FileDiffView from "../components/ReviewsTab/FileDiffView";
import { useRef, useState } from "react";
import UserLogo from "../assets/icons/user.png";
import { DiffLine, DiffLineType, DiffMarker, FileDiff } from "../utility/diff-types";

const mockFileRawDiff1 = `
@@ -12,9 +12,10 @@
     <link rel="preconnect" href="https://fonts.googleapis.com" />
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
     <link
-  rel="stylesheet"
-  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
-/>
+      rel="stylesheet"
+      href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
+    />
+    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css" />
   </head>
   <body>
     <div id="root"></div>
`;

const mockFileRawDiff2 = `
@@ -26,6 +26,7 @@
     "@tanstack/react-query-devtools": "^5.12.2",
     "axios": "^1.6.2",
     "dayjs": "^1.11.10",
+    "highlight.js": "^11.9.0",
     "react": "^18.2.0",
     "react-dom": "^18.2.0",
     "react-router-dom": "^6.20.1",
@@ -46,6 +47,7 @@
     "postcss-preset-mantine": "^1.11.0",
     "postcss-simple-vars": "^7.0.1",
     "prettier": "^3.1.0",
+    "react-rte": "^0.16.5",
     "rimraf": "^5.0.5",
     "sass": "^1.69.5",
     "typescript": "^5.2.2",
`;

const mockFileRawDiff3 =
  `
@@ -1,7 +1,8 @@
 import Comment from "../components/Comment.tsx";
 import TextEditor from "../components/TextEditor.tsx";
-import {Container, Box, Accordion, Text} from "@mantine/core";
 import SplitButton from "../components/SplitButton.tsx";
+import { Container, Box, Text, Grid, Accordion } from "@mantine/core";
+import PRDetailSideBar from "../components/PRDetailSideBar.tsx";
` +
  " " +
  `
 const comments = [
   {
@@ -45,12 +46,12 @@ function CommentsTab() {
   const unresolvedComments = comments.filter(comment => !comment.isResolved);
` +
  " " +
  `
   const comments2 = resolvedComments.map((comment, index) => (
-    <Accordion.Item value={index+''} key={index}>
+    <Accordion.Item value={index + ''} key={index}>
       <Accordion.Control>
         <Comment
           key={index}
           id={index}
-          author= {comment.author}
+          author={comment.author}
           text={comment.text}
           date={comment.date}
           isResolved={comment.isResolved}
@@ -63,37 +64,44 @@ function CommentsTab() {
   ));
` +
  " " +
  `
   return (
-    <Container>
-      {unresolvedComments.map((comment, index) => (
-        <Box key={index} >
-          <Comment
-            key={index}
-            id={index}
-            author= {comment.author}
-            text={comment.text}
-            date={comment.date}
-            isResolved={comment.isResolved}
-            isAIGenerated={comment.isAIGenerated}
-          ></Comment>
-          <br></br>
-        </Box>
-      ))}
-      <Accordion chevronPosition="right" variant="separated" >
-        {comments2}
-      </Accordion>
+    <Grid>
+      <Grid.Col span={8}>
+        <Container>
+          {unresolvedComments.map((comment, index) => (
+            <Box key={index} >
+              <Comment
+                key={index}
+                id={index}
+                author={comment.author}
+                text={comment.text}
+                date={comment.date}
+                isResolved={comment.isResolved}
+                isAIGenerated={comment.isAIGenerated}
+              ></Comment>
+              <br></br>
+            </Box>
+          ))}
+          <Accordion chevronPosition="right" variant="separated" >
+            {comments2}
+          </Accordion>
` +
  " " +
  `
-      <br></br>
+          <br></br>
` +
  " " +
  `
+          <SplitButton></SplitButton>
+          <br></br>
` +
  " " +
  `
-      <SplitButton></SplitButton>
-      <br></br>
+          <Box style={{ border: "2px groove gray", borderRadius: 10, padding: "10px" }}>
+            <TextEditor></TextEditor>
+          </Box>
` +
  " " +
  `
-      <Box style={{ border: "2px groove gray", borderRadius: 10, padding:"10px" }}>
-        <TextEditor></TextEditor>
-      </Box>
+          <Box style={{ height: 100 }}></Box>
+        </Container>
+      </Grid.Col>
` +
  " " +
  `
-      <Box style={{height:100}}></Box>
-    </Container>
+      <Grid.Col span={3}>
+        <PRDetailSideBar />
+      </Grid.Col>
+    </Grid>
   );
 }
` +
  " " +
  `
`;

const parseDiffMarker = (markerLine: string): DiffMarker => {
  const match = /^@@ -(\d*),(\d*) \+(\d*),(\d*) @@(.*)$/.exec(markerLine);

  if (match === null) throw Error(`Failed to execute regexp on marker line content: ${markerLine}`);

  return {
    deletion: {
      startLine: parseInt(match[1]),
      lineCount: parseInt(match[2]),
    },
    addition: {
      startLine: parseInt(match[3]),
      lineCount: parseInt(match[4]),
    },
    contextContent: match[5],
  };
};

const parseRawDiff = (fileName: string, rawDiff: string): FileDiff => {
  const trimmedRawDiff = rawDiff.trim();
  const rawDiffLines = trimmedRawDiff.split("\n");

  const nextLineNumbers = {
    before: -1,
    after: -1,
  };
  const diffLines: DiffLine[] = rawDiffLines.map((l): DiffLine => {
    if (l[0] === "@") {
      const diffMarker = parseDiffMarker(l);
      nextLineNumbers.before = diffMarker.deletion.startLine;
      nextLineNumbers.after = diffMarker.addition.startLine;

      return {
        type: DiffLineType.Marker,
        content: l,
        lineNumber: {},
      };
    } else if (l[0] === "+") {
      return {
        type: DiffLineType.Addition,
        content: l.slice(1),
        lineNumber: {
          before: undefined,
          after: nextLineNumbers.after++,
        },
      };
    } else if (l[0] === "-") {
      return {
        type: DiffLineType.Deletion,
        content: l.slice(1),
        lineNumber: {
          before: nextLineNumbers.before++,
          after: undefined,
        },
      };
    } else if (l[0] === " ") {
      return {
        type: DiffLineType.Context,
        content: l.slice(1),
        lineNumber: {
          before: nextLineNumbers.before++,
          after: nextLineNumbers.after++,
        },
      };
    }
    throw Error("Unexpected line in diff");
  });

  return {
    fileName,
    diffstat: {
      additions: diffLines.reduce((acc, cur) => acc + (cur.type === DiffLineType.Addition ? 1 : 0), 0),
      deletions: diffLines.reduce((acc, cur) => acc + (cur.type === DiffLineType.Deletion ? 1 : 0), 0),
    },
    lines: diffLines,
  };
};

const mockFileDiffs: FileDiff[] = [
  parseRawDiff("web-client/index.html", mockFileRawDiff1),
  parseRawDiff("web-client/package.json", mockFileRawDiff2),
  parseRawDiff("web-client/src/tabs/CommentsTab.tsx", mockFileRawDiff3),
];

export type ReviewCommentDecoration = "non-blocking" | "blocking" | "if-minor";
export interface ReviewComment {
  key: {
    fileName: string;
    absoluteLineNumber: number;
  };
  label: string;
  decoration: ReviewCommentDecoration;
  content: string;
}

export type ReviewVerdict = "comment" | "approve" | "reject";
export interface ReviewMainComment {
  verdict: ReviewVerdict;
  content: string;
}

function ModifiedFilesTab() {
  const [hasStartedReview, setHasStartedReview] = useState(false);
  const [isSubmitReviewEditorOpen, setIsSubmitReviewEditorOpen] = useState(false);

  const reviewEditorRef = useRef<HTMLTextAreaElement>(null);
  const [editorContent, setEditorContent] = useState("");
  const [reviewVerdict, setReviewVerdict] = useState<ReviewVerdict>("comment");

  const [pendingComments, setPendingComments] = useState<ReviewComment[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [mainComments, setMainComments] = useState<ReviewMainComment[]>([]);

  const submitPendingComments = () => {
    setComments([...comments, ...pendingComments]);
    setPendingComments([]);

    setMainComments([...mainComments, { verdict: reviewVerdict, content: editorContent }]);
    setReviewVerdict("comment");
    setEditorContent("");
    if (reviewEditorRef.current)
      // For some reason, this is the only way to get the textarea to clear its displayed contents,
      // even though the state is definitely set to an empty string already.
      reviewEditorRef.current.value = "";

    setHasStartedReview(false);
    setIsSubmitReviewEditorOpen(false);
  };

  const onAddPendingComment = (comment: ReviewComment) => {
    setPendingComments([...pendingComments, comment]);
  };

  return (
    <Box w="90%">
      <Flex justify="flex-end" mb="sm">
        <Button mr="sm" onClick={() => setHasStartedReview(true)} disabled={hasStartedReview}>
          Start Review
        </Button>
        <Button disabled={!hasStartedReview} onClick={() => setIsSubmitReviewEditorOpen(!isSubmitReviewEditorOpen)}>
          Submit Review
        </Button>
      </Flex>

      <Collapse in={isSubmitReviewEditorOpen}>
        <Box mb="sm">
          <Textarea
            ref={reviewEditorRef}
            autosize
            minRows={3}
            content={editorContent}
            onChange={(e) => setEditorContent(e.currentTarget.value)}
          />

          <Title order={5}>Verdict</Title>
          <Radio.Group value={reviewVerdict} onChange={(val) => setReviewVerdict(val as ReviewVerdict)}>
            <Stack mt="sm">
              <Radio value="comment" label="Comment indifferently" styles={{ label: { color: "lightgray" } }} />
              <Radio
                value="approve"
                label="Approve"
                styles={{ label: { color: "lime" }, radio: { border: "1px solid lime" } }}
              />
              <Radio
                value="reject"
                label="Request changes"
                styles={{ label: { color: "crimson" }, radio: { border: "1px solid crimson" } }}
              />
            </Stack>
          </Radio.Group>

          <Divider my={10} />
          <Group justify="end" mt={5}>
            <Text fs="italic">Including {pendingComments.length} comments</Text>
            <Button size="sm" color="green" onClick={submitPendingComments}>
              Submit
            </Button>
          </Group>
        </Box>
      </Collapse>

      <Title order={4}>Review Verdicts</Title>
      {mainComments.map((c, i) => (
        <Paper key={i} withBorder radius="md" shadow="lg" my="sm" p="sm">
          <Group>
            <Avatar src={UserLogo} alt="Jacob Warnhalter" radius="xl" />
            <div>
              <Text fz="sm">AUTHOR</Text>
              <Text fz="xs" c="dimmed">
                {new Date(2023, 4, 7).toLocaleString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                })}
              </Text>
            </div>
            <Badge ml="auto" color={c.verdict === "approve" ? "lime" : c.verdict === "reject" ? "crimson" : "gray"}>
              {c.verdict === "approve" ? "Approved" : c.verdict === "reject" ? "Requested changes" : "Comment"}
            </Badge>
          </Group>

          <Text py="sm">{c.content}</Text>
        </Paper>
      ))}

      <Title order={4}>Modified Files</Title>
      {mockFileDiffs.map((f) => (
        <FileDiffView
          key={f.fileName}
          fileDiff={f}
          comments={comments.filter((c) => c.key.fileName === f.fileName)}
          pendingComments={pendingComments.filter((c) => c.key.fileName === f.fileName)}
          hasStartedReview={hasStartedReview}
          onAddPendingComment={onAddPendingComment}
        />
      ))}
    </Box>
  );
}

export default ModifiedFilesTab;
