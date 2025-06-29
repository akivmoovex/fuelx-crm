import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting fresh database seeding...');

  // Create default tenant
  console.log('Creating default tenant...');
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: 'FuelX HQ',
      type: 'HQ',
      status: 'active',
      notes: 'Main headquarters for FuelX operations'
    },
  });

  // Create default business unit
  console.log('Creating default business unit...');
  const defaultBusinessUnit = await prisma.businessUnit.create({
    data: {
      name: 'Main Office',
      location: 'Lusaka',
      address: '123 Main Street',
      city: 'Lusaka',
      state: 'Lusaka',
      postalCode: '10101',
      country: 'Zambia',
      phone: '+260 123 456 789',
      email: 'info@fuelx.com',
      status: 'active',
      tenantId: defaultTenant.id,
    },
  });

  // Create default users
  console.log('Creating default users...');
  const users = [
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@fuelx.com',
      password: 'admin123',
      role: 'SYSTEM_ADMIN' as const,
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    },
    {
      firstName: 'Sales',
      lastName: 'Manager',
      email: 'sales.manager@fuelx.com',
      password: 'manager123',
      role: 'SALES_MANAGER' as const,
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    },
    {
      firstName: 'Sales',
      lastName: 'Representative',
      email: 'sales.rep@fuelx.com',
      password: 'rep123',
      role: 'SALES_REP' as const,
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    }
  ];

  for (const userData of users) {
    await prisma.user.create({
      data: userData,
    });
  }

  // Update business unit manager
  const salesManager = await prisma.user.findUnique({
    where: { email: 'sales.manager@fuelx.com' }
  });

  if (salesManager) {
    await prisma.businessUnit.update({
      where: { id: defaultBusinessUnit.id },
      data: { managerId: salesManager.id }
    });
  }

  console.log('Fresh database seeding completed successfully!');
  console.log('\nAvailable login credentials:');
  console.log('System Admin: admin@fuelx.com / admin123');
  console.log('Sales Manager: sales.manager@fuelx.com / manager123');
  console.log('Sales Rep: sales.rep@fuelx.com / rep123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

