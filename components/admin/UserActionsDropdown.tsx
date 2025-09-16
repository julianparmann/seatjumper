'use client';

import { useState } from 'react';
import { MoreVertical, Shield, ShieldOff, Trash2, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

interface UserActionsDropdownProps {
  user: UserData;
  onUserUpdate: () => void;
}

export default function UserActionsDropdown({ user, onUserUpdate }: UserActionsDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUserEmail = session?.user?.email;
  const isCurrentUser = currentUserEmail === user.email;

  const handlePromoteToggle = async () => {
    setLoading(true);
    setShowPromoteConfirm(false);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAdmin: !user.isAdmin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onUserUpdate();
        // Show success notification
        alert(data.message);
      } else {
        alert(data.error || 'Failed to update user status');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setShowDeleteConfirm(false);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        onUserUpdate();
        alert(data.message);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={loading}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              {/* Promote/Demote */}
              {!isCurrentUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPromoteConfirm(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  {user.isAdmin ? (
                    <>
                      <ShieldOff className="w-4 h-4" />
                      Demote from Admin
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Promote to Admin
                    </>
                  )}
                </button>
              )}

              {/* Delete */}
              {!isCurrentUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              )}

              {/* Self-action message */}
              {isCurrentUser && (
                <div className="px-4 py-2 text-sm text-gray-500 italic">
                  Cannot modify own account
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Promote/Demote Confirmation Modal */}
      {showPromoteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.isAdmin ? 'Demote Admin' : 'Promote to Admin'}
                </h3>
                <p className="text-sm text-gray-600">
                  {user.isAdmin
                    ? 'Remove admin privileges from this user?'
                    : 'Grant admin privileges to this user?'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPromoteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteToggle}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  user.isAdmin
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : user.isAdmin ? 'Demote' : 'Promote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. The user will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              {user.isAdmin && (
                <p className="text-sm text-red-600 font-medium mt-1">⚠️ This user is an admin</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}