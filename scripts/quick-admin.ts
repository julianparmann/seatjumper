import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const user = await prisma.user.update({
      where: { email: 'julianparmann@gmail.com' },
      data: { isAdmin: true }
    });
    console.log('✅ Success! julianparmann@gmail.com is now an admin');
    console.log('User ID:', user.id);
    console.log('Admin status:', user.isAdmin);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();