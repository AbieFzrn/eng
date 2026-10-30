import { useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { ensureSignedIn } from '../services/authService';
import { useRoomStore } from '../state/useRoomStore';

export function useAuth() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSignedIn()
      .then(() => { useRoomStore.getState().setUid(auth.currentUser.uid); setReady(true); })
      .catch(console.error);
  }, []);
  return ready;
}