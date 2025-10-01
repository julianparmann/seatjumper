import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin() {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'julianparmann@gmail.com' }
    });

    if (!existingUser) {
      console.log('❌ User julianparmann@gmail.com not found');
      console.log('Please sign in with Google first to create your account');
      return;
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: 'julianparmann@gmail.com' },
      data: { isAdmin: true }
    });

    console.log('✅ Successfully updated julianparmann@gmail.com');
    console.log('   User ID:', updatedUser.id);
    console.log('   Email:', updatedUser.email);
    console.log('   Admin Status:', updatedUser.isAdmin ? '✅ Admin' : '❌ Not Admin');
    console.log('   Name:', updatedUser.name || 'Not set');

  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run immediately
setAdmin().then(() => process.exit(0));