import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixLocationReferences() {
  console.log('Fixing location references in route files...');

  try {
    const routesDir = path.join(__dirname, 'src', 'routes');
    const files = ['users.ts', 'accounts.ts'];

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace location: true with city: true
        content = content.replace(/select: \{ name: true, location: true \}/g, 'select: { name: true, city: true }');
        
        fs.writeFileSync(filePath, content);
        console.log(`✓ Fixed ${file}`);
      }
    }

    console.log('All location references fixed!');
  } catch (error) {
    console.error('Error fixing location references:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLocationReferences(); 