import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Branch } from '../../models/Branch';
import { ITenant } from '../../models/Tenant';
import { generateNepaliPhone } from './utils';

export async function seedUsers(tenant: ITenant) {
  console.log('👤 Seeding Users...');

  const superAdminRole = await Role.findOne({ tenantId: tenant._id, slug: 'superadmin' });
  const branchManagerRole = await Role.findOne({ tenantId: tenant._id, slug: 'branch_manager' });
  
  if (!superAdminRole || !branchManagerRole) {
    throw new Error('Roles not found. Run roles seeder first.');
  }

  // 1. Super Admin
  const adminEmail = 'admin@demo.beautyos.com';
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    await User.create({
      tenantId: tenant._id,
      name: 'System Administrator',
      nameNp: 'प्रणाली प्रशासक',
      email: adminEmail,
      password: 'Password123!',
      phone: generateNepaliPhone(),
      roles: [superAdminRole._id],
      rolesSlugs: ['superadmin'],
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
