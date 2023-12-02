import React from 'react';
import LabelButton from "../components/LabelButton";
import { Route } from 'react-router-dom';

interface PrDetailPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
  // Add more props as needed
}

const PrDetailPage: React.FC<PrDetailPageProps> = (props) => {
  // Access the props in the PrDetailPage component
  const { id, name } = props;

  return (
    <div>
      <div style={{ marginLeft: 'auto', marginRight: 16, textAlign: 'left' }}>

        <h2>PR Detail Page</h2>

        <div style={{ display: 'flex',paddingRight: '16px' }}>
          <div style={{ textAlign: 'right', marginRight: '8px'}}>
          <h2 style={{ fontSize: '1.2em'}}> {name} #{id} at project x</h2>
          </div>
          <div>
            <p style={{marginLeft: "10px", marginTop:'18px'}}> created at 4 days ago </p>
          </div>

          {/* Render additional details using props */}
        </div>
        {/* Render additional details using props */}

        <div style={{display: "flex", justifyContent: "flex-start"}}>

        <p> 1 issue linked to this pr  ---  </p>

        <LabelButton label={"enhancement"}></LabelButton>

        <LabelButton label={"bug fix"}></LabelButton>

        </div>
      </div>
    </div>

  );
};

export default PrDetailPage;


