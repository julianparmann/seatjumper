import { NextRequest, NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing-engine';
import { breakScraper } from '@/lib/api/break-scraper';
import { ticketEvolution } from '@/lib/api/ticket-evolution';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      ticketQuantity,
      breakQuantity,
      riskProfile,
    } = body;

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch ticket details from TE API
    const teEvent = await ticketEvolution.getEvent(event.ticketEvolutionId);
    const eventDetails = await ticketEvolution.convertToEventDetails(teEvent);

    // Fetch available breaks for the day after the event
    const eventDate = new Date(event.datetime);
    const breakDate = new Date(eventDate);
    breakDate.setDate(breakDate.getDate() + 1);

    // Get breaks (use mock data for MVP)
    const breaks = await breakScraper.getMockBreaks(event.sport, breakDate);

    if (breaks.length === 0) {
      return NextResponse.json(
        { error: 'No breaks available for this event' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = pricingEngine.calculateSpinPrice(
      eventDetails,
      breaks,
      ticketQuantity || 1,
      breakQuantity || 1,
      riskProfile
    );

    // Calculate win probabilities
    const probabilities = pricingEngine.calculateWinProbabilities(
      pricing.potentialMinValue,
      pricing.potentialMaxValue,
      pricing.spinPrice
    );

    return NextResponse.json({
      pricing,
      probabilities,
      availableBreaks: breaks.length,
      availableTickets: eventDetails.inventoryCount,
    });
  } catch (error) {
    console.error('Error calculating spin price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate spin price' },
      { status: 500 }
    );
  }
}