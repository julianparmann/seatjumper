import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { isAdmin } = await req.json();
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    // Prevent self-demotion
    if (currentUser.id === targetUserId && currentUser.isAdmin && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot demote yourself from admin' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user admin status
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: currentUser.id,
        action: isAdmin ? 'PROMOTE_USER' : 'DEMOTE_USER',
        resource: 'USER',
        resourceId: targetUserId,
        details: {
          targetEmail: targetUser.email,
          targetName: targetUser.name,
          previousAdminStatus: targetUser.isAdmin,
          newAdminStatus: isAdmin
        }
      }
    });

    return NextResponse.json({
      message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    // Prevent self-deletion
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete related records first (for models without cascade)
    await prisma.$transaction([
      // Delete records that don't have cascade
      prisma.adminAuditLog.deleteMany({ where: { userId: targetUserId } }),
      prisma.gameEntry.deleteMany({ where: { userId: targetUserId } }),
      prisma.spinResult.deleteMany({ where: { userId: targetUserId } }),
      prisma.spin.deleteMany({ where: { userId: targetUserId } }),
      prisma.order.deleteMany({ where: { userId: targetUserId } }),

      // Finally delete the user (other relations with cascade will auto-delete)
      prisma.user.delete({ where: { id: targetUserId } })
    ]);

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_USER',
        resource: 'USER',
        resourceId: targetUserId,
        details: {
          deletedEmail: targetUser.email,
          deletedName: targetUser.name,
          wasAdmin: targetUser.isAdmin
        }
      }
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}