import mongoose from 'mongoose';
import { Person } from '../../models/Person';
import { Appointment } from '../../models/Appointment';
import { Enrollment } from '../../models/Enrollment';
import { Invoice } from '../../models/Invoice';
import { Commission } from '../../models/Commission';
import { Campaign } from '../../models/Campaign';
import { ServiceCatalog } from '../../models/ServiceCatalog';
import { Branch } from '../../models/Branch';

export async function seedBeautyStudio(municipality: any) {
  console.log('💅 Seeding Beauty Studio Data...');
  const tenantId = municipality._id;

  // 1. Create Staff (Person)
  const staff1 = await Person.create({
    tenantId,
    fullName: 'Sarah Styles',
    email: 'sarah@beautystudio.com',
    phone: '9800000001',
    authProvider: 'auth0'
  });
  
  const staff2 = await Person.create({
    tenantId,
    fullName: 'Mike Color',
    email: 'mike@beautystudio.com',
    phone: '9800000002',
    authProvider: 'auth0'
  });

  // 2. Create Clients (Person)
  const client1 = await Person.create({
    tenantId,
    fullName: 'Emma Watson',
    email: 'emma@gmail.com',
    phone: '9800000003',
    authProvider: 'otp'
  });

  const client2 = await Person.create({
    tenantId,
    fullName: 'Jessica Alba',
    email: 'jess@gmail.com',
    phone: '9800000004',
    authProvider: 'otp'
  });

  // 3. Create Students (Person)
  const student1 = await Person.create({
    tenantId,
    fullName: 'Jane Doe',
    email: 'jane@student.com',
    phone: '9800000005',
    authProvider: 'otp'
  });

  console.log('✅ Created Beauty Studio People (Staff, Clients, Students).');

  // 3.5 Create Services
  const service1 = await ServiceCatalog.create({
    tenantId,
    category: 'hair',
    name: 'Premium Haircut',
    durationMinutes: 60,
    priceSolo: 150,
    active: true
  });

  const service2 = await ServiceCatalog.create({
    tenantId,
    category: 'hair',
    name: 'Balayage Color',
    durationMinutes: 120,
    priceSolo: 250,
    active: true
  });

  // Get a branch
  const branch = await Branch.findOne({ tenantId });
  if (!branch) throw new Error('No branch found for seeding appointments');

  // 4. Create Appointments
  const today = new Date();
  const pastAppt = await Appointment.create({
    tenantId,
    branchId: branch._id,
    clientPersonId: client1._id,
    serviceId: service1._id,
    practitionerPersonId: staff1._id,
    practitionerRole: 'stylist',
    scheduledStart: new Date(today.getTime() - 86400000), // Yesterday
    scheduledEnd: new Date(today.getTime() - 82800000),
    status: 'completed',
  });

  const upcomingAppt = await Appointment.create({
    tenantId,
    branchId: branch._id,
    clientPersonId: client2._id,
    serviceId: service2._id,
    practitionerPersonId: staff2._id,
    practitionerRole: 'stylist',
    scheduledStart: new Date(today.getTime() + 86400000), // Tomorrow
    scheduledEnd: new Date(today.getTime() + 93600000),
    status: 'booked',
  });

  // 5. Create Invoices
  const inv1 = await Invoice.create({
    tenantId,
    branchId: branch._id,
    clientOrStudentPersonId: client1._id,
    appointmentId: pastAppt._id,
    type: 'service',
    totalAmount: 150,
    status: 'paid',
    lineItems: [{ description: 'Premium Haircut', amount: 150 }]
  });

  const inv2 = await Invoice.create({
    tenantId,
    branchId: branch._id,
    clientOrStudentPersonId: student1._id,
    type: 'course_fee',
    totalAmount: 800,
    status: 'unpaid',
    lineItems: [{ description: 'Bridal Masterclass', amount: 800 }]
  });

  console.log('✅ Created Invoices.');

  // 6. Create Commissions
  await Commission.create({
    staffPersonId: staff1._id,
    appointmentId: pastAppt._id,
    amount: 60, // e.g. 40% of 150
    basis: 'solo_service',
    paid: false
  });

  console.log('✅ Created Commissions.');

  // 7. Create Campaigns
  await Campaign.create({
    tenantId,
    name: 'Holiday Special 2026',
    targetAudience: 'all_clients',
    messageTemplate: 'Hi {{name}}, book your holiday glow-up now for 20% off!',
    status: 'completed',
    totalTarget: 150,
    sentCount: 150
  });
  
  await Campaign.create({
    tenantId,
    name: 'We Miss You',
    targetAudience: 'inactive_clients',
    messageTemplate: 'Hi {{name}}, it has been a while! Come back for a free consultation.',
    status: 'sending',
    totalTarget: 45,
    sentCount: 12
  });

  console.log('✅ Created Marketing Campaigns.');
}
