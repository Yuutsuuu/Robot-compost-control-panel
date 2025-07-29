// src/App.tsx
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css'; // Keep your main App.css for global styles

// Import your tab components
import MeasureTab from './components/MeasureTab';
import AngraphTab from './components/AngraphTab'; // New import
import SensorReadingsTab from './components/SensorReadingsTab';
import ConditionsTab from './components/ConditionsTab';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          {/* You can replace this with one of your new title recommendations! */}
          <h1>BioBin</h1>
          <nav className="main-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Main
            </NavLink>

            <NavLink to="/angraph" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Graph
            </NavLink>
            
            <NavLink to="/sensor-readings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Sensor Readings
            </NavLink>

            <NavLink to="/conditions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Conditions
            </NavLink>
          </nav>
        </header>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<MeasureTab />} />
            <Route path="/angraph" element={<AngraphTab />} />
            <Route path="/sensor-readings" element={<SensorReadingsTab />} />
            <Route path="/conditions" element={<ConditionsTab />} />
            {/* You can add a 404/NotFound route if desired */}
            {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;