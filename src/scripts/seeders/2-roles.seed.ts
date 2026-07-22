import { Role } from '../../models/Role';
import { ITenant } from '../../models/Tenant';
import { SystemRole } from '../../types';

export async function seedRoles(tenant: ITenant) {
  console.log('🔐 Seeding Roles...');

  const roles = [
    {
      tenantId: tenant._id,
      name: 'Super Admin',
      nameNp: 'सुपर एडमिन',
      slug: 'superadmin',
      description: 'Full access to studio settings and data',
      isSystem: true,
      level: 1,
      permissions: [{ module: 'all', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Branch Manager',
      nameNp: 'शाखा प्रबन्धक',
      slug: 'branch_manager',
      description: 'Manager of a specific branch',
      isSystem: true,
      level: 2,
      permissions: [{ module: 'all', action: 'read' }, { module: 'appointments', action: 'manage' }, { module: 'staff', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Staff',
      nameNp: 'कर्मचारी',
      slug: 'staff',
      description: 'Service provider at a branch',
      isSystem: true,
      level: 3,
      permissions: [{ module: 'appointments', action: 'read' }]
    }
  ];

  for (const roleData of roles) {
    const existing = await Role.findOne({ tenantId: tenant._id, slug: roleData.slug });
    if (!existing) {
      await Role.create(roleData);
    }
  }

  console.log('✅ Roles seeded successfully.');
}
