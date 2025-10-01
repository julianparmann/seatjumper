import { NextRequest, NextResponse } from 'next/server';
import { ticketEvolution } from '@/lib/api/ticket-evolution';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Ticket Evolution API...');
    console.log('API Token:', process.env.TICKET_EVOLUTION_API_TOKEN ? 'Set' : 'Not set');
    console.log('API Secret:', process.env.TICKET_EVOLUTION_API_SECRET ? 'Set' : 'Not set');
    console.log('Office ID:', process.env.TICKET_EVOLUTION_OFFICE_ID ? 'Set' : 'Not set');
    console.log('Environment:', process.env.TICKET_EVOLUTION_ENV || 'sandbox');

    // Try to fetch some events
    const response = await ticketEvolution.searchEvents({
      per_page: 5,
      occurs_at_gte: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      data: {
        totalEvents: response.total_entries || 0,
        events: response.events?.slice(0, 3).map((e: any) => ({
          id: e.id,
          name: e.name,
          venue: e.venue?.name,
          date: e.occurs_at,
        })) || [],
      },
      environment: process.env.TICKET_EVOLUTION_ENV || 'sandbox',
    });
  } catch (error: any) {
    console.error('Ticket Evolution API test failed:', error);

    return NextResponse.json({
      success: false,
      message: 'API connection failed',
      error: error.message || 'Unknown error',
      details: {
        apiTokenSet: !!process.env.TICKET_EVOLUTION_API_TOKEN,
        apiSecretSet: !!process.env.TICKET_EVOLUTION_API_SECRET,
        officeIdSet: !!process.env.TICKET_EVOLUTION_OFFICE_ID,
        environment: process.env.TICKET_EVOLUTION_ENV || 'sandbox',
      },
    });
  }
}