import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ticketGroup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ticket group:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket group', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const ticketGroup = await prisma.ticketGroup.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json(ticketGroup);
  } catch (error: any) {
    console.error('Error updating ticket group:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket group', details: error?.message },
      { status: 500 }
    );
  }
}