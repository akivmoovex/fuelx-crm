import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAccounts() {
  try {
    console.log('Checking accounts in database...');
    
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach(account => {
      console.log(`- ID: ${account.id}, Name: ${account.name}, Status: ${account.status}`);
    });
    
  } catch (error) {
    console.error('Error checking accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccounts(); 