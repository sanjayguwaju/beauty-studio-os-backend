import { BirthRegistration, DeathRegistration } from '../../models/Registration';
import { Ward } from '../../models/Ward';
import { IMunicipality } from '../../models/Municipality';
import { Citizen } from '../../models/Citizen';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedRegistrations(municipality: IMunicipality) {
  console.log('📝 Seeding Registrations (Births & Deaths)...');

  const existingBirths = await BirthRegistration.countDocuments({ municipalityId: municipality._id });
  if (existingBirths > 0) {
    console.log(`⏩ Registrations already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wards = await Ward.find({ municipalityId: municipality._id });
  const citizens = await Citizen.find({ municipalityId: municipality._id }).limit(20);

  if (wards.length === 0 || citizens.length === 0) {
    throw new Error('Wards or Citizens not found. Run previous seeders first.');
  }

  const NUM_REGISTRATIONS = 20;
  
  // 1. Births
  const births = [];
  for (let i = 0; i < NUM_REGISTRATIONS; i++) {
    const ward = randomArrayItem(wards);
    const father = randomArrayItem(citizens);
    const mother = randomArrayItem(citizens);

    births.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      registrationNumber: `B-${faker.string.alphanumeric(6).toUpperCase()}`,
      registrationDateBs: '2080-01-01',
      registrationDateAd: new Date(),
      status: randomArrayItem(['pending', 'verified', 'certificate_issued']),
      childName: faker.person.firstName(),
      childNameNp: 'बच्चा',
      dateOfBirthBs: '2080-01-01',
      dateOfBirthAd: faker.date.recent(),
      gender: randomArrayItem(['male', 'female']),
      fatherName: `${father.firstName} ${father.lastName}`,
      fatherCitizenshipNo: father.citizenshipNumber,
      motherName: `${mother.firstName} ${mother.lastName}`,
      motherCitizenshipNo: mother.citizenshipNumber,
      fatherId: father._id,
      motherId: mother._id,
    });
  }
  await BirthRegistration.insertMany(births);

  // 2. Deaths
  const deaths = [];
  for (let i = 0; i < 10; i++) {
    const ward = randomArrayItem(wards);
    const deceased = randomArrayItem(citizens);
    const informant = randomArrayItem(citizens);

    deaths.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      registrationNumber: `D-${faker.string.alphanumeric(6).toUpperCase()}`,
      registrationDateBs: '2080-02-01',
      status: randomArrayItem(['pending', 'verified', 'certificate_issued']),
      deceasedName: `${deceased.firstName} ${deceased.lastName}`,
      dateOfDeathBs: '2080-01-15',
      dateOfDeathAd: faker.date.recent(),
      gender: deceased.gender,
      ageAtDeath: String(faker.number.int({ min: 1, max: 90 })),
      causeOfDeath: 'Natural',
      informantName: `${informant.firstName} ${informant.lastName}`,
      informantRelation: 'Son/Daughter',
      citizenId: deceased._id,
    });
  }
  await DeathRegistration.insertMany(deaths);

  console.log(`✅ ${NUM_REGISTRATIONS} Births and 10 Deaths seeded successfully.`);
}
