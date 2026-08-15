import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, PageHeader } from '@/components';
import ROUTES from '@/constants/routes.constants';
import { createRoom } from '@/services/roomApi';
import useAuth from '@/hooks/useAuth';
import { FiCopy, FiCheck } from 'react-icons/fi';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user, isAuthLoading } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log('[AUTH] User not authenticated, redirecting to login');
      navigate(ROUTES.login, { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-auraguard-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  console.log('[AUTH] User authenticated:', { email: user.email });

  const handleGenerateRoom = async () => {
    setError('');
    setIsLoading(true);

    try {
      console.log('[ROOM] Creating room...');
      const roomInfo = await createRoom();
      console.log('[ROOM] Room created successfully:', roomInfo.roomCode);
      setRoomCode(roomInfo.roomCode);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create room';
      console.error('[ROOM] Error creating room:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      console.log('[ROOM] Joining room:', roomCode);
      navigate(`/meeting/${roomCode}`, { replace: true });
    }
  };

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meetings"
        title="Create Room"
        description="Generate a unique room code and invite others to join your meeting."
      />

      <Card className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Room Code
            </label>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-lg font-semibold text-slate-900">
                {roomCode || 'Not generated yet'}
              </div>
              <Button variant="secondary" onClick={handleCopyRoomCode} disabled={!roomCode}>
                {copiedToClipboard ? (
                  <>
                    <FiCheck className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    <FiCopy className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Share this code with others so they can join your room. Each code is unique and
              temporary.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          {!roomCode ? (
            <Button onClick={handleGenerateRoom} className="flex-1" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Generate Room Code'}
            </Button>
          ) : (
            <>
              <Button onClick={handleJoinRoom} className="flex-1">
                Join Room
              </Button>
              <Button onClick={handleGenerateRoom} variant="secondary" disabled={isLoading}>
                Generate New Code
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-200">
          <Button
            onClick={() => navigate(ROUTES.dashboard, { replace: true })}
            variant="ghost"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
