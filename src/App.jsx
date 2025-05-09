import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import AddTechStackForm from './components/AddTechStackForm/AddTechStackForm';

function App() {
  const [showAddForm, setShowAddForm] = useState(false);

  // Handle adding a new tech stack
  const handleTechStackAdded = (newTechStack) => {
    // Reset form visibility
    setShowAddForm(false);
  };

  return (
    <Router>
      <div className="app">
        <Navbar />
        
        <main className="main-content">
          <Container fluid="lg" className="py-4">
            <Routes>
              {/* Tech Stacks route - shows all tech stacks */}
              <Route path="/" element={<Dashboard view="all-roadmaps" />} />
              
              {/* New techstack route - shows the add form */}
              <Route path="/newtechstack" element={<AddTechStackForm onTechStackAdded={handleTechStackAdded} />} />
              
              {/* Redirect any unknown paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </main>
      </div>
    </Router>
  );
}

export default App;
