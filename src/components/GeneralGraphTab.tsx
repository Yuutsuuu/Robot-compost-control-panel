// src/components/GeneralGraphTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import sensorData from '../data/sensorrReadingsGPL242510-1.json';
import './GeneralGraphTab.css';

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

const GeneralGraphTab: React.FC = () => {
  const [data, setData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for customization controls
  const [selectedRobotId, setSelectedRobotId] = useState<string>('All');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [showTemperature, setShowTemperature] = useState<boolean>(true);
  const [showHumidity, setShowHumidity] = useState<boolean>(true);

  // --- Data Processing and Filtering ---
  const allReadings = useMemo(() => {
    try {
      // Sort all data by timestamp once
      const sortedData = (sensorData as SensorReading[]).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sortedData;
    } catch (err) {
      setError('Failed to load or process graph data.');
      return [];
    }
  }, []);

  // Use a memoized value for unique filters to avoid re-calculating on every render
  const uniqueRobotIds = useMemo(() => ['All', ...new Set(allReadings.map(d => d.robotId))], [allReadings]);
  const uniqueSensorIds = useMemo(() => {
    const sensors = allReadings
      .filter(d => selectedRobotId === 'All' || d.robotId === selectedRobotId)
      .map(d => d.sensorId);
    return ['All', ...new Set(sensors)];
  }, [allReadings, selectedRobotId]);

  useEffect(() => {
    setLoading(true);
    let filteredData = [...allReadings];

    // Filter by Robot ID
    if (selectedRobotId !== 'All') {
      filteredData = filteredData.filter(d => d.robotId === selectedRobotId);
    }

    // Filter by Sensor ID
    if (selectedSensorId !== 'All') {
      filteredData = filteredData.filter(d => d.sensorId === selectedSensorId);
    }

    // Filter by Time Range
    const now = new Date();
    if (selectedTimeRange === '24h') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredData = filteredData.filter(d => new Date(d.timestamp) >= oneDayAgo);
    } else if (selectedTimeRange === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = filteredData.filter(d => new Date(d.timestamp) >= sevenDaysAgo);
    }

    // Format timestamps for chart display
    const formattedData = filteredData.map(item => ({
      ...item,
      // We will show either a date and time or just a time depending on the range
      formattedTimestamp: new Date(item.timestamp).toLocaleString(),
      formattedShortTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    setData(formattedData);
    setLoading(false);
  }, [selectedRobotId, selectedSensorId, selectedTimeRange, allReadings]);

  // --- Rendering ---
  if (error) {
    return <div className="graph-container error-message">{error}</div>;
  }

  const chartData = data.map(item => ({
    ...item,
    // Use the Sensor ID as the data key to plot multiple sensors on the same chart
    [item.sensorId + '_temp']: item.temperature,
    [item.sensorId + '_hum']: item.humidity,
  }));

  const dataKeys = uniqueSensorIds.filter(id => id !== 'All');

  return (
    <div className="graph-container">
      <h2>Customizable Sensor Graph</h2>
      
      {/* Controls Panel */}
      <div className="graph-controls">
        <div className="control-group">
          <label htmlFor="robot-select">Robot ID:</label>
          <select id="robot-select" value={selectedRobotId} onChange={(e) => setSelectedRobotId(e.target.value)}>
            {uniqueRobotIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sensor-select">Sensor ID:</label>
          <select id="sensor-select" value={selectedSensorId} onChange={(e) => setSelectedSensorId(e.target.value)} disabled={selectedRobotId === 'All'}>
            {uniqueSensorIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="time-range-select">Time Range:</label>
          <select id="time-range-select" value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
            <option value="all">All Data</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        <div className="control-group checkbox-group">
          <label>Data Points:</label>
          <div>
            <input type="checkbox" id="temp-toggle" checked={showTemperature} onChange={(e) => setShowTemperature(e.target.checked)} />
            <label htmlFor="temp-toggle">Temperature</label>
          </div>
          <div>
            <input type="checkbox" id="hum-toggle" checked={showHumidity} onChange={(e) => setShowHumidity(e.target.checked)} />
            <label htmlFor="hum-toggle">Humidity</label>
          </div>
        </div>
      </div>

      {/* Graph Display */}
      {loading ? (
        <p>Loading graph...</p>
      ) : chartData.length === 0 ? (
        <p>No data available for the selected filters.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="formattedTimestamp"
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
            <Tooltip labelFormatter={(label) => `Time: ${label}`} />
            <Legend />
            {/* Conditionally render lines based on selected data points and sensors */}
            {showTemperature && dataKeys.map(key => (
              <Line
                key={`${key}_temp`}
                yAxisId="left"
                type="monotone"
                dataKey={`${key}_temp`}
                stroke="#d88484"
                name={`Temp - ${key}`}
                dot={false}
              />
            ))}
            {showHumidity && dataKeys.map(key => (
              <Line
                key={`${key}_hum`}
                yAxisId="right"
                type="monotone"
                dataKey={`${key}_hum`}
                stroke="#82ca9d"
                name={`Hum - ${key}`}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GeneralGraphTab;