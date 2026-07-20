import { RevenueCollection } from '../../models/RevenueCollection';
import { TaxRule } from '../../models/TaxRule';
import { Ward } from '../../models/Ward';
import { User } from '../../models/User';
import { IMunicipality } from '../../models/Municipality';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedRevenue(municipality: IMunicipality) {
  console.log('💰 Seeding Revenue & Tax Rules...');

  const existingCount = await RevenueCollection.countDocuments({ municipalityId: municipality._id });
  if (existingCount > 0) {
    console.log(`⏩ Revenue records already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wards = await Ward.find({ municipalityId: municipality._id });
  const users = await User.find({ municipalityId: municipality._id });
  
  if (wards.length === 0 || users.length === 0) {
    throw new Error('Wards or Users not found. Run previous seeders first.');
  }

  // 1. Tax Rules
  const taxRules = [
    {
      municipalityId: municipality._id,
      name: 'Residential Property Tax',
      taxType: 'property',
      baseRate: 500,
      multiplier: 1,
      fiscalYear: '2080/81',
      isActive: true
    },
    {
      municipalityId: municipality._id,
      name: 'Commercial Property Tax',
      taxType: 'property',
      baseRate: 500,
      multiplier: 2.5,
      fiscalYear: '2080/81',
      isActive: true
    },
    {
      municipalityId: municipality._id,
      name: 'Retail Business Registration',
      taxType: 'business',
      baseRate: 2000,
      multiplier: 1,
      fiscalYear: '2080/81',
      isActive: true
    }
  ];
  await TaxRule.insertMany(taxRules);

  // 2. Revenue Collection Records
  const revenues = [];
  const TOTAL_RECORDS = 50;
  let receiptCounter = 1000;

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const ward = randomArrayItem(wards);
    const collector = randomArrayItem(users);
    
    revenues.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      revenueType: randomArrayItem(['property_tax', 'business_registration', 'rental_fee', 'service_fee', 'other']),
      payerName: faker.person.fullName(),
      payerPhone: faker.string.numeric(10),
      amountNpr: faker.number.int({ min: 100, max: 15000 }),
      receiptNumber: `REC-2080-${receiptCounter++}`,
      dateBs: `2080-${faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0')}-${faker.number.int({ min: 1, max: 28 }).toString().padStart(2, '0')}`,
      collectedBy: collector._id
    });
  }

  await RevenueCollection.insertMany(revenues);
  console.log(`✅ ${TOTAL_RECORDS} Revenue records seeded successfully.`);
}
