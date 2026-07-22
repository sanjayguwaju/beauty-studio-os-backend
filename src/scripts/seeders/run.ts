import { initSeeder, closeSeeder } from './utils';
import { seedMunicipalities } from './1-municipality.seed';
import { seedRoles } from './2-roles.seed';
import { seedUsers } from './3-users.seed';
import { seedBeautyStudio } from './10-beautystudio.seed';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runSeeders() {
  const clearDB = process.argv.includes('--clear');
  
  try {
    await initSeeder(clearDB);

    // 1. Foundation
    const municipality = await seedMunicipalities();
    await seedRoles(municipality);
    await seedUsers(municipality);

    // 2. Core Modules (Beauty Studio)
    await seedBeautyStudio(municipality);

    console.log('🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await closeSeeder();
  }
}

runSeeders();
