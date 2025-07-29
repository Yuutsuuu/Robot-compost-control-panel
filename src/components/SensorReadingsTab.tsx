// src/components/MeasureTab.tsx (Updated with detailed phase logic)

import React, { useState, useEffect } from 'react';
import './MeasureTab.css'; // Import the CSS file

// Mock data for demonstration purposes
interface SensorData {
  id: number;
  robotId: string;
  sensorId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  controlMode: string; // 'manual' or 'timer'
  motorInterval: number; // in seconds
}

interface RobotControl {
  robotId: string;
  isPowered: boolean; // Still conceptual for overall system status
  controlMode: string;
  interval: number;
}

const mockSensors: SensorData[] = [
  { id: 1, robotId: 'Rpi__1', sensorId: 'Sensor__1', timestamp: '2024-01-01 10:00:00', temperature: 25.1, humidity: 60.5, controlMode: 'timer', motorInterval: 10 },
  { id: 2, robotId: 'Rpi__1', sensorId: 'Sensor__2', timestamp: '2024-01-01 10:00:00', temperature: 24.8, humidity: 61.2, controlMode: 'manual', motorInterval: 0 },
  { id: 3, robotId: 'Rpi__1', sensorId: 'Sensor__3', timestamp: '2024-01-01 10:00:00', temperature: 25.3, humidity: 59.9, controlMode: 'timer', motorInterval: 15 },
  { id: 4, robotId: 'Rpi__1', sensorId: 'Sensor__4', timestamp: '2024-01-01 10:00:00', temperature: 24.9, humidity: 60.8, controlMode: 'manual', motorInterval: 0 },
];

