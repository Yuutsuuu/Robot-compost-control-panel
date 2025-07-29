// src/components/MeasureTab.tsx
import React, { useState, useEffect } from 'react';
import './MeasureTab.css';
import { data } from 'react-router-dom';

interface SensorData {
  id: number;
  robotId: string;
  sensorId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  controlMode: string;
  motorInterval: number;
  powerconsumption: number;
  compostPhase: string;
}

const formatToJST = (utcDateStr: string): string => {
  const date = new Date(utcDateStr);
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

const MeasureTab: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);

  // Fetch sensor data from API
  const fetchSensorData = async () => {
    try {
      const response = await fetch('http://localhost:3000/getLatestSensorData', {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }); // Replace with your actual endpoint
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      const data: SensorData[] = await response.json();
      console.log('Fetched sensor data:', data);
      setSensors(data);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }

  };

  useEffect(() => {
    fetchSensorData();
    const fetchInterval = setInterval(fetchSensorData, 5000); // Fetch every 5 seconds
    return () => clearInterval(fetchInterval);
  }, []);

  return (
    <div className="control-panel-container">
      <h2>Overview of Composters</h2>

      <div className="control-sections">
        <div className="control-card sensor-config-card">
          <h3>Composter Status Overview</h3>
          <div className="sensor-grid">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="sensor-card">
                <h4>{sensor.sensorId}</h4>
                <p className="sensor-reading">Temperature: <span className="value">{sensor.temperature}°C</span></p>
                <p className="sensor-reading">Humidity: <span className="value">{sensor.humidity}%</span></p>
                <p className="sensor-reading">Compost Phase: <span className="value">{sensor.compostPhase}</span></p>
                <p className='sensor-reading'>Latest record: <span className="value">{formatToJST(sensor.timestamp)}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasureTab;
