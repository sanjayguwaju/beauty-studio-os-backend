const fs = require('fs');
let appTs = fs.readFileSync('src/app.ts', 'utf8');

const deletedModules = [
  'wards', 'citizens', 'correspondence', 'registration', 'complaints', 
  'onboarding', 'health-posts', 'inventory', 'schools', 'sifaris',
  'infra-projects', 'livestock', 'disaster-incidents', 'relief-applications',
  'finance', 'vital-events', 'tax-engine', 'citizen-portal'
];

let newAppTs = appTs.split('\n').filter(line => {
  return !deletedModules.some(m => line.includes(`/${m}/`)) && !deletedModules.some(m => line.includes(`"${m}"`));
}).join('\n');

fs.writeFileSync('src/app.ts', newAppTs);

let modelsIndex = fs.readFileSync('src/models/index.ts', 'utf8');
const deletedModels = [
  'Citizen', 'Complaint', 'Registration', 'Correspondence', 
  'VitalEvent', 'BudgetAllocation', 'RevenueCollection', 'InfraProject',
  'DisasterIncident', 'ReliefApplication', 'HealthPost', 'School',
  'LivestockRecord'
];

let newModelsIndex = modelsIndex.split('\n').filter(line => {
  return !deletedModels.some(m => line.includes(m));
}).join('\n');
fs.writeFileSync('src/models/index.ts', newModelsIndex);