const MeasureTab: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>(mockSensors);
  const [systemOnline, setSystemOnline] = useState<boolean>(true); // New state for system online status
  const [nextMixTime, setNextMixTime] = useState<string>(''); // New state for next mix time
  const [robotControl, setRobotControl] = useState<RobotControl>({ // Kept for sensor status display
    robotId: 'Rpi__1',
    isPowered: true,
    controlMode: 'timer',
    interval: 10 // Default motor interval
  });
  // State for motor status and compost phase
  const [motorStatus, setMotorStatus] = useState<'Stopped' | 'Rotating'>('Stopped');
  const [compostPhase, setCompostPhase] = useState('Inactive');

  useEffect(() => {
    // Simulate real-time updates (e.g., fetching new sensor data every few seconds)
    const sensorInterval = setInterval(() => {
      setSensors(prevSensors =>
        prevSensors.map(sensor => ({
          ...sensor,
          temperature: parseFloat((sensor.temperature + (Math.random() * 5 - 2.5)).toFixed(1)), // Adjusted range for more phase changes
          humidity: parseFloat((sensor.humidity + (Math.random() * 1.0 - 0.5)).toFixed(1)),
          timestamp: new Date().toLocaleString(),
        }))
      );
    }, 5000); // Update every 5 seconds

    // Simulate system online status (could be real ping in future)
    const systemStatusInterval = setInterval(() => {
      setSystemOnline(Math.random() > 0.1); // 90% chance of being online
    }, 10000); // Check status every 10 seconds

    // Calculate and update next mix time
    const updateNextMixTime = () => {
      const now = new Date();
      let nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1);
      nextHour.setMinutes(0);
      nextHour.setSeconds(0);
      nextHour.setMilliseconds(0);
      setNextMixTime(nextHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateNextMixTime(); // Initial set
    const mixTimeInterval = setInterval(updateNextMixTime, 60 * 1000); // Update every minute

    // Simulate motor automation (30 seconds every 1 hour)
    const motorAutomationInterval = setInterval(() => {
        // Check if the control mode is 'timer' to trigger automation
        if (robotControl.controlMode === 'timer') {
            console.log('Automated mix triggered!');
            setMotorStatus('Rotating');
            // Stop the motor after 30 seconds
            setTimeout(() => {
                setMotorStatus('Stopped');
            }, 30000);
        }
    }, 3600000); // Corrected to 1 hour (3,600,000 milliseconds)

    // NEW LOGIC: Simulate compost phase based on detailed temperature ranges
    const phaseSimulationInterval = setInterval(() => {
      // Use the temperature of the first sensor for simplicity
      const currentTemp = sensors[0]?.temperature || 25; 
      
      // Implement the phase logic based on your provided temperature ranges
      if (currentTemp >= 45 && currentTemp <= 70) {
        setCompostPhase('Thermophilic Phase');
      } else if (currentTemp >= 10 && currentTemp < 45) {
        setCompostPhase('Mesophilic Phase');
      } else if (currentTemp < 10) {
        setCompostPhase('Psychrophilic Phase');
      } else if (currentTemp > 70) {
        setCompostPhase('Overheating Warning!'); // Added a state for temps > 70
      } else {
        setCompostPhase('Inactive');
      }
    }, 1000); // Update phase every second based on simulated temp

    return () => {
      clearInterval(sensorInterval);
      clearInterval(systemStatusInterval);
      clearInterval(mixTimeInterval);
      clearInterval(motorAutomationInterval); // Clean up new intervals
      clearInterval(phaseSimulationInterval); // Clean up new intervals
    };
  }, [sensors, robotControl.controlMode]); // Add dependencies to re-run effect on state change

  // Handler for the notifications button
  const handleViewNotifications = () => {
      alert(`Current Compost Status:\nPhase: ${compostPhase}\nTemperature: ${sensors[0]?.temperature}°C\nHumidity: ${sensors[0]?.humidity}%`);
      console.log('This button will eventually fetch notifications via MQTT/SNS.');
  };

  return (
    <div className="control-panel-container">
      <h2>Robot & Sensor Control Panel</h2>

      <div className="control-sections">
        {/* Composter System Overview Card */}
        <div className="control-card robot-control-card">
          <h3>Composter System Overview</h3>
          <div className="control-item">
            <label className="control-label">System Status:</label>
            <span className={`status-indicator ${systemOnline ? 'on' : 'off'}`}>
              {systemOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="control-item">
            <label className="control-label">Next Mix:</label>
            <span className="current-setting">{nextMixTime}</span>
          </div>

          <div className="control-item">
            <label className="control-label">Automation:</label>
            <span className="current-setting">Every 60 minutes for 30s</span>
          </div>

          {/* Display for the motor status */}
          <div className="control-item">
            <label className="control-label">Motor Status:</label>
            <span className={`motor-status-display ${motorStatus.toLowerCase()}`}>
                {motorStatus}
            </span>
          </div>
          
          {/* Display for the compost phase */}
          <div className="control-item">
              <label className="control-label">Compost Phase:</label>
              <span className="compost-phase-display">{compostPhase}</span>
          </div>

          {/* NEW BUTTON: Trigger notifications */}
          <div className="button-container">
            <button className="trigger-button" onClick={handleViewNotifications}>View Notifications</button>
          </div>
        </div>

        {/* Sensor Configuration Card */}
        <div className="control-card sensor-config-card">
          <h3>Sensor Configuration</h3>
          <div className="sensor-grid">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="sensor-card">
                <h4>{sensor.sensorId}</h4>
                <div className="control-item">
                  <label className="control-label">Status:</label>
                  <label className="switch small-switch">
                    <input type="checkbox" checked={systemOnline} readOnly /> {/* Linked to systemOnline status */}
                    <span className="slider round"></span>
                  </label>
                  <span className={`status-indicator ${systemOnline ? 'on' : 'off'}`}>
                    {systemOnline ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="sensor-reading">Temperature: <span className="value">{sensor.temperature}°C</span></p>
                <p className="sensor-reading">Humidity: <span className="value">{sensor.humidity}%</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasureTab;