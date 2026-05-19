import React, { useState } from 'react';

const DeputyImport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function importFromDeputy() {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://us-central1-lucys-warehouse.cloudfunctions.net/importDeputy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate, endDate })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✓ Successfully imported ${data.imported} timesheets from Deputy`);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage(`✗ Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Labour Data from Deputy</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          onClick={importFromDeputy}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          {loading ? 'Importing...' : 'Import from Deputy'}
        </button>

        {message && (
          <div className={`mt-4 p-4 rounded-md ${message.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium mb-2">Import Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select the date range for timesheet data</li>
            <li>Click "Import from Deputy"</li>
            <li>Data will be synced to Firebase automatically</li>
            <li>Monthly summaries will be updated</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DeputyImport;
