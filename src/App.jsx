import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import LabourDashboard from './components/LabourDashboard';
import DeputyImport from './components/DeputyImport';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/labour" element={<LabourDashboard />} />
        <Route path="/labour/import" element={<DeputyImport />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
