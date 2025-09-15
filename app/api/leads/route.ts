import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already exists
    const existingLead = await prisma.lead.findUnique({
      where: { email }
    });

    if (existingLead) {
      // Update existing lead to show renewed interest
      await prisma.lead.update({
        where: { email },
        data: {
          updatedAt: new Date(),
          status: existingLead.status === 'UNSUBSCRIBED' ? 'PENDING' : existingLead.status
        }
      });

      return NextResponse.json({
        message: 'You\'re already on the list! We\'ll notify you when we launch.'
      });
    }

    // Create new lead
    const lead = await prisma.lead.create({
      data: {
        email,
        source: 'landing'
      }
    });

    return NextResponse.json({
      message: 'Successfully added to waiting list!',
      lead: { id: lead.id }
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: 'Failed to save email. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // This endpoint requires admin authentication
    // For now, we'll return an error
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}