const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { Storage } = require('@google-cloud/storage');

const db = admin.firestore();
const storage = new Storage();

/**
 * Generates a PDF labour report and emails it to the accountant
 * 
 * Call via POST:
 * {
 *   "month": "2026-05" // YYYY-MM format
 * }
 */
exports.generateLabourReport = functions.https.onRequest(async (req, res) => {
  // CORS headers
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
    const { month } = req.body;

    if (!month) {
      res.status(400).json({ 
        error: 'Missing month parameter',
        example: { month: '2026-05' }
      });
      return;
    }

    console.log(`Generating labour report for ${month}`);

    // Fetch labour summary
    const summaryDoc = await db.collection('labourSummaries').doc(month).get();
    
    if (!summaryDoc.exists) {
      res.status(404).json({ 
        error: `No labour data found for ${month}`,
        message: 'Import data for this month first'
      });
      return;
    }

    const summary = summaryDoc.data();

    // Fetch detail entries
    const entriesSnapshot = await db.collection('labourEntries')
      .where('month', '==', month)
      .orderBy('date', 'desc')
      .limit(1000)
      .get();

    const entries = [];
    entriesSnapshot.forEach(doc => {
      entries.push(doc.data());
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(month, summary, entries);

    // Upload to Cloud Storage
    const bucket = storage.bucket(functions.config().firebase?.storageBucket || 'lucys-warehouse.appspot.com');
    const filename = `labour-reports/${month}-labour-report.pdf`;
    const file = bucket.file(filename);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf'
      }
    });

    console.log(`PDF uploaded to ${filename}`);

    // Get download URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Send email
    await sendEmail(month, summary, publicUrl);

    res.json({
      success: true,
      message: `Labour report for ${month} generated and emailed to team`,
      pdfUrl: publicUrl
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate PDF using PDFKit
 */
async function generatePDF(month, summary, entries) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `Labour Report - ${month}`,
        Author: "Lucy's Event Hire"
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Parse month for display
    const [year, monthNum] = month.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parseInt(monthNum) - 1];

    // Header
    doc.fontSize(24)
       .fillColor('#FF673E')
       .text("Lucy's Event Hire", { align: 'center' });
    
    doc.fontSize(18)
       .fillColor('#000000')
       .text(`Labour Report - ${monthName} ${year}`, { align: 'center' });
    
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16)
       .fillColor('#FF673E')
       .text('Monthly Summary');
    
    doc.moveDown(0.5);
    
    const summaryData = [
      ['Total Hours:', `${summary.totalHours.toFixed(1)}h`],
      ['Total Cost:', `$${summary.totalCost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`],
      ['Average Rate:', `$${(summary.totalCost / summary.totalHours).toFixed(2)}/hr`],
      ['Employees:', summary.employeeCount.toString()]
    ];

    summaryData.forEach(([label, value]) => {
      doc.fontSize(12)
         .fillColor('#000000')
         .text(label, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${value}`, { align: 'left' })
         .font('Helvetica');
    });

    doc.moveDown(2);

    // Location Breakdown
    doc.fontSize(16)
       .fillColor('#FF673E')
       .text('By Location');
    
    doc.moveDown(0.5);

    if (summary.byLocation) {
      const akl = summary.byLocation.AKL || { hours: 0, cost: 0 };
      const palmy = summary.byLocation.PALMY || { hours: 0, cost: 0 };

      doc.fontSize(12).fillColor('#000000');
      
      if (akl.hours > 0) {
        doc.text(`Auckland: ${akl.hours.toFixed(1)}h | $${akl.cost.toLocaleString('en-NZ')}`);
      }
      
      if (palmy.hours > 0) {
        doc.text(`Palmerston North: ${palmy.hours.toFixed(1)}h | $${palmy.cost.toLocaleString('en-NZ')}`);
      }
    }

    doc.moveDown(2);

    // Cost Centre Breakdown
    doc.fontSize(16)
       .fillColor('#FF673E')
       .text('By Cost Centre');
    
    doc.moveDown(0.5);

    if (summary.byCostCentre) {
      doc.fontSize(11).fillColor('#000000');
      
      const costCentres = Object.entries(summary.byCostCentre)
        .sort((a, b) => b[1].cost - a[1].cost);
      
      costCentres.forEach(([area, data]) => {
        const percentage = ((data.cost / summary.totalCost) * 100).toFixed(1);
        doc.text(`${area}: ${data.hours.toFixed(1)}h | $${data.cost.toLocaleString('en-NZ')} (${percentage}%)`);
      });
    }

    doc.addPage();

    // Top Employees
    doc.fontSize(16)
       .fillColor('#FF673E')
       .text('Top 10 Employees by Hours');
    
    doc.moveDown(0.5);

    if (summary.byEmployee) {
      doc.fontSize(10).fillColor('#000000');
      
      const topEmployees = summary.byEmployee.slice(0, 10);
      
      topEmployees.forEach((emp, idx) => {
        doc.text(`${idx + 1}. ${emp.name}: ${emp.hours.toFixed(1)}h | $${emp.cost.toLocaleString('en-NZ')} @ $${emp.avgRate.toFixed(2)}/hr`);
      });
    }

    doc.moveDown(2);

    // Detail Section (first 50 entries as sample)
    doc.fontSize(16)
       .fillColor('#FF673E')
       .text('Transaction Detail (Sample)');
    
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#000000');

    const sampleEntries = entries.slice(0, 50);
    
    sampleEntries.forEach(entry => {
      doc.text(
        `${entry.date} | ${entry.employeeName} | ${entry.areaName} | ${entry.totalHours}h | $${entry.totalCost.toFixed(2)}`,
        { width: 500 }
      );
    });

    if (entries.length > 50) {
      doc.moveDown();
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`... and ${entries.length - 50} more entries`);
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Generated on ${new Date().toLocaleDateString('en-NZ')} by Lucy's Labour Tracker`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    doc.end();
  });
}

/**
 * Send email via Gmail API
 */
async function sendEmail(month, summary, pdfUrl) {
  // Gmail OAuth credentials from config
  const gmailUser = functions.config().gmail?.user;
  const gmailPassword = functions.config().gmail?.app_password;

  if (!gmailUser || !gmailPassword) {
    throw new Error('Gmail credentials not configured. Run: firebase functions:config:set gmail.user="email" gmail.app_password="password"');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });

  const [year, monthNum] = month.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[parseInt(monthNum) - 1];

  const mailOptions = {
    from: `Lucy's Event Hire <${gmailUser}>`,
    to: 'hayden@lucysevents.com, lucy@lucysevents.com, danielle@cahill.co.nz',
    subject: `Lucy's Event Hire - ${monthName} ${year} Labour Report`,
    html: `
      <p>Hi team,</p>
      
      <p>Please find attached the labour report for ${monthName} ${year}.</p>
      
      <p><strong>Summary:</strong></p>
      <ul>
        <li>Total Hours: ${summary.totalHours.toFixed(1)}h</li>
        <li>Total Cost: $${summary.totalCost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</li>
        <li>Average Rate: $${(summary.totalCost / summary.totalHours).toFixed(2)}/hr</li>
      </ul>
      
      <p>You can download the full PDF report here: <a href="${pdfUrl}">Download Report</a></p>
      
      <p>Let me know if you need any additional details.</p>
      
      <p>Cheers,<br>Hayden</p>
    `,
    attachments: [
      {
        filename: `Lucys-Labour-${month}.pdf`,
        path: pdfUrl
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  
  return info;
}
