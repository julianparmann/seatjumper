import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@seatjumper.com',
        password: hashedPassword,
        name: 'Admin',
        isAdmin: true,
        emailVerified: new Date(),
      },
    });

    console.log('Admin user created successfully:', admin.email);
    console.log('Login with:');
    console.log('Email: admin@seatjumper.com');
    console.log('Password: admin123');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();