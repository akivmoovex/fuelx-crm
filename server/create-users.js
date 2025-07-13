const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('Creating missing users...');

    // Get the default tenant and business unit
    const defaultTenant = await prisma.tenant.findFirst({
      where: { name: 'FuelX HQ' }
    });

    const defaultBusinessUnit = await prisma.businessUnit.findFirst({
      where: { 
        name: 'Main Office',
        tenantId: defaultTenant.id
      }
    });

    if (!defaultTenant || !defaultBusinessUnit) {
      console.error('Default tenant or business unit not found. Please run setup first.');
      return;
    }

    // Users to create
    const users = [
      {
        firstName: 'Sales',
        lastName: 'Manager',
        email: 'manager@fuelx.com',
        password: 'manager123',
        role: 'SALES_MANAGER',
        status: 'active'
      },
      {
        firstName: 'Sales',
        lastName: 'Representative',
        email: 'rep@fuelx.com',
        password: 'rep123',
        role: 'SALES_REP',
        status: 'active'
      }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`✓ User ${userData.email} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          tenantId: defaultTenant.id,
          businessUnitId: defaultBusinessUnit.id,
          status: userData.status
        }
      });

      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log('Email: manager@fuelx.com');
    console.log('Password: manager123');
    console.log('Role: SALES_MANAGER');
    console.log('');
    console.log('Email: rep@fuelx.com');
    console.log('Password: rep123');
    console.log('Role: SALES_REP');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers(); 