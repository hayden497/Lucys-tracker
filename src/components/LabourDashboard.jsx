import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Your existing Firebase config

const LabourDashboard = () => {
  const [labourData, setLabourData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadLabourData();
  }, [selectedMonth, selectedLocation]);

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async function loadLabourData() {
    setLoading(true);
    try {
      const labourRef = collection(db, 'labourEntries');
      let q = query(
        labourRef,
        where('month', '==', selectedMonth),
        orderBy('date', 'desc')
      );

      if (selectedLocation !== 'ALL') {
        q = query(
          labourRef,
          where('month', '==', selectedMonth),
          where('location', '==', selectedLocation),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setLabourData(entries);
      calculateSummary(entries);
    } catch (error) {
      console.error('Error loading labour data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateSummary(entries) {
    const summary = {
      totalHours: 0,
      totalCost: 0,
      employeeCount: new Set(),
      byLocation: { AKL: { hours: 0, cost: 0 }, PALMY: { hours: 0, cost: 0 } },
      byCostCentre: {},
      byEmployee: {}
    };

    entries.forEach(entry => {
      summary.totalHours += entry.totalHours;
      summary.totalCost += entry.totalCost;
      summary.employeeCount.add(entry.employeeName);

      // By location
      if (entry.location === 'AKL' || entry.location === 'PALMY') {
        summary.byLocation[entry.location].hours += entry.totalHours;
        summary.byLocation[entry.location].cost += entry.totalCost;
      }

      // By cost centre
      const area = entry.areaName || 'Unassigned';
      if (!summary.byCostCentre[area]) {
        summary.byCostCentre[area] = { hours: 0, cost: 0 };
      }
      summary.byCostCentre[area].hours += entry.totalHours;
      summary.byCostCentre[area].cost += entry.totalCost;

      // By employee
      if (!summary.byEmployee[entry.employeeName]) {
        summary.byEmployee[entry.employeeName] = { hours: 0, cost: 0, rate: 0 };
      }
      summary.byEmployee[entry.employeeName].hours += entry.totalHours;
      summary.byEmployee[entry.employeeName].cost += entry.totalCost;
    });

    // Calculate average rates
    Object.keys(summary.byEmployee).forEach(name => {
      const emp = summary.byEmployee[name];
      emp.rate = emp.hours > 0 ? emp.cost / emp.hours : 0;
    });

    summary.employeeCount = summary.employeeCount.size;
    setSummary(summary);
  }

  async function generateMonthEndReport() {
    if (!window.confirm(`Generate and email labour report for ${selectedMonth} to:\n• Hayden\n• Lucy\n• Danielle (Cahill & Co)`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateLabourReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: selectedMonth })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✓ Report generated and emailed to Felicity!\n\nPDF: ${data.pdfUrl}`);
      } else {
        alert(`Failed to generate report: ${data.error}`);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading labour data...</div>
      </div>
    );
  }

  const topEmployees = summary ? 
    Object.entries(summary.byEmployee)
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, 5) 
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Labour Dashboard</h1>
        <p className="text-gray-600">Month-end labour reporting for Lucy's Event Hire</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="2026-03">March 2026</option>
              <option value="2026-02">February 2026</option>
              <option value="2026-01">January 2026</option>
              <option value="2025-12">December 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-10">October 2025</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Locations</option>
              <option value="AKL">Auckland</option>
              <option value="PALMY">Palmerston North</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Hours</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {summary.totalHours.toLocaleString('en-NZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Cost</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ${summary.totalCost.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Avg Hourly Rate</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ${(summary.totalCost / summary.totalHours).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Employees</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {summary.employeeCount}
            </div>
          </div>
        </div>
      )}

      {/* Location Split */}
      {summary && selectedLocation === 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auckland</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium">{summary.byLocation.AKL.hours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">${summary.byLocation.AKL.cost.toLocaleString('en-NZ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Rate:</span>
                <span className="font-medium">
                  ${(summary.byLocation.AKL.cost / summary.byLocation.AKL.hours || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Palmerston North</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium">{summary.byLocation.PALMY.hours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">${summary.byLocation.PALMY.cost.toLocaleString('en-NZ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Rate:</span>
                <span className="font-medium">
                  ${(summary.byLocation.PALMY.cost / summary.byLocation.PALMY.hours || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Employees */}
      {topEmployees.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Employees by Hours</h3>
          <div className="space-y-3">
            {topEmployees.map(([name, data]) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{name}</div>
                  <div className="text-sm text-gray-500">
                    {data.hours.toFixed(1)}h @ ${data.rate.toFixed(2)}/hr
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${data.cost.toLocaleString('en-NZ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Centre Breakdown */}
      {summary && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Cost Centre</h3>
          <div className="space-y-3">
            {Object.entries(summary.byCostCentre)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([area, data]) => (
                <div key={area} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{area}</div>
                    <div className="text-sm text-gray-500">{data.hours.toFixed(1)} hours</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${data.cost.toLocaleString('en-NZ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {((data.cost / summary.totalCost) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Month-End Report Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Month-End Report</h3>
        <button
          onClick={generateMonthEndReport}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Report & Email Team'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Generates PDF report and emails to Hayden, Lucy, and Danielle at Cahill & Co
        </p>
      </div>
    </div>
  );
};

export default LabourDashboard;
