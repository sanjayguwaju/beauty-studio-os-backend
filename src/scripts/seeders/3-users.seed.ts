import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Branch } from '../../models/Branch';
import { ITenant } from '../../models/Tenant';
import { generateNepaliPhone } from './utils';

export async function seedUsers(tenant: ITenant) {
  console.log('👤 Seeding Users...');

  const platformAdminRole = await Role.findOne({ tenantId: tenant._id, slug: 'platform_admin' });
  const studioAdminRole = await Role.findOne({ tenantId: tenant._id, slug: 'studio_admin' });
  const branchManagerRole = await Role.findOne({ tenantId: tenant._id, slug: 'branch_manager' });
  
  if (!platformAdminRole || !studioAdminRole || !branchManagerRole) {
    throw new Error('Roles not found. Run roles seeder first.');
  }

  // 1. Platform Admin
  const platformEmail = 'platform@beautyos.com';
  let platformAdmin = await User.findOne({ email: platformEmail });
  
  if (!platformAdmin) {
    await User.create({
      tenantId: tenant._id,
      name: 'Platform Administrator',
      nameNp: 'प्लेटफर्म प्रशासक',
      email: platformEmail,
      password: 'Password123!',
      phone: generateNepaliPhone(),
      roles: [platformAdminRole._id],
      rolesSlugs: ['platform_admin'],
      isActive: true,
      designation: 'Platform Owner'
    });
  }

  // 1.5 Studio Admin
  const adminEmail = 'admin@demo.beautyos.com';
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    await User.create({
      tenantId: tenant._id,
      name: 'Studio Administrator',
      nameNp: 'स्टुडियो प्रशासक',
      email: adminEmail,
      password: 'Password123!',
      phone: generateNepaliPhone(),
      roles: [studioAdminRole._id],
      rolesSlugs: ['studio_admin'],
      isActive: true,
      designation: 'Studio Owner'
    });
  }

  // 2. Branch Managers
  const branches = await Branch.find({ tenantId: tenant._id });
  
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const branchEmail = `branch${i+1}@demo.beautyos.com`;
    const existing = await User.findOne({ email: branchEmail });
    
    if (!existing) {
      await User.create({
        tenantId: tenant._id,
        branchId: branch._id,
        name: `Branch ${i+1} Manager`,
        nameNp: `शाखा ${i+1} प्रबन्धक`,
        email: branchEmail,
        password: 'Password123!',
        phone: generateNepaliPhone(),
        roles: [branchManagerRole._id],
        rolesSlugs: ['branch_manager'],
        isActive: true,
        designation: 'Manager'
      });
    }
  }

  console.log('✅ Users seeded successfully.');
}
