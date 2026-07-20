import { Complaint } from '../../models/Complaint';
import { Ward } from '../../models/Ward';
import { IMunicipality } from '../../models/Municipality';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedComplaints(municipality: IMunicipality) {
  console.log('🗣️  Seeding Complaints...');

  const existingCount = await Complaint.countDocuments({ municipalityId: municipality._id });
  if (existingCount > 0) {
    console.log(`⏩ Complaints already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wards = await Ward.find({ municipalityId: municipality._id });
  
  const TOTAL_COMPLAINTS = 25;
  const complaints = [];
  let trackingNumber = 1000;

  for (let i = 0; i < TOTAL_COMPLAINTS; i++) {
    const isAnonymous = Math.random() > 0.7;
    const ward = randomArrayItem(wards);
    
    complaints.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      trackingNumber: `CMP-${new Date().getFullYear()}-${trackingNumber++}`,
      category: randomArrayItem(['Infrastructure', 'Public Service', 'Sanitation', 'Corruption', 'Other']),
      subject: faker.lorem.sentence(4),
      description: faker.lorem.paragraph(),
      isAnonymous,
      complainantName: isAnonymous ? undefined : faker.person.fullName(),
      complainantPhone: isAnonymous ? undefined : faker.string.numeric(10),
      status: randomArrayItem(['received', 'under_investigation', 'resolved', 'closed']),
      priority: randomArrayItem(['low', 'normal', 'high', 'urgent']),
      isDeleted: false
    });
  }

  await Complaint.insertMany(complaints);
  console.log(`✅ ${TOTAL_COMPLAINTS} Complaints seeded successfully.`);
}
