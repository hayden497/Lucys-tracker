const admin = require('firebase-admin');

// Initialize Firebase Admin once for all functions
admin.initializeApp();

// Export functions
const { importDeputy } = require('./importDeputy');
const { generateLabourReport } = require('./generateLabourReport');

exports.importDeputy = importDeputy;
exports.generateLabourReport = generateLabourReport;
