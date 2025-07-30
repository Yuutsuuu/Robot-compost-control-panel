// src/components/SensorReadingsTab.tsx

import React, { useState, useEffect } from 'react';
import './SensorReadingsTab.css';

// Define an interface for the sensor data structure
interface SensorReading {
  id: number;
  robotId: string;
  sensorId: string;
  timestamp: string; // Assuming API always sends a string, even if empty.
  temperature: number | null; // Changed to allow null
  humidity: number | null;   // Changed to allow null
  controlMode: string;
  motorInterval: number | null; // Changed to allow null
  powerconsumption: number | null; // Changed to allow null
  compostPhase: string;
}

// Function to format UTC timestamps to JST
const formatToJST = (utcDateStr: string): string => {
  // Add a check to ensure utcDateStr is a valid string before creating a Date object
  if (!utcDateStr || typeof utcDateStr !== 'string') {
    return 'Invalid Timestamp'; // Return a placeholder if the timestamp is not valid
  }

  const date = new Date(utcDateStr);

  // Check if the Date object is valid (e.g., new Date('invalid string') results in Invalid Date)
  if (isNaN(date.getTime())) {
    return 'Invalid Timestamp'; // Handle cases where the string isn't a valid date format
  }

  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long', // "July"
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short' // "JST"
  });
};

const SensorReadingsTab: React.FC = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // State for selected number of rows, default to 100
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);

  // Fetch sensor data from API
  // This function now takes the state setters and the limit as arguments
  const fetchSensorData = async (
    limit: number, // Passed from rowsPerPage state
    setReadings: React.Dispatch<React.SetStateAction<SensorReading[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setLoading(true);
    setError(null);
    try {
      // MODIFIED URL: Include the 'limit' query parameter
      // IMPORTANT: Ensure your backend uses this 'limit' parameter in its SQL query.
      const response = await fetch(`http://localhost:3000/getSensorData?limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch sensor data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SensorReading[] = await response.json();
      console.log('Fetched sensor data:', data);

      setReadings(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      setError(`Failed to load sensor data: ${error.message || 'Unknown error'}. Please check the server and network connection.`);
      setLoading(false);
    }
  };

  // useEffect hook to manage the data fetching lifecycle
  useEffect(() => {
    // 1. Initial Data Fetch:
    // Call the fetch function with the current rowsPerPage limit.
    fetchSensorData(rowsPerPage, setReadings, setLoading, setError);

    // 2. Periodic Data Fetch (removed for historical data, as requested by initial problem)
    // For historical data, you typically fetch once or on filter change.
    // If you need periodic updates for new historical entries, you'd add this back,
    // but consider performance with 130k entries.
    // The previous flickering was due to this.
    // If you add this back, consider smart updates (append only, or virtualized list).
    // const fetchInterval = setInterval(() => {
    //   fetchSensorData(rowsPerPage, setReadings, setLoading, setError);
    // }, 5000);

    // 3. Cleanup Function:
    // This function runs when the component unmounts.
    // If you uncommented setInterval above, you would re-add: return () => clearInterval(fetchInterval);
    return () => {
      // No interval to clear if it's commented out
    };
  }, [rowsPerPage]); // MODIFIED DEPENDENCY ARRAY: Re-run effect when rowsPerPage changes

  if (loading) {
    return <div className="sensor-readings-container">Loading historical sensor data...</div>;
  }

  if (error) {
    return <div className="sensor-readings-container error-message">{error}</div>;
  }

  return (
    <div className="sensor-readings-container">
      <h2>Sensor Readings</h2>

      {/* NEW DROPDOWN MENU FOR ROWS PER PAGE */}
      <div style={{ marginBottom: '15px', textAlign: 'right' }}>
        <label htmlFor="rows-per-page">Rows per page: </label>
        <select
          id="rows-per-page"
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={300}>300</option>
          <option value={400}>400</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

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
                <th>Power Consumption (W)</th>
                <th>Compost Phase</th>
                <th>Control Mode</th>
                <th>Motor Interval (s)</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                // It's good practice to ensure 'key' is a stable, unique identifier.
                // Assuming reading.id is unique and stable.
                <tr key={reading.id}>
                  <td>{reading.id}</td>
                  <td>{reading.robotId}</td>
                  <td>{reading.sensorId}</td>
                  <td>{formatToJST(reading.timestamp)}</td>
                  <td>{(reading.temperature ?? 0).toFixed(1)}</td>
                  <td>{(reading.humidity ?? 0).toFixed(1)}</td>
                  <td>{(reading.powerconsumption ?? 0).toFixed(1)}</td>
                  <td>{reading.compostPhase}</td>
                  <td>{reading.controlMode}</td>
                  <td>{(reading.motorInterval ?? 0).toFixed(1)}</td>
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