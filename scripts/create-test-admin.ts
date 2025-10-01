import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        password: hashedPassword,
        isAdmin: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Test admin created successfully!');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('   User ID:', admin.id);
    console.log('   Is Admin:', admin.isAdmin);

  } catch (error) {
    console.error('Error creating test admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();