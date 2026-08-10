import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, PageHeader } from '@/components';
import ROUTES from '@/constants/routes.constants';
import { isValidRoomName } from '@/utils/roomNameGenerator';
import { validateRoom } from '@/services/roomApi';
import useAuth from '@/hooks/useAuth';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { user, isAuthLoading } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-auraguard-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  console.log('[AUTH] User authenticated:', { email: user.email });

  const handleJoinRoom = async () => {
    setError('');

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!isValidRoomName(roomCode)) {
      setError('Invalid room code format');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[ROOM] Validating room:', roomCode);
      const room = await validateRoom(roomCode);
      // Navigate with the canonical code from the server, not the typed casing,
      // so every participant lands on the exact same room identifier.
      const canonicalRoomCode = room?.roomCode || roomCode;
      console.log('[ROOM] Room validation successful, joining:', canonicalRoomCode);
      navigate(`/meeting/${canonicalRoomCode}`, { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to join room';
      console.error('[ROOM] Error joining room:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleJoinRoom();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meetings"
        title="Join Room"
        description="Enter a room code to join an existing meeting."
      />

      <Card className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <Input
            label="Room Code"
            placeholder="e.g., Aurora-ABC123"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyPress={handleKeyPress}
            error={error}
            autoFocus
            disabled={isLoading}
          />

          <p className="text-sm text-slate-400">
            Ask the room creator for the room code. It looks like <code className="font-mono">Aurora-ABC123</code>.
          </p>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <Button onClick={handleJoinRoom} className="flex-1" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
          <Button
            onClick={() => navigate(ROUTES.dashboard, { replace: true })}
            variant="secondary"
            disabled={isLoading}
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
