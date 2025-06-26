import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create an admin user
  await prisma.user.upsert({
    where: { email: 'admin@fuelx.com' },
    update: {},
    create: {
      email: 'admin@fuelx.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      password: 'admin123', // In production, hash this!
    },
  });

  // Add a sample customer
  await prisma.customer.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      company: 'Tech Corp',
      status: 'customer',
      source: 'Website',
      notes: 'Interested in enterprise solution',
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
