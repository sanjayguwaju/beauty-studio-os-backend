const fs = require('fs');
let appTs = fs.readFileSync('src/app.ts', 'utf8');

const deletedRouteVars = [
  'wardRoutes', 'citizenRoutes', 'correspondenceRoutes', 'registrationRoutes', 'complaintRoutes', 
  'onboardingRoutes', 'healthPostRoutes', 'healthInventoryRouter', 'educationInventoryRouter',
  'agricultureInventoryRouter', 'schoolRoutes', 'infraProjectRoutes', 'livestockRoutes',
  'disasterIncidentRoutes', 'reliefApplicationRoutes', 'budgetRouter', 'revenueRouter',
  'sifarisRoutes', 'vitalEventsRoutes', 'taxEngineRoutes', 'citizenPortalRoutes'
];

let newAppTs = appTs.split('\n').filter(line => {
  return !deletedRouteVars.some(m => line.includes(m));
}).join('\n');

fs.writeFileSync('src/app.ts', newAppTs);
