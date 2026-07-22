import { Tenant } from '../../models/Tenant';
import { Branch } from '../../models/Branch';
import { DEMO_TENANT_ID, generateNepaliPhone } from './utils';

export async function seedTenants() {
  console.log('🏢 Seeding Tenants & Branches...');

  // 1. Create the Default Demo Tenant
  let tenant = await Tenant.findOne({ subdomain: DEMO_TENANT_ID });
  
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Demo Beauty Studio',
      nameNp: 'डेमो ब्यूटी स्टुडियो',
      code: 'DEMO-01',
      subdomain: DEMO_TENANT_ID,
      district: 'Kathmandu',
      province: 'Bagmati',
      type: 'studio',
      totalBranches: 3,
      contactEmail: 'info@demo.beautyos.com',
      contactPhone: generateNepaliPhone(),
      address: 'Kathmandu, Nepal',
      status: 'approved',
      isActive: true
    });
  }

  // 2. Create Branches for this Tenant
  const existingBranches = await Branch.countDocuments({ tenantId: tenant._id });
  
  if (existingBranches === 0) {
    const branchesToCreate = [];
    for (let i = 1; i <= tenant.totalBranches; i++) {
      branchesToCreate.push({
        tenantId: tenant._id,
        name: `Branch ${i}`,
        branchCode: `BR-0${i}`,
        address: `Branch ${i} Office, Demo`,
        contactPhone: generateNepaliPhone(),
        isActive: true
      });
    }
    await Branch.insertMany(branchesToCreate);
    console.log(`✅ Created ${tenant.totalBranches} branches for ${tenant.name}.`);
  } else {
    console.log(`⏩ Branches already exist for ${tenant.name}. Skipping.`);
  }

  return tenant;
}
