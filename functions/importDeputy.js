const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');



// Initialize Firestore
const db = admin.firestore();
/**
 * Imports timesheet data from Deputy API for a given date range
 * 
 * Call via POST:
 * {
 *   "startDate": "2026-05-01",
 *   "endDate": "2026-05-31"
 * }
 */
exports.importDeputy = functions.https.onRequest(async (req, res) => {
  // CORS headers for browser calls
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ 
        error: 'Missing startDate or endDate',
        example: { startDate: '2026-05-01', endDate: '2026-05-31' }
      });
      return;
    }

    // Get Deputy API token from Firebase config
    const deputyToken = functions.config().deputy?.token;
    if (!deputyToken) {
      throw new Error('Deputy API token not configured. Run: firebase functions:config:set deputy.token="YOUR_TOKEN"');
    }

    console.log(`Importing Deputy timesheets from ${startDate} to ${endDate}`);

    // Get Deputy subdomain from config (e.g., "lucysevents.au")
    const deputySubdomain = functions.config().deputy?.subdomain;
    if (!deputySubdomain) {
      throw new Error('Deputy subdomain not configured. Run: firebase functions:config:set deputy.subdomain="your-install.geo"');
    }

    // Convert dates to Unix timestamps (Deputy API requirement)
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    // Build Deputy API query
    // Search for timesheets where StartTime is between our date range
    const searchPayload = {
      search: {
        s1: { field: 'StartTime', type: 'ge', data: startTimestamp },
        s2: { field: 'StartTime', type: 'le', data: endTimestamp }
      },
      join: ['TimesheetPayReturn', 'EmployeeObject', 'OperationalUnitObject']
    };

    // Fetch timesheets from Deputy Resource API
    const url = `https://${deputySubdomain}.deputy.com/api/v1/resource/Timesheet/QUERY`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deputyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deputy API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const timesheets = await response.json();

    if (!Array.isArray(timesheets) || timesheets.length === 0) {
      res.json({
        success: true,
        message: 'No timesheets found for this date range',
        imported: 0
      });
      return;
    }

    // Process and import timesheets
    const entries = [];
    const batch = db.batch();
    let batchCount = 0;

    for (const timesheet of timesheets) {
      // Skip if missing essential data
      if (!timesheet.Employee || !timesheet.TotalTime || !timesheet.Date) {
        continue;
      }

      // Parse date from Deputy format
      const date = new Date(timesheet.Date);
      const dateStr = date.toISOString().split('T')[0];
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Get employee info from joined data
      const employeeName = timesheet.EmployeeObject?.DisplayName || 
                           timesheet._DPMetaData?.EmployeeInfo?.DisplayName || 
                           'Unknown';

      // Determine location from OperationalUnit metadata
      let location = 'UNKNOWN';
      const locationName = timesheet._DPMetaData?.OperationalUnitInfo?.CompanyName || 
                           timesheet.OperationalUnitObject?.CompanyName ||
                           '';
      
      if (locationName.toLowerCase().includes('auckland')) {
        location = 'AKL';
      } else if (locationName.toLowerCase().includes('palmerston')) {
        location = 'PALMY';
      }

      // Get pay data from joined TimesheetPayReturn
      const payReturn = timesheet.TimesheetPayReturn || {};
      const totalCost = payReturn.Cost || timesheet.Cost || 0;
      const totalHours = timesheet.TotalTime || 0;
      const hourlyRate = totalHours > 0 ? totalCost / totalHours : 0;

      // Parse meal break hours
      const mealbreakHours = timesheet.Mealbreak ? 
        parseFloat(timesheet.Mealbreak.split('T')[1]?.split(':').reduce((acc, val, i) => 
          acc + (parseFloat(val) / Math.pow(60, i)), 0) || 0) : 0;

      const entry = {
        employeeName,
        firstName: employeeName.split(' ')[0],
        date: dateStr,
        month: monthStr,
        startTime: timesheet.StartTimeLocalized || '',
        endTime: timesheet.EndTimeLocalized || '',
        mealbreak: Math.round(mealbreakHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        areaName: timesheet._DPMetaData?.OperationalUnitInfo?.OperationalUnitName || '',
        location,
        locationCode: timesheet.OperationalUnit?.toString() || '',
        locationName: timesheet._DPMetaData?.OperationalUnitInfo?.CompanyName || '',
        managerComment: timesheet.SupervisorComment || timesheet.EmployeeComment || '',
        deputyId: timesheet.Id,
        isInProgress: timesheet.IsInProgress || false,
        timeApproved: timesheet.TimeApproved || false,
        payRuleApproved: timesheet.PayRuleApproved || false,
        importDate: admin.firestore.FieldValue.serverTimestamp(),
        importSource: 'deputy-api'
      };

      entries.push(entry);

      // Add to batch
      const docRef = db.collection('labourEntries').doc();
      batch.set(docRef, entry);
      batchCount++;

      // Commit batch if we hit 500 (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount} entries`);
        batchCount = 0;
      }
    }

    // Commit remaining entries
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} entries`);
    }

    // Update monthly summary
    if (entries.length > 0) {
      await updateMonthlySummaries(entries);
    }

    res.json({
      success: true,
      message: `Successfully imported ${entries.length} timesheets from Deputy`,
      imported: entries.length,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Deputy import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update monthly summaries for imported entries
 */
async function updateMonthlySummaries(entries) {
  const monthsToUpdate = new Set(entries.map(e => e.month));

  for (const month of monthsToUpdate) {
    // Fetch all entries for this month
    const snapshot = await db.collection('labourEntries')
      .where('month', '==', month)
      .get();

    const summary = {
      totalHours: 0,
      totalCost: 0,
      employeeCount: new Set(),
      byLocation: {
        AKL: { hours: 0, cost: 0, employees: new Set() },
        PALMY: { hours: 0, cost: 0, employees: new Set() }
      },
      byCostCentre: {},
      byEmployee: {}
    };

    snapshot.forEach(doc => {
      const entry = doc.data();
      summary.totalHours += entry.totalHours;
      summary.totalCost += entry.totalCost;
      summary.employeeCount.add(entry.employeeName);

      // By location
      if (entry.location === 'AKL' || entry.location === 'PALMY') {
        summary.byLocation[entry.location].hours += entry.totalHours;
        summary.byLocation[entry.location].cost += entry.totalCost;
        summary.byLocation[entry.location].employees.add(entry.employeeName);
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
        summary.byEmployee[entry.employeeName] = { name: entry.employeeName, hours: 0, cost: 0 };
      }
      summary.byEmployee[entry.employeeName].hours += entry.totalHours;
      summary.byEmployee[entry.employeeName].cost += entry.totalCost;
    });

    // Calculate average rates
    Object.values(summary.byEmployee).forEach(emp => {
      emp.avgRate = emp.hours > 0 ? emp.cost / emp.hours : 0;
    });

    // Convert to arrays and counts
    summary.byEmployee = Object.values(summary.byEmployee).sort((a, b) => b.hours - a.hours);
    summary.employeeCount = summary.employeeCount.size;
    summary.byLocation.AKL.employees = summary.byLocation.AKL.employees.size;
    summary.byLocation.PALMY.employees = summary.byLocation.PALMY.employees.size;

    // Save summary
    await db.collection('labourSummaries').doc(month).set({
      ...summary,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Updated summary for ${month}`);
  }
}
