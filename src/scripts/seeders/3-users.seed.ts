import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Ward } from '../../models/Ward';
import { IMunicipality } from '../../models/Municipality';
import { SystemRole } from '../../types';
import { generateNepaliPhone } from './utils';

export async function seedUsers(municipality: IMunicipality) {
  console.log('👤 Seeding Users...');

  const superAdminRole = await Role.findOne({ municipalityId: municipality._id, slug: 'superadmin' });
  const wardOfficerRole = await Role.findOne({ municipalityId: municipality._id, slug: 'ward_officer' });
  
  if (!superAdminRole || !wardOfficerRole) {
    throw new Error('Roles not found. Run roles seeder first.');
  }

  // 1. Super Admin
  const adminEmail = 'admin@demo.gov.np';
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    await User.create({
      municipalityId: municipality._id,
      name: 'System Administrator',
      nameNp: 'प्रणाली प्रशासक',
      email: adminEmail,
      password: 'Password123!',
      phone: generateNepaliPhone(),
      roles: [superAdminRole._id],
      rolesSlugs: ['superadmin'],
      isActive: true,
      designation: 'IT Officer'
    });
  }

  // 2. Ward Officers
  const wards = await Ward.find({ municipalityId: municipality._id });
  
  for (const ward of wards) {
    const wardEmail = `ward${ward.wardNumber}@demo.gov.np`;
    const existing = await User.findOne({ email: wardEmail });
    
    if (!existing) {
      await User.create({
        municipalityId: municipality._id,
        wardId: ward._id,
        name: `Ward ${ward.wardNumber} Officer`,
        nameNp: `वडा ${ward.wardNumber} अधिकृत`,
        email: wardEmail,
        password: 'Password123!',
        phone: generateNepaliPhone(),
        roles: [wardOfficerRole._id],
        rolesSlugs: ['ward_officer'],
        isActive: true,
        designation: 'Ward Secretary'
      });
    }
  }

  console.log('✅ Users seeded successfully.');
}
