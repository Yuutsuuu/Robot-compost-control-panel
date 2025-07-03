// src/components/SensorReadingsTab.tsx

import React, { useState, useEffect } from 'react';
import './SensorReadingsTab.css'; // Import the CSS file
import sensorData from '../data/sensorrReadingsGPL242510-1.json'; // Assuming you move your JSON to src/data

// Define an interface for the sensor data structure
interface SensorReading {
  id: number;
  robotId: string;
  sensorId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  controlMode: string;
  motorInterval: number;
}

const SensorReadingsTab: React.FC = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real application, you would fetch this data from an API endpoint.
    // For now, we're simulating a fetch by directly importing the JSON.
    try {
      // Simulate a network delay
      setTimeout(() => {
        setReadings(sensorData as SensorReading[]);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to load sensor data.');
      setLoading(false);
      console.error(err);
    }
  }, []);

  if (loading) {
    return <div className="sensor-readings-container">Loading sensor data...</div>;
  }

  if (error) {
    return <div className="sensor-readings-container error-message">{error}</div>;
  }

  return (
    <div className="sensor-readings-container">
      <h2>Historical Sensor Readings</h2>
      {readings.length === 0 ? (
        <p>No sensor readings available.</p>
      ) : (
        <div className="table-scroll-wrapper">
          <table className="sensor-readings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Robot ID</th>
                <th>Sensor ID</th>
                <th>Timestamp</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Control Mode</th>
                <th>Motor Interval (s)</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td>{reading.id}</td>
                  <td>{reading.robotId}</td>
                  <td>{reading.sensorId}</td>
                  <td>{new Date(reading.timestamp).toLocaleString()}</td>
                  <td>{reading.temperature.toFixed(1)}</td>
                  <td>{reading.humidity.toFixed(1)}</td>
                  <td>{reading.controlMode}</td>
                  <td>{reading.motorInterval.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SensorReadingsTab;