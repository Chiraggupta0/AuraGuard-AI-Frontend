# AuraGuard AI - Setup & Test Guide

## STEP 1: Verify MongoDB Connection

**Backend:** Check `.env` file has:
```env
MONGO_URI=mongodb://127.0.0.1:27017/auraguard_ai
```

Make sure MongoDB is running:
```bash
# On Windows, if using MongoDB Community:
# - MongoDB should run as a service automatically
# Check if running:
netstat -an | findstr 27017

# Or use MongoDB Compass to test connection
# Connection String: mongodb://localhost:27017
```

---

## STEP 2: Restart Backend

```bash
cd "AuraGuard-AI-Backend"

# Install dependencies (if first time)
npm install

# Kill any existing node process
# Windows: taskkill /F /IM node.exe
# Mac/Linux: pkill -f node

# Start in dev mode
npm run dev

# Wait for message:
# ✓ Server is running on port 5000
# ✓ Connected to MongoDB
```

**Verify Backend Ready:**
```bash
curl http://localhost:5000/api/v1/auth/login
# Should get a response (not "Connection refused")
```

---

## STEP 3: Restart Frontend

```bash
cd "Frontend"

# Optional: clear cache
# rm -rf node_modules package-lock.json
# npm install

# Start dev server
npm run dev

# Wait for message:
# ✓ Local:   http://localhost:5173
```

---

## STEP 4: Test Create Room (Single User)

**Browser 1 (Incognito):**
1. Go to http://localhost:5173
2. Login with any Firebase account
3. Navigate to "Create Room" or Dashboard → Create Meeting
4. Click "Generate Room Code"

**Expected:**
```
✅ Room code appears (e.g., Aurora-ABC123)
✅ Copy button works
✅ No errors in console
✅ Console shows: [ROOM] Room created successfully
```

---

## STEP 5: Test Invalid Room Rejection

**Same Browser:**
1. Navigate to "Join Room" or Dashboard → Join Meeting
2. Enter: `FAKE-ROOM-999`
3. Click "Join Room"

**Expected:**
```
❌ Do NOT go to meeting page
✅ Error message: "Room not found"
✅ Console shows: [ROOM] Error joining room: Room not found
```

---

## STEP 6: Test Two-User Meeting

### User A Setup (Browser 1 - Incognito Window 1)
```
1. Go to http://localhost:5173
2. Login with Account A (e.g., usera@gmail.com / password)
3. Go to Create Room
4. Click "Generate Room Code"
5. Copy the code (e.g., Apex-XYZ789)
6. Click "Join Room"
7. Wait for meeting page to load
8. Open browser console (F12 → Console tab)
```

**Expected User A Console:**
```
[ROOM] Joining room: Apex-XYZ789
[LIVEKIT] Requesting token...
[LIVEKIT] Token received
[LIVEKIT] Connecting to LiveKit server...
[LIVEKIT] Successfully connected to LiveKit room
[VIDEO] Requesting camera...
[VIDEO] Local camera enabled
[VIDEO] Requesting microphone...
[VIDEO] Local microphone enabled
[LIVEKIT] Local participant ready
```

**Expected User A Screen:**
```
- AuraGuard Live header ✓
- Room code displayed ✓
- Local camera video visible in grid ✓
- Camera ON button active (blue) ✓
- Mic ON button active (blue) ✓
- Leave button ready ✓
```

### User B Setup (Browser 2 - Incognito Window 2)
```
1. Go to http://localhost:5173
2. Login with Account B (e.g., userb@gmail.com / password)
3. Go to Join Room
4. Enter the code User A shared: Apex-XYZ789
5. Click "Join Room"
6. Open browser console (F12 → Console tab)
```

**Expected User B Console:**
```
[ROOM] Joining room: Apex-XYZ789
[LIVEKIT] Requesting token...
[LIVEKIT] Token received
[LIVEKIT] Connecting to LiveKit server...
[LIVEKIT] Successfully connected to LiveKit room
[VIDEO] Requesting camera...
[VIDEO] Local camera enabled
[VIDEO] Requesting microphone...
[VIDEO] Local microphone enabled
[LIVEKIT] Local participant ready
[ROOM] Remote participant connected: {identity: "user-...", name: "usera@..."}
[VIDEO] Track subscribed: {kind: "video", participantIdentity: "user-...", trackSid: "TR_..."}
[VIDEO] Remote track - found: {trackSid: "TR_...", trackKind: "video"}
[VIDEO] Track attached - video element state: {videoWidth: 1280, videoHeight: 720, ...}
```

