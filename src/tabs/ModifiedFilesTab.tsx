import React from 'react';

interface ModifiedFilesTabProps {
  // Define the props you want to pass to PrDetailPage
  id: string
  name: string;
  // Add more props as needed
}

const ModifiedFilesTab: React.FC<ModifiedFilesTabProps> = ({id, name}) => {
  const modifiedFiles = []
  return (
    <div> modified</div>
  );

}

export default ModifiedFilesTab;