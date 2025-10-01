import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    });

    console.log('\n📋 Users in database:\n');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
      console.log(`Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('---');
    });

    if (users.length === 0) {
      console.log('No users found in database');
    }
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();