import React, { useState, useEffect, useMemo } from 'react';
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
import 'react-datepicker/dist/react-datepicker.css'; // <--- IMPORTANT: This line imports the DatePicker's default styling

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

import mockSensorData from '../data/sensorrReadingsGPL242510-1.json';

interface SensorData {
  id?: number;
  robotid: string;
  sensorId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  controlMode: string;
  motorInterval: number;
  powerConsumption: number | null;
}

interface TimeframeOption {
  label: string;
  unit: 'minute' | 'hour' | 'day';
  stepSize: number;
  displayFormat: string;
}

const TIME_INTERVAL_OPTIONS: TimeframeOption[] = [
  { label: 'Every 5 Mins', unit: 'minute', stepSize: 5, displayFormat: 'HH:mm' },
  { label: 'Every 15 Mins', unit: 'minute', stepSize: 15, displayFormat: 'HH:mm' },
  { label: 'Every 30 Mins', unit: 'minute', stepSize: 30, displayFormat: 'HH:mm' },
  { label: 'Every 1 Hour', unit: 'hour', stepSize: 1, displayFormat: 'MMM d, HH:mm' },
  { label: 'Every 3 Hours', unit: 'hour', stepSize: 3, displayFormat: 'MMM d, HH:mm' },
  { label: 'Every 6 Hours', unit: 'hour', stepSize: 6, displayFormat: 'MMM d, HH:mm' },
  { label: 'Every 12 Hours', unit: 'hour', stepSize: 12, displayFormat: 'MMM d, HH:mm' },
  { label: 'Every 1 Day', unit: 'day', stepSize: 1, displayFormat: 'MMM d' },
];

