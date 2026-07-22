const fs = require('fs');

let authMid = fs.readFileSync('src/middleware/auth.middleware.ts', 'utf8');
// Fix duplicate tenantId keys if any
authMid = authMid.replace(/tenantId: (.*?),\n\s*tenantId: (.*?),/g, 'tenantId: $1,');
fs.writeFileSync('src/middleware/auth.middleware.ts', authMid);

let authCtrl = fs.readFileSync('src/modules/auth/auth.controller.ts', 'utf8');
authCtrl = authCtrl.replace(/tenantId: (.*?),\n\s*tenantId: (.*?),/g, 'tenantId: $1,');
// fix tenantId undefined
authCtrl = authCtrl.replace(/tenantId: (.*?) \|\| "",/g, 'tenantId: $1 || "default-tenant",');
fs.writeFileSync('src/modules/auth/auth.controller.ts', authCtrl);

let dash = fs.readFileSync('src/modules/dashboard/dashboard.controller.ts', 'utf8');
const deletedDashModels = [
  'Citizen', 'Complaint', 'Registration', 'BudgetAllocation', 'RevenueCollection', 
  'InfraProject', 'DisasterIncident', 'ReliefApplication', 'HealthPost', 'School', 'LivestockRecord'
];
let newDash = dash.split('\n').filter(line => {
  return !deletedDashModels.some(m => line.includes(m));
}).join('\n');
fs.writeFileSync('src/modules/dashboard/dashboard.controller.ts', newDash);
