import { Citizen } from '../../models/Citizen';
import { Ward } from '../../models/Ward';
import { IMunicipality } from '../../models/Municipality';
import { faker } from '@faker-js/faker';
import { generateNepaliPhone, randomArrayItem } from './utils';

export async function seedCitizens(municipality: IMunicipality) {
  console.log('🧑‍🤝‍🧑 Seeding Citizens...');

  const existingCount = await Citizen.countDocuments({ municipalityId: municipality._id });
  
  if (existingCount > 0) {
    console.log(`⏩ Citizens already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wards = await Ward.find({ municipalityId: municipality._id });
  if (wards.length === 0) throw new Error('Wards not found. Run municipality seeder first.');

  const citizensToCreate = [];
  const TOTAL_CITIZENS = 50;

  for (let i = 0; i < TOTAL_CITIZENS; i++) {
    const gender = randomArrayItem(['male', 'female', 'other']);
    const fakerGender = gender === 'other' ? undefined : (gender as 'male' | 'female');
    const firstName = faker.person.firstName(fakerGender);
    const lastName = faker.person.lastName();
    const ward = randomArrayItem(wards);

    citizensToCreate.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      firstName,
      lastName,
      firstNameNp: firstName, // In a real app, this would be transliterated
      lastNameNp: lastName,
      gender,
      dateOfBirthAd: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      citizenshipNumber: `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10000, max: 99999 })}`,
      citizenshipIssuedDistrict: 'Kathmandu',
      nationalIdNumber: faker.string.numeric(10),
      phone: generateNepaliPhone(),
      email: faker.internet.email({ firstName, lastName }),
      permanentAddress: `${ward.officeAddress}, ${municipality.district}`,
      occupation: randomArrayItem(['Agriculture', 'Business', 'Student', 'Government Service', 'Foreign Employment']),
      isVerified: Math.random() > 0.2, // 80% verified
      status: randomArrayItem(['pending', 'approved', 'approved', 'approved', 'rejected']),
      isDeleted: false
    });
  }

  await Citizen.insertMany(citizensToCreate);
  console.log(`✅ ${TOTAL_CITIZENS} Citizens seeded successfully.`);
}
