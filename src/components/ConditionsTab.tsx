// src/components/ConditionsTab.tsx (Improved)

import React, { useState, useEffect } from 'react';
import './ConditionsTab.css';
import sensorData from '../data/sensorrReadingsGPL242510-1.json';

// Define a type for a sensor's condition settings
interface SensorCondition {
  robotId: string;
  sensorId: string;
  minTemp: number;
  maxTemp: number;
  minHum: number;
  maxHum: number;
  timeOpHours: number;
  timeOpMins: number;
  timeOpSecs: number;
  moveForHours: number;
  moveForMins: number;
  moveForSecs: number;
  humVariation: string;
  tempVariation: string;
  autoDuration: string;
}

// Mock initial data based on your JSON file
const mockConditions: SensorCondition[] = [
  { robotId: 'Rpi__1', sensorId: 'Sensor__1', minTemp: 15, maxTemp: 30, minHum: 40, maxHum: 80, timeOpHours: 1, timeOpMins: 0, timeOpSecs: 0, moveForHours: 0, moveForMins: 0, moveForSecs: 30, humVariation: '3', tempVariation: '5', autoDuration: '30s' },
  { robotId: 'Rpi__1', sensorId: 'Sensor__2', minTemp: 18, maxTemp: 35, minHum: 50, maxHum: 90, timeOpHours: 1, timeOpMins: 0, timeOpSecs: 0, moveForHours: 0, moveForMins: 0, moveForSecs: 30, humVariation: '3', tempVariation: '5', autoDuration: '30s' },
  { robotId: 'Rpi__1', sensorId: 'Sensor__3', minTemp: 17, maxTemp: 32, minHum: 45, maxHum: 85, timeOpHours: 1, timeOpMins: 0, timeOpSecs: 0, moveForHours: 0, moveForMins: 0, moveForSecs: 30, humVariation: '3', tempVariation: '5', autoDuration: '30s' },
  { robotId: 'Rpi__1', sensorId: 'Sensor__4', minTemp: 16, maxTemp: 31, minHum: 42, maxHum: 82, timeOpHours: 1, timeOpMins: 0, timeOpSecs: 0, moveForHours: 0, moveForMins: 0, moveForSecs: 30, humVariation: '3', tempVariation: '5', autoDuration: '30s' },
];

