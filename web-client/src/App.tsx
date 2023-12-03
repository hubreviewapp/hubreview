import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AnalyticsPage from "./pages/AnalyticsPage";
import PRListPage from "./pages/PRListPage";
import PRCreationPage from "./pages/PRCreationPage";
import NavBar from "./components/NavBar";
import PRDetailsPage from "./pages/PRDetailsPage";


function App() {

  return (
    <div className="App">
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<PRListPage/> } />
          <Route path="/pulls/create" element={<PRCreationPage/> } />
          <Route path="/pulls/:pullid" element={<PRDetailsPage id={"1"} name={"pull request"}/> } />

          <Route path="/analytics" element={<AnalyticsPage />} /> {/* Use the Contact component here */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
