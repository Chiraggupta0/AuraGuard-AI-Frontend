# Authentication Troubleshooting Guide

## Error: "Authentication token is missing"

This error means the Firebase authentication token is not being sent with the room API request.

---

## Quick Fix Checklist

### ✅ Step 1: Are you logged in?

**Check:**
1. Look at the top right of the page
2. Should show your email/name
3. Should NOT say "Login" or "Sign Up"

**If NOT logged in:**
1. Click "Login" button
2. Sign in with Firebase credentials
3. Then try Create/Join Room again

**If logged in:**
- Continue to Step 2

---

### ✅ Step 2: Check Browser Console

1. Open Developer Tools (F12)
2. Click "Console" tab
3. Look for logs starting with `[AUTH]`

**Should see:**
```
[AUTH] User authenticated: {email: "your@email.com"}
```

**If you see:**
```
[AUTH] User not authenticated, redirecting to login
```

Then you're not logged in. Go back to Step 1.

---

### ✅ Step 3: Check Network Tab

1. Open Developer Tools (F12)
2. Click "Network" tab
3. Click "Create Room" button
4. Look for request to `/rooms/create`
5. Click on it
6. Look for "Request Headers"
7. Should see:
```
Authorization: Bearer eyJhbGc...
```

**If you DON'T see Authorization header:**
- Hard refresh (Ctrl+Shift+R)
- Log out (if there's a logout button)
- Log back in
- Try again

---

### ✅ Step 4: Clear Auth Store

Sometimes the auth store gets stuck:

**Option A: Hard Refresh**
```
Ctrl+Shift+R  (clears cache + refreshes)
```

**Option B: Clear Local Storage**
1. Open Developer Tools (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. Find "auraguard-ai-frontend"
5. Right-click and delete
6. Refresh page

---

## Complete Flow (What Should Happen)

### Login
```
1. User enters email/password
2. Firebase verifies credentials
3. Firebase returns accessToken
4. Frontend stores in auth store (Zustand)
5. apiClient interceptor picks up token
6. User redirected to Dashboard
7. Console shows: [AUTH] User authenticated
```

### Create Room
```
1. User clicks "Create Room"
2. Page checks: Is user logged in?
   YES → Show create button
   NO → Redirect to login
3. User clicks "Generate Room Code"
4. Frontend: Reads token from auth store
5. Frontend: Adds to Authorization header
6. Frontend: POST /rooms/create (with token)
7. Backend: Verifies token with Firebase
8. Backend: Creates room in MongoDB
9. Backend: Returns roomCode
10. Frontend: Shows room code
```

### Join Room
```
1. User clicks "Join Room"
2. Page checks: Is user logged in?
   YES → Show join form
   NO → Redirect to login
3. User enters room code
4. User clicks "Join"
5. Frontend: Validates room exists
   - Reads token from auth store
   - POST /rooms/validate (with token)
   - Backend checks if room exists
   - If NO → Show error, stay on page
   - If YES → Continue
6. Frontend: GET /rooms/join (with token)
7. Backend: Verifies room exists again
8. Backend: Adds participant
9. Backend: Generates LiveKit token
10. Frontend: Connects to LiveKit
11. Meeting starts
```

---

## Error Messages & What They Mean

### "Authentication token is missing"
**Means:** No `Authorization` header in request  
**Why:** User not logged in OR token not in auth store  
**Fix:** Log in again + hard refresh

### "Authentication token is invalid"
**Means:** Token was sent but Firebase rejected it  
**Why:** Token expired OR corrupted  
**Fix:** Log out + log back in

### "Room not found"
**Means:** Token is valid, but room doesn't exist  
**Why:** Invalid room code OR room expired (24 hours)  
**Fix:** Check room code, ask creator for new code

### "Room is no longer active"
**Means:** Token valid, room exists but status is ENDED  
**Why:** Host ended the room  
**Fix:** Create new room or ask host to create new one

---

## Debug Logs to Check

### In Browser Console (F12)

**Login flow:**
```
[AUTH] User authenticated: {email: "..."}
```

**Create room flow:**
```
[AUTH] User authenticated: {email: "..."}
[ROOM] Creating room...
[ROOM] Room created successfully: Aurora-ABC123
```

**Join room flow:**
```
[AUTH] User authenticated: {email: "..."}
[ROOM] Validating room: Aurora-ABC123
[ROOM] Room validation successful
[ROOM] Joining room: Aurora-ABC123
[LIVEKIT] Requesting token...
[LIVEKIT] Token received
```

**If error:**
```
[AUTH] User not authenticated, redirecting to login
ERROR: Authentication required. Please login first.
```

---

## Network Inspection

**What to check in Network tab:**

1. **POST /rooms/create**
   - Status should be: 201 (Created)
   - Headers should include: `Authorization: Bearer ...`
   - Response should be: `{data: {roomCode: "..."}}`

2. **GET /rooms/validate/:roomCode**
   - Status should be: 200 (OK)
   - Headers should include: `Authorization: Bearer ...`
   - Response should be: `{data: {roomCode: "...", status: "ACTIVE"}}`

3. **POST /rooms/join**
   - Status should be: 200 (OK)
   - Headers should include: `Authorization: Bearer ...`
   - Response should be: `{data: {token: "...", serverUrl: "..."}}`

**If you see status 401:**
```
401 = Unauthorized (token missing or invalid)
```

**Fix:** Refresh page, log in again, try again

---

## If You're Still Stuck

Provide these details:

1. **Screenshot** of error message
2. **Console logs** (F12 → Console → copy-paste)
3. **Network tab** (F12 → Network → screenshot of request headers)
4. **Are you logged in?** (Can you see your email on page?)
5. **What step fails?** (Create room? Join room? Meeting?)

Then we can debug further.

---

## The Minimum Requirements

For room operations to work, you need:

- ✅ Firebase account (created, logged in)
- ✅ Backend running (port 5000)
- ✅ MongoDB connected
- ✅ Frontend running (port 5173)
- ✅ Browser with working localStorage
- ✅ CORS enabled (should be automatic)

---

**Most common fix: Hard refresh (Ctrl+Shift+R) after logging in.**