**Expected User B Screen:**
```
- AuraGuard Live header ✓
- Room code displayed ✓
- 2 video tiles visible ✓
  - Left: User B's camera (local) ✓
  - Right: User A's camera (remote) ✓ ← THIS SHOULD NOW WORK
- Camera ON button active (blue) ✓
- Mic ON button active (blue) ✓
- Leave button ready ✓
```

---

## STEP 7: Verify Both Directions

### Check User A's Console
User A should also see the "Remote participant connected" logs when User B joins:

```
[ROOM] Remote participant connected: {identity: "user-...", name: "userb@..."}
[VIDEO] Track subscribed: {kind: "video", participantIdentity: "user-...", trackSid: "TR_..."}
[VIDEO] Remote video track - found: {trackSid: "TR_...", trackKind: "video"}
[VIDEO] Track attached - video element state: {...}
```

### Check User A's Screen
User A's screen should update to show 2 video tiles:
```
- Left: User A's camera (local) ✓
- Right: User B's camera (remote) ✓ ← NOW VISIBLE
```

---

## STEP 8: Test Camera & Microphone Toggle

**In Meeting Room:**

### Toggle Camera
1. Click "Camera On" button
2. Local video should disappear (or show placeholder)
3. Console should show: `[VIDEO] Toggling camera to: false`
4. Remote user should see local video disappear
5. Click "Camera On" button again
6. Local video should reappear
7. Console should show: `[VIDEO] Toggling camera to: true`

### Toggle Microphone
1. Click "Mic On" button
2. Microphone should turn off
3. Console should show: `[VIDEO] Toggling microphone to: false`
4. Remote user should not hear you
5. Click "Mic On" button again
6. Microphone should turn on
7. Console should show: `[VIDEO] Toggling microphone to: true`

---

## STEP 9: Test Leave

1. Click "Leave" button
2. Should redirect to Dashboard
3. Meeting window closes
4. Other user should still be in room (waiting for others)

---

## TROUBLESHOOTING

### "Room not found" on Valid Room
**Cause:** Backend not connected to MongoDB  
**Fix:**
```bash
# Stop backend
# Verify MongoDB running:
mongosh
# Should connect successfully

# Restart backend:
npm run dev
```

### Remote video shows placeholder indefinitely
**Check:**
1. Both users' cameras enabled? (Blue "Camera On" button)
2. Check remote user's console for errors
3. Is LiveKit server responding? (Check livekit-client logs)

### Console error: "Cannot read properties of undefined (reading 'videoTrackSubscriptions')"
**Cause:** Participant object is stale  
**Fix:**
1. Hard refresh (Ctrl+Shift+R) both browsers
2. Restart backend
3. Try again

### "CORS error" or "Connection refused"
**Check:**
1. Backend running on port 5000?
2. Frontend trying to connect to correct URL?
   - Should be: `http://localhost:5000/api/v1`
   - Check: `Frontend/.env` → `VITE_API_BASE_URL`

### No error but no remote video
**Debug Steps:**
1. Check both users are in same room code ✓
2. Check both browsers show 2 video tiles ✓
3. Check console for `[ROOM] Remote participant connected` ✓
4. Check console for `[VIDEO] Track subscribed` ✓
5. Check console for `[VIDEO] Track attached` ✓
6. If missing, see "Debugging Guide" in AUDIT_AND_FIX_REPORT.md

---

## SUCCESS CRITERIA ✅

### Test A: Invalid Room Code Rejected
- ✅ Entering "FAKE-ROOM-999" shows error
- ✅ Does NOT navigate to meeting page
- ✅ Error message is clear

### Test B: Two-User Meeting Works
- ✅ User A creates room code
- ✅ User B joins with that code
- ✅ Both see their own camera
- ✅ Both see each other's camera
- ✅ Both can hear each other (if mic enabled)
- ✅ Camera toggle works
- ✅ Microphone toggle works
- ✅ Leave button works

---

## QUICK CHECKLIST

Before declaring SUCCESS:

- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] MongoDB connected (check backend logs)
- [ ] Create Room works (generates code)
- [ ] Join Invalid Room shows error
- [ ] Two different Firebase accounts used
- [ ] Both users see local camera
- [ ] **Both users see each other's camera** ← CRITICAL
- [ ] Both users see 2 video tiles
- [ ] Camera toggle works
- [ ] Microphone toggle works
- [ ] Leave works
- [ ] Console has no red errors
- [ ] Logs follow [ROOM], [LIVEKIT], [VIDEO] pattern

---

## NEXT TROUBLESHOOTING

If tests fail, provide:
1. **Console logs** (from browser DevTools)
2. **Backend logs** (from terminal)
3. **Screenshot** of meeting screen
4. **Exact error message**

Then we can debug further.

**System is ready for testing!** 🚀
