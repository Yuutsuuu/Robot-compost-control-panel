// src/components/AngraphTab.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './AngraphTab.css';

// Import Chart.js components
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';

import 'chartjs-adapter-date-fns';

// Import react-datepicker and its CSS
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface SensorData {
  id?: number;
  robotid: string; // Ensure this matches backend response
  sensorId: string;
  timestamp: string; // This will be the aggregated timestamp from backend
  temperature: number;
  humidity: number;
  controlMode: string;
  motorInterval: number;
  powerConsumption: number | null;
}

// Removed TIME_INTERVAL_OPTIONS and TimeframeOption interface as they are no longer dynamic

const AngraphTab: React.FC = () => {
  const [currentSensorData, setCurrentSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Removed selectedTimeframe state as it's no longer dynamic

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // NEW: Function to fetch real sensor data from your backend for graphing
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!startDate || !endDate) {
      console.log('Skipping fetch: Start or End Date not set.');
      setLoading(false);
      return;
    }

    try {
      // Only send startDate and endDate, as interval is fixed on backend
      const queryParams = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
      }).toString();

      const response = await fetch(`http://localhost:3000/getGraphData?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch graph data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SensorData[] = await response.json();
      console.log('Fetched graph data:', data);

      if (data.length === 0) {
        console.warn("No data returned from API for the selected filters.");
      }
      setCurrentSensorData(data);
    } catch (err: any) {
      console.error('Error fetching graph data:', err);
      setError(`Failed to load graph data: ${err.message || 'Unknown error'}. Please check the server and network connection.`);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]); // Dependencies for useCallback are now just dates

  // Initial fetch and re-fetch when filters change
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Set default start/end dates based on fetched data, if they aren't already set
  useEffect(() => {
    if (currentSensorData.length > 0 && !startDate && !endDate) {
      const timestamps = currentSensorData.map(d => new Date(d.timestamp.replace(' ', 'T')));
      const minDate = new Date(Math.min(...timestamps.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(date => date.getTime())));

      setStartDate(formatDateForInput(minDate));
      setEndDate(formatDateForInput(maxDate));

      console.log('Default Dates Set based on data:', formatDateForInput(minDate), 'to', formatDateForInput(maxDate));
    }
  }, [currentSensorData, startDate, endDate]);

  const { temperatureDatasets, humidityDatasets } = useMemo(() => {
    console.log('useMemo: Recalculating datasets...');
    if (currentSensorData.length === 0 || !startDate || !endDate) {
      console.log('useMemo: Skipping dataset calculation (data not loaded or dates not set).');
      return { temperatureDatasets: [], humidityDatasets: [] };
    }

    const filterStartDateTime = new Date(startDate + 'T00:00:00');
    const filterEndDateTime = new Date(endDate + 'T23:59:59');

    // FilteredData will be the `currentSensorData` if backend is filtering correctly
    const filteredData = currentSensorData.filter(d => {
      // Backend should return aggregated_timestamp. Make sure to use that.
      const timestamp = new Date(d.timestamp.replace(' ', 'T'));
      return timestamp >= filterStartDateTime && timestamp <= filterEndDateTime;
    });

    console.log('Filtered Data Length:', filteredData.length);

    if (filteredData.length === 0) {
      console.warn("No data available for the selected date range after local filtering.");
      return { temperatureDatasets: [], humidityDatasets: [] };
    }

    const dataBySensor: { [key: string]: SensorData[] } = {};
    filteredData.forEach(item => {
      if (!dataBySensor[item.sensorId]) {
        dataBySensor[item.sensorId] = [];
      }
      dataBySensor[item.sensorId].push(item);
    });

    const tempDatasets: any[] = [];
    const humDatasets: any[] = [];
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

    let colorIndex = 0;

    for (const sensorId in dataBySensor) {
      const sensorData = dataBySensor[sensorId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const sensorColor = colors[colorIndex % colors.length];

      tempDatasets.push({
        label: `${sensorId} - Temperature (°C)`,
        data: sensorData.map(d => ({ x: new Date(d.timestamp.replace(' ', 'T')), y: d.temperature })),
        borderColor: sensorColor,
        backgroundColor: sensorColor + '40',
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: sensorColor,
        fill: false,
      });

      humDatasets.push({
        label: `${sensorId} - Humidity (%)`,
        data: sensorData.map(d => ({ x: new Date(d.timestamp.replace(' ', 'T')), y: d.humidity })),
        borderColor: sensorColor,
        backgroundColor: sensorColor + '40',
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: sensorColor,
        fill: false,
      });

      colorIndex++;
    }

    console.log('Datasets prepared. Temperature datasets count:', tempDatasets.length, 'Humidity datasets count:', humDatasets.length);
    return { temperatureDatasets: tempDatasets, humidityDatasets: humDatasets };
  }, [currentSensorData, startDate, endDate]);

  // Removed getDisplayFormats as the format is now fixed
  // Hardcode display formats as the unit/stepSize are fixed to 5 minutes
  const fixedDisplayFormats = {
    millisecond: 'MMM d, HH:mm:ss.SSS',
    second: 'MMM d, HH:mm:ss',
    minute: 'MMM d, HH:mm', // Main format for 5-minute interval
    hour: 'MMM d, HH:mm',
    day: 'MMM d',
    week: 'MMM d',
    month: 'MMMM yyyy',
    quarter: '[Q]Q yyyy',
    year: 'yyyy',
  };


  const temperatureChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Temperature Over Time (°C)',
        font: { size: 20, weight: 'bold', family: 'Roboto, sans-serif' },
        color: '#004D40'
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => new Date(context[0].parsed.x).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
          }),
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y.toFixed(1) + '°C';
            return label;
          }
        },
        position: 'nearest',
        caretSize: 5,
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: 'bold' }
      },
      legend: {
        position: 'bottom' as const,
        labels: { color: '#333', font: { size: 14 } }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute',   // Hardcoded to minute
          stepSize: 5,      // Hardcoded to 5
          tooltipFormat: 'MMM d,yyyy HH:mm:ss',
          displayFormats: fixedDisplayFormats, // Use fixed formats
        },
        title: { display: true, text: 'Timestamp', color: '#333' },
        ticks: {
          color: '#555',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: { borderColor: '#ddd', color: 'rgba(0, 0, 0, 0.05)' }
      },
      y: {
        title: { display: true, text: 'Temperature (°C)', color: '#333' },
        ticks: { color: '#555' },
        grid: { borderColor: '#ddd', color: 'rgba(0, 0, 0, 0.05)' },
        min: 0,
      },
    },
  }), []); // Empty dependency array as options are now static

  const humidityChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Humidity Over Time (%)',
        font: { size: 20, weight: 'bold', family: 'Roboto, sans-serif' },
        color: '#004D40'
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => new Date(context[0].parsed.x).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
          }),
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y.toFixed(1) + '%';
            return label;
          }
        },
        position: 'nearest',
        caretSize: 5,
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: 'bold' }
      },
      legend: {
        position: 'bottom' as const,
        labels: { color: '#333', font: { size: 14 } }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute',   // Hardcoded to minute
          stepSize: 5,      // Hardcoded to 5
          tooltipFormat: 'MMM d,yyyy HH:mm:ss',
          displayFormats: fixedDisplayFormats, // Use fixed formats
        },
        title: { display: true, text: 'Timestamp', color: '#333' },
        ticks: {
          color: '#555',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: { borderColor: '#ddd', color: 'rgba(0, 0, 0, 0.05)' }
      },
      y: {
        title: { display: true, text: 'Humidity (%)', color: '#333' },
        ticks: { color: '#555' },
        grid: { borderColor: '#ddd', color: 'rgba(0, 0, 0, 0.05)' },
        min: 0,
        max: 100,
      },
    },
  }), []); // Empty dependency array as options are now static


  return (
    <div className="angraph-tab-container">
      <h2>Historical Sensor Readings (Graphs)</h2>

      {loading && <p className="loading-message">Loading historical sensor data...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="filter-controls-container">
          <div className="date-filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <DatePicker
              selected={startDate ? new Date(startDate) : null}
              onChange={(date: Date | null) => setStartDate(date ? formatDateForInput(date) : '')}
              selectsStart
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              dateFormat="yyyy-MM-dd"
              className="custom-datepicker-input"
            />
            <label htmlFor="endDate">End Date:</label>
            <DatePicker
              selected={endDate ? new Date(endDate) : null}
              onChange={(date: Date | null) => setEndDate(date ? formatDateForInput(date) : '')}
              selectsEnd
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              dateFormat="yyyy-MM-dd"
              className="custom-datepicker-input"
            />
          </div>
          {/* Removed the timeframe-selector-group (interval dropdown) */}
        </div>
      )}

      {!loading && !error && (currentSensorData.length > 0) ? (
        <>
          <div className="chart-wrapper">
            <Line data={{ datasets: temperatureDatasets }} options={temperatureChartOptions} />
          </div>
          <div className="chart-wrapper" style={{ marginTop: '40px' }}>
            <Line data={{ datasets: humidityDatasets }} options={humidityChartOptions} />
          </div>
        </>
      ) : (
        !loading && !error && (
          <p className="no-data-message">
            {currentSensorData.length === 0 ? "No sensor data available. Filters the dates to view or check the backend connection." : "No sensor data found for the selected date range. Try adjusting your filters."}
          </p>
        )
      )}
    </div>
  );
};

export default AngraphTab;