import mongoose from 'mongoose';
import { Person } from '../../models/Person';
import { Appointment } from '../../models/Appointment';
import { Enrollment } from '../../models/Enrollment';
import { Invoice } from '../../models/Invoice';
import { Commission } from '../../models/Commission';
import { Campaign } from '../../models/Campaign';

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

  // 4. Create Appointments
  const today = new Date();
  const pastAppt = await Appointment.create({
    tenantId,
    clientPersonId: client1._id,
    services: [{ name: 'Premium Haircut', durationMinutes: 60 }],
    startTime: new Date(today.getTime() - 86400000), // Yesterday
    endTime: new Date(today.getTime() - 82800000),
    status: 'completed',
    notes: 'Client loved the layers'
  });

  const upcomingAppt = await Appointment.create({
    tenantId,
    clientPersonId: client2._id,
    services: [{ name: 'Balayage Color', durationMinutes: 120 }],
    startTime: new Date(today.getTime() + 86400000), // Tomorrow
    endTime: new Date(today.getTime() + 93600000),
    status: 'pending',
    notes: 'First time coloring'
  });

  console.log('✅ Created Appointments.');

  // 5. Create Invoices
  const inv1 = await Invoice.create({
    tenantId,
    clientOrStudentPersonId: client1._id,
    type: 'service',
    amount: 150,
    status: 'paid',
    paymentMethod: 'card',
    items: [{ description: 'Premium Haircut', quantity: 1, unitPrice: 150, total: 150 }]
  });

  const inv2 = await Invoice.create({
    tenantId,
    clientOrStudentPersonId: student1._id,
    type: 'academy',
    amount: 800,
    status: 'pending',
    paymentMethod: 'cash',
    items: [{ description: 'Bridal Masterclass', quantity: 1, unitPrice: 800, total: 800 }]
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
