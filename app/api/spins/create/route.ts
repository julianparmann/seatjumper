import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPaymentIntent } from '@/lib/stripe';
import { pricingEngine } from '@/lib/pricing-engine';
import { breakScraper } from '@/lib/api/break-scraper';
import { ticketEvolution } from '@/lib/api/ticket-evolution';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      eventId,
      ticketQuantity,
      breakQuantity,
      riskProfile,
    } = body;

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch event details and calculate price
    const teEvent = await ticketEvolution.getEvent(event.ticketEvolutionId);
    const eventDetails = await ticketEvolution.convertToEventDetails(teEvent);

    const breakDate = new Date(event.datetime);
    breakDate.setDate(breakDate.getDate() + 1);
    const breaks = await breakScraper.getMockBreaks(event.sport, breakDate);

    const pricing = pricingEngine.calculateSpinPrice(
      eventDetails,
      breaks,
      ticketQuantity || 1,
      breakQuantity || 1,
      riskProfile
    );

    // Get a random break for the spin
    const selectedBreak = breaks[0];

    // Create spin record
    const spin = await prisma.spin.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        breakId: selectedBreak.id,
        ticketQuantity: ticketQuantity || 1,
        breakQuantity: breakQuantity || 1,
        totalCost: pricing.spinPrice,
        riskProfile: riskProfile || {},
      },
    });

    // Create payment intent
    const paymentIntent = await createPaymentIntent(pricing.spinPrice, {
      spinId: spin.id,
      userId: session.user.id,
      eventId: event.id,
    });

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        spinId: spin.id,
        amount: pricing.spinPrice,
        stripePaymentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      spin,
      order,
      paymentIntent: {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
      },
    });
  } catch (error) {
    console.error('Error creating spin:', error);
    return NextResponse.json(
      { error: 'Failed to create spin' },
      { status: 500 }
    );
  }
}