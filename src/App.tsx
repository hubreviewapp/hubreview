import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Analytics from "./pages/analytics";
import List_PR from "./pages/List_PR";
import Navbar from "./components/navbar";


function App() {

  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<List_PR/> } />
          <Route path="/contact" element={<List_PR/> } />

          <Route path="/analytics" element={<Analytics />} /> {/* Use the Contact component here */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
