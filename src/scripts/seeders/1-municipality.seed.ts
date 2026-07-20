import { Municipality } from '../../models/Municipality';
import { Ward } from '../../models/Ward';
import { DEMO_TENANT_ID, generateNepaliPhone } from './utils';

export async function seedMunicipalities() {
  console.log('🏢 Seeding Municipalities & Wards...');

  // 1. Create the Default Demo Municipality
  let municipality = await Municipality.findOne({ subdomain: DEMO_TENANT_ID });
  
  if (!municipality) {
    municipality = await Municipality.create({
      name: 'Demo Municipality',
      nameNp: 'डेमो नगरपालिका',
      code: 'DEMO-01',
      subdomain: DEMO_TENANT_ID,
      district: 'Kathmandu',
      province: 'Bagmati',
      type: 'urban',
      totalWards: 5,
      contactEmail: 'info@demo.gov.np',
      contactPhone: generateNepaliPhone(),
      address: 'Kathmandu, Nepal',
      status: 'approved',
      isActive: true
    });
  }

  // 2. Create Wards for this Municipality
  const existingWards = await Ward.countDocuments({ municipalityId: municipality._id });
  
  if (existingWards === 0) {
    const wardsToCreate = [];
    for (let i = 1; i <= municipality.totalWards; i++) {
      wardsToCreate.push({
        municipalityId: municipality._id,
        wardNumber: i,
        nameNp: `वडा नं ${i}`,
        officeAddress: `Ward ${i} Office, Demo`,
        contactPhone: generateNepaliPhone(),
        population: Math.floor(Math.random() * (5000 - 1000 + 1) + 1000), // 1000 to 5000
        isActive: true
      });
    }
    await Ward.insertMany(wardsToCreate);
    console.log(`✅ Created ${municipality.totalWards} wards for ${municipality.name}.`);
  } else {
    console.log(`⏩ Wards already exist for ${municipality.name}. Skipping.`);
  }

  return municipality;
}