const ConditionsTab: React.FC = () => {
  // State for the list of all conditions
  const [allConditions, setAllConditions] = useState<SensorCondition[]>(mockConditions);

  // State for the selected sensor and its conditions
  const [selectedRobotId, setSelectedRobotId] = useState<string>('Rpi__1');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('Sensor__1');
  const [currentConditions, setCurrentConditions] = useState<SensorCondition | null>(null);

  // Use unique values from your data to populate the dropdowns
  const uniqueRobotIds = Array.from(new Set(sensorData.map(d => d.robotId)));
  const uniqueSensorIds = Array.from(new Set(sensorData.map(d => d.sensorId)));

  // Effect to update the form when the selected sensor changes
  useEffect(() => {
    const sensor = allConditions.find(c => c.robotId === selectedRobotId && c.sensorId === selectedSensorId);
    if (sensor) {
      setCurrentConditions(sensor);
    } else {
      // If a sensor doesn't have conditions set yet, initialize them
      setCurrentConditions({
        robotId: selectedRobotId,
        sensorId: selectedSensorId,
        minTemp: 0, maxTemp: 0, minHum: 0, maxHum: 0,
        timeOpHours: 0, timeOpMins: 0, timeOpSecs: 0,
        moveForHours: 0, moveForMins: 0, moveForSecs: 0,
        humVariation: '', tempVariation: '', autoDuration: ''
      });
    }
  }, [selectedRobotId, selectedSensorId, allConditions]);

  // Handler for form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentConditions(prev => {
      if (!prev) return null;
      // Convert number inputs to a number type
      const newValue = type === 'number' ? parseInt(value) || 0 : value;
      return { ...prev, [name]: newValue };
    });
  };

  // Handler for the "Set" button
  const handleSetConditions = () => {
    if (currentConditions) {
      // Update the main conditions state with the new values
      setAllConditions(prev =>
        prev.map(c =>
          c.robotId === currentConditions.robotId && c.sensorId === currentConditions.sensorId
            ? currentConditions
            : c
        )
      );
      alert(`Conditions for ${currentConditions.sensorId} on ${currentConditions.robotId} set! (Simulated)`);
      console.log('Sending updated conditions:', currentConditions);
      // In a real application, you would send this data to your backend API
      // e.g., axios.post('/api/set-conditions', currentConditions);
    }
  };
  
  const handleAutoToServer = () => {
    alert('All conditions sent to server for automation! (Simulated)');
    console.log('Sending all conditions to server for automation.');
  };

  if (!currentConditions) {
    return <div className="conditions-container">Loading...</div>;
  }

  return (
    <div className="conditions-container">
      <h2>Conditions</h2>
      
      {/* Top-level control for global actions */}
      <div className="top-controls">
        <button className="top-button">Mixer</button>
        <button className="top-button auto-server" onClick={handleAutoToServer}>Auto to Server</button>
      </div>

      {/* Sensor Selection Panel */}
      <div className="selection-panel card">
        <div className="control-group">
          <label htmlFor="robot-id-select">Robot ID:</label>
          <select id="robot-id-select" value={selectedRobotId} onChange={(e) => setSelectedRobotId(e.target.value)}>
            {uniqueRobotIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="sensor-id-select">Sensor ID:</label>
          <select id="sensor-id-select" value={selectedSensorId} onChange={(e) => setSelectedSensorId(e.target.value)}>
            {uniqueSensorIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
      </div>

      {/* Main Conditions Form */}
      <div className="conditions-form-card card">
        <h3>Conditions for {selectedSensorId} on {selectedRobotId}</h3>
        
        {/* Temperature & Humidity Thresholds */}
        <div className="form-section">
          <h4>Temperature & Humidity Thresholds</h4>
          <div className="input-row">
            <div className="input-group">
              <label>Min Temp (°C):</label>
              <input type="number" name="minTemp" value={currentConditions.minTemp} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Max Temp (°C):</label>
              <input type="number" name="maxTemp" value={currentConditions.maxTemp} onChange={handleInputChange} />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Min Hum (%):</label>
              <input type="number" name="minHum" value={currentConditions.minHum} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Max Hum (%):</label>
              <input type="number" name="maxHum" value={currentConditions.maxHum} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Operation Timing */}
        <div className="form-section">
          <h4>Operation Timing Conditions</h4>
          <div className="input-group-row">
            <label>Time operation:</label>
            <div className="input-group-inline">
              <span>Every</span>
              <input type="number" name="timeOpHours" value={currentConditions.timeOpHours} onChange={handleInputChange} min="0" />
              <span>hr(s)</span>
              <input type="number" name="timeOpMins" value={currentConditions.timeOpMins} onChange={handleInputChange} min="0" max="59" />
              <span>min(s)</span>
              <input type="number" name="timeOpSecs" value={currentConditions.timeOpSecs} onChange={handleInputChange} min="0" max="59" />
              <span>sec(s)</span>
            </div>
          </div>
          <div className="input-group-row">
            <label>Will move for:</label>
            <div className="input-group-inline">
              <input type="number" name="moveForHours" value={currentConditions.moveForHours} onChange={handleInputChange} min="0" />
              <span>hr(s)</span>
              <input type="number" name="moveForMins" value={currentConditions.moveForMins} onChange={handleInputChange} min="0" max="59" />
              <span>min(s)</span>
              <input type="number" name="moveForSecs" value={currentConditions.moveForSecs} onChange={handleInputChange} min="0" max="59" />
              <span>sec(s)</span>
            </div>
          </div>
        </div>

        {/* Variation & Duration */}
        <div className="form-section">
          <h4>Variations & Duration</h4>
          <div className="input-row">
            <div className="input-group">
              <label>Humidity Variation:</label>
              <input type="text" name="humVariation" value={currentConditions.humVariation} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Temperature Variation:</label>
              <input type="text" name="tempVariation" value={currentConditions.tempVariation} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Auto Duration:</label>
              <input type="text" name="autoDuration" value={currentConditions.autoDuration} onChange={handleInputChange} />
            </div>
          </div>
        </div>
        
        {/* Set Button */}
        <div className="button-container">
          <button className="set-button" onClick={handleSetConditions}>Set</button>
        </div>
      </div>
    </div>
  );
};

export default ConditionsTab;