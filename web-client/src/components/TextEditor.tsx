import { useState } from 'react';
import RichTextEditor, { EditorValue } from 'react-rte';
import { Button, Box, Badge } from '@mantine/core';

import '../styles/text-editor.css';

function TextEditor()  {
  const id = 'comment_id';
  const [value, setValue] = useState<EditorValue>(
    RichTextEditor.createValueFromString(localStorage.getItem(id) || '', 'html')
  );

  const handleSuggestionClick = (suggestion: string) => {
    const updatedValue = `${value.toString('html')}\n${suggestion}`;
    setValue(RichTextEditor.createValueFromString(updatedValue, 'html'));
  };

  const handleChange = (newValue: EditorValue) => {
    setValue(newValue);
  };

  const commentSuggestions = [
    'Well done',
    'Looks good to me ',
    'It seems unclear, can you explain further?',
  ];

  return (
    <Box style={{ position: 'relative', width: '100%' }}>
      <RichTextEditor
        className="text-editor"
        toolbarClassName="text-editor__toolbar"
        editorClassName="text-editor__body"
        placeholder="Add comment"
        value={value}
        onChange={handleChange}
      />
      <Box top="100%" right={0} >
        {commentSuggestions.map((suggestion, index) => (
          <Badge
            key={index}
            style={{ cursor: 'pointer', marginTop: '10px', marginBottom: '5px', marginRight: '5px'}}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </Badge>
        ))}

      </Box>
      <Box style={{ position: 'absolute', right: 0, top: '100%' }}>
        <Button size="md" color="green" top={20}>
          Comment
        </Button>
      </Box>
    </Box>
  );
};

export default TextEditor;