const AngraphTab: React.FC = () => {
  const [currentSensorData, setCurrentSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // startDate and endDate remain strings for your filtering logic
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(TIME_INTERVAL_OPTIONS[3]); // Default to "Every 1 Hour"

  // This function formats a Date object into a 'YYYY-MM-DD' string for the input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const simulateFetchSensorData = () => {
    setLoading(true);
    setError(null);
    try {
      const data: SensorData[] = mockSensorData as SensorData[];

      if (!data || data.length === 0) {
        throw new Error("Mock data is empty or undefined. Check your JSON file content and path.");
      }
      setCurrentSensorData(data);
      console.log('Simulated fetch: Data loaded successfully. Total points:', data.length);
    } catch (err: any) {
      console.error("AngraphTab: Failed to load mock sensor data:", err);
      setError(`Failed to load mock sensor data: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    simulateFetchSensorData();
  }, []);

  useEffect(() => {
    if (currentSensorData.length > 0 && !startDate && !endDate) {
      const timestamps = currentSensorData.map(d => new Date(d.timestamp.replace(' ', 'T')));
      const minDate = new Date(Math.min(...timestamps.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(date => date.getTime())));

      const formattedMinDate = formatDateForInput(minDate);
      const formattedMaxDate = formatDateForInput(maxDate);

      setStartDate(formattedMinDate);
      setEndDate(formattedMaxDate);

      console.log('Default Dates Set: Start:', formattedMinDate, 'End:', formattedMaxDate);
    }
  }, [currentSensorData, startDate, endDate]);

  const { temperatureDatasets, humidityDatasets } = useMemo(() => {
    console.log('useMemo: Recalculating datasets...');
    console.log('useMemo inputs: currentSensorData.length=', currentSensorData.length, 'startDate=', startDate, 'endDate=', endDate);

    if (currentSensorData.length === 0 || !startDate || !endDate) {
      console.log('useMemo: Skipping dataset calculation (data not loaded or dates not set).');
      return { temperatureDatasets: [], humidityDatasets: [] };
    }

    const filterStartDateTime = new Date(startDate + 'T00:00:00');
    const filterEndDateTime = new Date(endDate + 'T23:59:59');

    console.log('Filtering from:', filterStartDateTime.toISOString(), 'to:', filterEndDateTime.toISOString());

    const filteredData = currentSensorData.filter(d => {
      const timestamp = new Date(d.timestamp.replace(' ', 'T'));
      return timestamp >= filterStartDateTime && timestamp <= filterEndDateTime;
    });

    console.log('Filtered Data Length:', filteredData.length);

    if (filteredData.length === 0) {
      console.warn("No data available for the selected date range.");
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
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4'];

    let colorIndex = 0;

    for (const sensorId in dataBySensor) {
      const sensorData = dataBySensor[sensorId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const sensorColor = colors[colorIndex % colors.length];

      tempDatasets.push({
        label: `${sensorId} - Temperature (°C)`,
        data: sensorData.map(d => {
          const isoTimestamp = d.timestamp.replace(' ', 'T');
          const xValue = new Date(isoTimestamp);
          return { x: xValue, y: d.temperature };
        }),
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
        data: sensorData.map(d => {
          const isoTimestamp = d.timestamp.replace(' ', 'T');
          const xValue = new Date(isoTimestamp);
          return { x: xValue, y: d.humidity };
        }),
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

  const getDisplayFormats = (selectedUnit: 'minute' | 'hour' | 'day', selectedFormat: string) => {
    const formats: { [key: string]: string } = {
      minute: 'HH:mm',
      hour: 'MMM d, HH:mm',
      day: 'MMM d',
      month: 'MMMM',
      year: 'yyyy',
    };
    formats[selectedUnit] = selectedFormat;
    return formats;
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
          unit: selectedTimeframe.unit,
          stepSize: selectedTimeframe.stepSize,
          tooltipFormat: 'MMM d,yyyy HH:mm:ss',
          displayFormats: getDisplayFormats(selectedTimeframe.unit, selectedTimeframe.displayFormat),
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
  }), [selectedTimeframe]);

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
          unit: selectedTimeframe.unit,
          stepSize: selectedTimeframe.stepSize,
          tooltipFormat: 'MMM d,yyyy HH:mm:ss',
          displayFormats: getDisplayFormats(selectedTimeframe.unit, selectedTimeframe.displayFormat),
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
  }), [selectedTimeframe]);


  return (
    <div className="angraph-tab-container">
      <h2>Historical Sensor Readings (Angraph)</h2>

      {loading && <p className="loading-message">Loading historical sensor data from mock file...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && currentSensorData.length === 0 && (
        <p className="no-data-message">No mock sensor data available. Check your JSON file and its path/content.</p>
      )}

      {/* --- Filter Controls Container --- */}
      {!loading && !error && currentSensorData.length > 0 && (
        <div className="filter-controls-container">
          <div className="date-filter-group">
            <label htmlFor="startDate">Start Date:</label>
            {/* START DATEPICKER */}
            <DatePicker
              // Convert string date to Date object for DatePicker's selected prop
              selected={startDate ? new Date(startDate) : null}
              // Convert selected Date object back to string for your state
              onChange={(date: Date | null) => setStartDate(date ? formatDateForInput(date) : '')}
              selectsStart // Indicates this is the start date for a range
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              dateFormat="yyyy-MM-dd" // Match your desired date format
              className="custom-datepicker-input" // Add a class for potential custom styling in CSS
            />
            {/* END DATEPICKER */}
            <label htmlFor="endDate">End Date:</label>
            {/* START DATEPICKER */}
            <DatePicker
              // Convert string date to Date object for DatePicker's selected prop
              selected={endDate ? new Date(endDate) : null}
              // Convert selected Date object back to string for your state
              onChange={(date: Date | null) => setEndDate(date ? formatDateForInput(date) : '')}
              selectsEnd // Indicates this is the end date for a range
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              dateFormat="yyyy-MM-dd" // Match your desired date format
              className="custom-datepicker-input" // Add a class for potential custom styling in CSS
            />
            {/* END DATEPICKER */}
          </div>

          <div className="timeframe-selector-group">
            <label htmlFor="timeframe">Interval:</label>
            <select
                id="timeframe"
                value={selectedTimeframe.label}
                onChange={(e) => {
                    const selectedLabel = e.target.value;
                    const newTimeframe = TIME_INTERVAL_OPTIONS.find(opt => opt.label === selectedLabel);
                    if (newTimeframe) {
                        setSelectedTimeframe(newTimeframe);
                    }
                }}
            >
                {TIME_INTERVAL_OPTIONS.map(option => (
                    <option key={option.label} value={option.label}>
                        {option.label}
                    </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* --- Render Charts --- */}
      {console.log('Rendering Charts? Loading:', loading, 'Error:', error, 'Temp Datasets Length:', temperatureDatasets.length, 'Hum Datasets Length:', humidityDatasets.length)}
      {!loading && !error && (
        temperatureDatasets.length > 0 || humidityDatasets.length > 0
      ) ? (
        <>
          <div className="chart-wrapper">
            <Line data={{ datasets: temperatureDatasets }} options={temperatureChartOptions} />
          </div>
          <div className="chart-wrapper" style={{ marginTop: '40px' }}>
            <Line data={{ datasets: humidityDatasets }} options={humidityChartOptions} />
          </div>
        </>
      ) : (
        !loading && !error && currentSensorData.length > 0 && (
          <p className="no-data-message">No sensor data found for the selected date range. Try adjusting your filters.</p>
        )
      )}
    </div>
  );
};

export default AngraphTab;