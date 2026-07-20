import { InfraProject } from '../../models/InfraProject';
import { InfraMilestone } from '../../models/InfraMilestone';
import { Ward } from '../../models/Ward';
import { IMunicipality } from '../../models/Municipality';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedInfra(municipality: IMunicipality) {
  console.log('🏗️  Seeding Infrastructure Projects...');

  const existingCount = await InfraProject.countDocuments({ municipalityId: municipality._id });
  if (existingCount > 0) {
    console.log(`⏩ Infra projects already exist for ${municipality.name}. Skipping.`);
    return;
  }

  const wards = await Ward.find({ municipalityId: municipality._id });
  if (wards.length === 0) throw new Error('Wards not found.');

  const TOTAL_PROJECTS = 15;
  const projects = [];

  for (let i = 0; i < TOTAL_PROJECTS; i++) {
    const ward = randomArrayItem(wards);
    
    projects.push({
      municipalityId: municipality._id,
      wardId: ward._id,
      name: `Ward ${ward.wardNumber} ${faker.commerce.productName()} Construction`,
      nameNp: `वडा नं ${ward.wardNumber} निर्माण`,
      budget: faker.number.int({ min: 500000, max: 10000000 }),
      contractor: faker.company.name(),
      status: randomArrayItem(['planned', 'ongoing', 'ongoing', 'completed', 'delayed']),
      startDateBs: '2080-04-01',
      expectedEndDateBs: '2081-03-30',
      percentComplete: faker.number.int({ min: 0, max: 100 }),
      contractorContact: faker.string.numeric(10),
      fiscalYear: '2080/81',
      projectSector: 'capital',
      implementationMedium: randomArrayItem(['upabhokta_samiti', 'contractor']),
      municipalityBudget: faker.number.int({ min: 300000, max: 8000000 }),
      costSharingBudget: faker.number.int({ min: 50000, max: 1000000 }),
      agreementDateBs: '2080-03-15',
      targetCompletionDateBs: '2081-03-30',
      benefitedHouseholds: faker.number.int({ min: 20, max: 500 }),
      isDeleted: false
    });
  }

  const createdProjects = await InfraProject.insertMany(projects);

  // Add milestones
  const milestones = [];
  for (const project of createdProjects) {
    milestones.push({
      projectId: project._id,
      description: 'Site Clearance and Foundation',
      targetDateBs: '2080-05-01',
      completionDateBs: project.percentComplete > 20 ? '2080-04-28' : undefined,
      evidenceUrls: []
    });
    
    milestones.push({
      projectId: project._id,
      description: 'Superstructure Completion',
      targetDateBs: '2080-09-01',
      completionDateBs: project.percentComplete > 60 ? '2080-08-15' : undefined,
      evidenceUrls: []
    });
  }

  await InfraMilestone.insertMany(milestones);
  console.log(`✅ ${TOTAL_PROJECTS} Infra Projects & Milestones seeded successfully.`);
}
