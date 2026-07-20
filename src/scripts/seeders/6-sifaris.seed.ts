import { AppDocument } from '../../models/Document';
import { User } from '../../models/User';
import { IMunicipality } from '../../models/Municipality';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedSifaris(municipality: IMunicipality) {
  console.log('📜 Seeding Sifaris (Documents)...');

  const existingCount = await AppDocument.countDocuments({ municipalityId: municipality._id });
  if (existingCount > 0) {
    console.log(`⏩ Sifaris documents already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wardOfficers = await User.find({ municipalityId: municipality._id, email: /ward/ });
  
  if (wardOfficers.length === 0) {
    throw new Error('Ward Officers not found. Run users seeder first.');
  }

  const documentsToCreate = [];
  const TOTAL_DOCUMENTS = 30;

  for (let i = 0; i < TOTAL_DOCUMENTS; i++) {
    const officer = randomArrayItem(wardOfficers);
    
    documentsToCreate.push({
      documentType: 'sifaris',
      templateName: 'default',
      data: {
        applicantName: faker.person.fullName(),
        content: 'This is a mock sifaris document generated for testing purposes.',
        date: new Date().toLocaleDateString()
      },
      issuedBy: officer._id,
      municipalityId: municipality._id,
      verificationHash: faker.string.uuid(),
      issueDate: faker.date.recent(),
      status: randomArrayItem(['valid', 'valid', 'valid', 'revoked'])
    });
  }

  await AppDocument.insertMany(documentsToCreate);
  console.log(`✅ ${TOTAL_DOCUMENTS} Sifaris documents seeded successfully.`);
}
