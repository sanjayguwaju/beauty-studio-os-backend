import { Role } from '../../models/Role';
import { ITenant } from '../../models/Tenant';
import { SystemRole } from '../../types';

export async function seedRoles(tenant: ITenant) {
  console.log('🔐 Seeding Roles...');

  const roles = [
    {
      tenantId: tenant._id,
      name: 'Platform Admin',
      nameNp: 'प्लेटफर्म एडमिन',
      slug: 'platform_admin',
      description: 'Global system administrator',
      isSystem: true,
      level: 0,
      permissions: [{ module: 'all', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Studio Admin',
      nameNp: 'स्टुडियो एडमिन',
      slug: 'studio_admin',
      description: 'Owner/Admin of the entire studio',
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
