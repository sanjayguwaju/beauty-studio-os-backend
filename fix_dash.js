const fs = require('fs');
let appTs = fs.readFileSync('src/app.ts', 'utf8');
appTs = appTs.replace(/import dashboardRoutes from "\.\/modules\/dashboard\/dashboard\.routes";/g, '');
appTs = appTs.replace(/v1\.use\("\/dashboard",\s*dashboardRoutes\);/g, '');
fs.writeFileSync('src/app.ts', appTs);
