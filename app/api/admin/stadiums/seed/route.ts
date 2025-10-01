import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { allegiantStadiumConfig } from '@/data/stadiums/allegiant-coordinates';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if Allegiant Stadium already exists
    const existingStadium = await prisma.stadium.findUnique({
      where: { name: allegiantStadiumConfig.name }
    });

    if (existingStadium) {
      // Update existing stadium
      const updated = await prisma.stadium.update({
        where: { name: allegiantStadiumConfig.name },
        data: {
          displayName: allegiantStadiumConfig.displayName,
          city: allegiantStadiumConfig.city,
          state: allegiantStadiumConfig.state,
          imagePath: allegiantStadiumConfig.imagePath,
          imageWidth: allegiantStadiumConfig.imageWidth,
          imageHeight: allegiantStadiumConfig.imageHeight,
          sectionConfig: allegiantStadiumConfig.sections as any,
          isActive: true,
        }
      });

      return NextResponse.json({
        message: 'Allegiant Stadium updated',
        stadium: updated
      });
    } else {
      // Create new stadium
      const created = await prisma.stadium.create({
        data: {
          name: allegiantStadiumConfig.name,
          displayName: allegiantStadiumConfig.displayName,
          city: allegiantStadiumConfig.city,
          state: allegiantStadiumConfig.state,
          imagePath: allegiantStadiumConfig.imagePath,
          imageWidth: allegiantStadiumConfig.imageWidth,
          imageHeight: allegiantStadiumConfig.imageHeight,
          sectionConfig: allegiantStadiumConfig.sections as any,
          isActive: true,
        }
      });

      return NextResponse.json({
        message: 'Allegiant Stadium created',
        stadium: created
      });
    }
  } catch (error) {
    console.error('Error seeding stadium:', error);
    return NextResponse.json({ error: 'Failed to seed stadium' }, { status: 500 });
  }
}