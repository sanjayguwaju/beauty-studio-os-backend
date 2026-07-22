const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/municipalityId/g, 'tenantId');
    content = content.replace(/wardId/g, 'branchId');
    content = content.replace(/Municipality/g, 'Tenant');
    content = content.replace(/Ward/g, 'Branch');
    content = content.replace(/wardNumber/g, 'branchCode');
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + filePath);
    }
  }
});
