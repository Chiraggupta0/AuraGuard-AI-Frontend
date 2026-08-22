# AuraGuard AI — Interview Preparation Guide

*A conceptual, architecture-level guide for explaining AuraGuard confidently in an interview. Not a code reference — see `AURAGUARD_DEVELOPER_INTERVIEW_DOCUMENTATION.md` for that. Every claim here was checked against the real codebase; anything not implemented is labeled, never invented.*

---

## 1. PROJECT OVERVIEW

**What AuraGuard AI is:** A video-conferencing application — think a lightweight Google Meet — where a user logs in, creates a room, shares a code, and another user joins that same room for a live video/audio call with text chat and screen sharing. The name and the product vision point toward AI-based meeting safety (detecting unsafe behavior during a call), but that layer is not built yet — what exists today is a solid, secured video-calling product.

**What problem it solves (today):** Reliable, authenticated, real-time video communication between two or more people, with a room system that can't be bypassed by guessing a code.

**Who uses it:** Any authenticated user — no role distinction currently exists between "host" and "participant" at the system level.

**What makes it different (interview framing):** Not "we invented video calling" — the honest, strong story is that this project required solving real distributed-systems problems: making a room system actually secure (not just a random string), keeping two independently-owned SDK states (React and LiveKit) in sync without stale bugs, and getting Firebase-to-backend trust right. Lead with *those* engineering problems, not with the video-call feature itself, which is largely "wire up LiveKit correctly."

**Main features (implemented):** Firebase login (email/password + Google), backend-validated room creation and joining, two-way video/audio calling, camera/mic toggle, real-time text chat, screen sharing.

**Overall architecture, one line:** React frontend + Express/MongoDB backend, talking over REST, with the actual video/audio handled entirely by a third-party service (LiveKit Cloud) that the backend only *authorizes* access to — it never touches the media itself.

**Current stage:** A working, secured video-calling product. No AI/moderation code exists yet (confirmed — see §15).

### Say this in the interview (short version)
> "AuraGuard is a video conferencing app I built with React and a Node/Express backend, using LiveKit Cloud for the actual WebRTC video/audio and Firebase for auth. The core engineering problem I solved wasn't the video call itself — it was making the room system actually secure, so a random guessed code can't get someone into a real meeting, and getting the authentication trust boundary right between a frontend that *thinks* it's logged in and a backend that independently verifies every request."

### Slightly more technical version
> "It's a two-repo project — React/Vite frontend, Node/Express/MongoDB backend — that communicate only over a REST API. Firebase handles identity; the frontend attaches a fresh ID token to every request, and the backend verifies it server-side with the Firebase Admin SDK before trusting anything. Rooms are MongoDB documents with a status and expiry, and the backend won't issue a LiveKit access token until it's confirmed the room actually exists and is active — that's the part that was genuinely tricky to get right, because the LiveKit room name has to match exactly across two independently-cased user inputs, or two people typing the same code differently end up in two different video rooms without any error. LiveKit itself handles the actual peer-to-peer-at-scale video transport; my backend's only job in that part is minting a short-lived, scoped token."

---

## 2. COMPLETE TECHNOLOGY STACK

| Technology | Where Used | Why We Use It | What I Should Know for Interview | Status |
|---|---|---|---|---|
| **React** | Frontend UI | Component-based, declarative — good fit for a UI with many independently-updating pieces reacting to async events (a participant joining, a track publishing) | Frontend state is mostly local component state + two small Zustand stores, not Redux | ✅ IMPLEMENTED |
| **Vite** | Frontend build tool / dev server | Fast dev server, modern standard for React projects | Just tooling — don't over-explain this unless asked | ✅ IMPLEMENTED |
| **Tailwind CSS** | Frontend styling | Utility-first, fast iteration | Not an architectural decision — don't spend interview time here | ✅ IMPLEMENTED |
| **Node.js + Express** | Backend REST API | Lightweight, well suited to an I/O-bound backend (DB queries + token signing — no heavy compute) | The backend never touches video/audio data — only issues authorization | ✅ IMPLEMENTED |
| **MongoDB (Mongoose)** | Backend database | Room data is a self-contained document with an embedded participants array — no relational joins needed | Only one real collection matters here: `Room` | ✅ IMPLEMENTED |
| **Firebase Authentication** | Frontend login + backend token verification | Avoids building password storage/reset/OAuth myself; issues short-lived tokens the backend can independently verify with no shared secret | Frontend uses the *client* SDK (login); backend uses the *Admin* SDK (verify only) — different halves of Firebase | ✅ IMPLEMENTED |
| **LiveKit (Cloud)** | Video/audio/chat/screen-share transport | Managed WebRTC infrastructure (an SFU) — avoids building signaling, NAT traversal, and media routing myself | This is the single most important thing to be able to explain well — see §7 | ✅ IMPLEMENTED |
| **WebRTC** | Underlying protocol LiveKit uses | Peer-to-peer-capable real-time media transport standard | We do **not** call WebRTC APIs directly — LiveKit's client SDK wraps it entirely | ✅ IMPLEMENTED (via LiveKit, not directly) |
| **Axios** | Frontend HTTP client | REST calls to the backend, with a request interceptor that attaches the Firebase token | Know that the interceptor fetches a *fresh* token on every request, not a cached one | ✅ IMPLEMENTED |
| **Zustand** | Frontend global state | Two small stores (auth, UI chrome) — lighter than Redux for this scale | Neither store holds the LiveKit connection or any video/room state — that's local to the meeting screen | ✅ IMPLEMENTED |
| **Docker / Docker Compose** | Backend containerization | A production-ready multi-stage Dockerfile exists, plus a compose file running the API alongside a local MongoDB container | This is real, working local infrastructure — not a cloud deployment | ✅ IMPLEMENTED (local only) |
| **Python** | — | — | — | ❌ NOT CURRENTLY USED |
| **OpenCV** | — | Discussed as part of the future vision-processing pipeline | Do not claim this is built | ⏳ PLANNED / NOT IMPLEMENTED |
| **YOLO** | — | Discussed for object/face detection in the future AI pipeline | Do not claim this is built | ⏳ PLANNED / NOT IMPLEMENTED |
| **Speech-to-Text (any provider)** | — | Discussed for future audio moderation | No specific provider has been decided/implemented | ⏳ PLANNED / NOT IMPLEMENTED |
| **Gemini** | — | Discussed only conceptually | **Not integrated anywhere in the codebase.** | ❌ NOT CURRENTLY USED |
| **Hugging Face** | — | Discussed only conceptually | **Not integrated anywhere in the codebase.** | ❌ NOT CURRENTLY USED |
| **A separate Python AI service** (`AuraGuard-AI-Service`/`AuraGuard-AI-Python`) | Referenced by name in backend config (`AI_SERVICE_BASE_URL` env var, a thin HTTP client stub) | Intended future home for AI inference, kept out of the Node backend | The actual repo for this exists on disk but contains **only a placeholder README — no code at all** | ❌ NOT IMPLEMENTED |
| **Vercel** | — | Would be a natural fit for the React frontend | No Vercel config found anywhere in the project | ⏳ PLANNED / NOT CONFIRMED |
| **Render** | — | Would be a natural fit for the Express backend | No Render config found; what *does* exist is a Docker setup, which Render (or any container host) could use | ⏳ PLANNED / NOT CONFIRMED |
| **MongoDB Atlas** | — | Would be the natural managed-DB choice for production | Currently the project runs against a local MongoDB instance (or the local Docker Mongo container) — no Atlas connection string or config found | ⏳ PLANNED / NOT CONFIRMED |
| **socket.io** | Installed, initialized at backend server startup | Present in dependencies and wired at boot | **I could not confirm any current feature (video, chat, rooms) actually uses it** — say "installed and initialized, not confirmed in use by a specific feature" if asked, don't claim more | 🟡 PRESENT / NOT CONFIRMED IN USE |
| **@tanstack/react-query** | Installed, provider wired in the frontend | Would normally handle server-state caching | No component actually calls `useQuery`/`useMutation` — all API calls are plain Axios | 🟡 INSTALLED / NOT USED |

**Interview tip:** if asked to name the AI stack (OpenCV/YOLO/Whisper/Gemini/etc.), the honest and *strong* answer is: *"That's the planned next phase — the video-calling platform and its security model are built and working; the moderation pipeline is designed conceptually (vision detection → audio detection → a violation engine → host decision) but not yet implemented."* Confidently stating what's real is far stronger in an interview than fumbling when a follow-up question exposes a gap.

---

## 3. SYSTEM ARCHITECTURE

```
                              USER
                               │
                               ▼
                       React Frontend
                      (localhost:5173)
                        /            \
                       /              \
                      ▼                ▼
              Backend API         Firebase Auth
            (localhost:5000)      (Google Cloud)
                 │      │
                 │      └──────────────┐
                 ▼                     ▼
             MongoDB              LiveKit Cloud
          (Room documents)      (video/audio/chat/
                                  screen-share SFU)
                                        │
                                        ▼
                                Other Participants
                                 (their browsers)
```

**Frontend → Backend:** why it exists — the browser needs a trusted authority to say "yes, this room is real" and "here is your permission slip (token) to join the video call." The frontend cannot decide either of those things itself, or it could be tricked/bypassed.

**Frontend → Firebase:** why it exists — identity. The frontend authenticates the user directly against Firebase (never against our own backend) and gets back a token that *proves* who they are to anyone who checks it.

**Frontend → LiveKit:** why it exists — this is where the actual video/audio/chat data flows, directly between the browser and LiveKit's infrastructure. It deliberately does **not** go through our backend, because relaying live video through a general app server doesn't scale.

**Backend → MongoDB:** why it exists — the backend needs a persistent, trustworthy record of "which rooms actually exist and are still valid," independent of anything the browser claims.

**Backend → LiveKit:** why it exists — the backend holds the LiveKit API secret and is the only party allowed to *mint* a token; it calls LiveKit's server SDK (a local, offline JWT-signing operation, not even a network call) to produce that token after validating the room.

**Backend → AI services / AI services → Violation Engine / Violation Engine → Host-System:** ⏳ **PLANNED, NOT IMPLEMENTED.** These connections do not exist in the running system today. See §15–18 for the honest, conceptual explanation of the *design*, clearly separated from what's built.

---

## 4. FRONTEND ↔ BACKEND COMMUNICATION

This is genuinely two separate applications — separate folders, separate `package.json`s, separate processes, separate ports. They share **no code and no memory.** The only thing connecting them is HTTP.

```
Frontend                                Backend
localhost:5173                          localhost:5000
    │                                        │
    │  Axios POST /api/v1/rooms/create        │
    │  Authorization: Bearer <firebase-token> │
    │ ───────────────────────────────────────►│
    │                                        │  Express receives it
    │                                        │  CORS check passes (frontend
    │                                        │  origin is explicitly allowed)
    │                                        │  Auth middleware verifies token
    │                                        │  Controller → Service → MongoDB
    │                                        │
    │  { success: true, data: {...} }  JSON   │
    │◄─────────────────────────────────────── │
    │                                        │
```

**How can two separate projects on two different ports talk to each other?** This is just how the web already works — any client (a browser, a mobile app, `curl`) can call any HTTP server it has network access to, regardless of what language or framework built either side. Nothing special ties React to Express specifically; it's Axios making a plain HTTP request to a URL, exactly like calling any third-party API.

**CORS, explained simply:** by default, a browser blocks a page loaded from one origin (`localhost:5173`) from calling a *different* origin (`localhost:5000`) unless that server explicitly allows it. Our backend allows it via `cors({ origin: <frontend-url>, credentials: true })` — without this, the browser itself (not our code) would refuse the request.

**Request → Response flow, the way I'd say it out loud:**
```
React Button click
  → Axios builds a POST request with a JSON body
  → Interceptor attaches a fresh Firebase ID token as an Authorization header
  → HTTP request crosses to the Express server
  → CORS check
  → Authentication middleware verifies the token (Firebase Admin SDK)
  → Controller reads the validated request
  → Service layer talks to MongoDB (and, for joining, to LiveKit's SDK to sign a token)
  → Response sent back as JSON
  → Axios resolves the promise
  → React updates state → UI re-renders
```

**Interview answer:** *"They're completely separate processes — the only contract between them is a REST API over HTTP. The frontend never imports backend code and vice versa. CORS is what makes the browser willing to let that cross-origin call happen at all, and every single request independently proves who the user is via a Firebase token — there's no session or cookie-based trust."*

---

## 5. AUTHENTICATION

**Concepts:**
- **Authentication** = proving who you are. Fully handled by Firebase.
- **Authorization** = what you're allowed to do once identified. In AuraGuard today, authorization is minimal — being an authenticated Firebase user is enough to create or join any room whose code you know; there's no per-user permission system beyond that.

```
User logs in (email/password OR Google popup)
        │
        ▼
Firebase Auth verifies credentials (Google's servers — our backend
never sees a password)
        │
        ▼
Firebase issues a short-lived ID Token to the browser
        │
        ▼
Frontend: on EVERY API call, fetch a fresh token from the Firebase
SDK and attach it: "Authorization: Bearer <token>"
        │
        ▼
Backend receives the request
        │
        ▼
Firebase Admin SDK verifies the token cryptographically
(NOT just decoding it — checking its signature against Firebase's
own keys, and its expiry)
        │
        ▼
Backend now trusts the decoded UID/email as the real, current user
        │
        ▼
Protected route executes (e.g., create/join a room)
```

**How the backend knows *which* user is making the request:** it doesn't look anything up in its own database for this — the verified token itself contains the Firebase UID and email, and that's trusted directly.

**Why "the frontend is logged in" doesn't automatically mean the backend trusts it:** the frontend's logged-in state only lives in the browser. Nothing forces a request to actually carry a valid token unless the code attaches one — and every request is independently re-verified server-side, every single time, with no server-side session remembering "this browser is already trusted." This is a genuinely important distinction to articulate clearly, and it's also a real bug this project hit early on (the token wasn't being attached at all for a while, and the app *looked* logged in while every backend call silently failed) — a great, honest story to tell if asked "tell me about a bug you fixed."

**Interview answer, short:** *"Firebase handles identity end-to-end; my backend never sees a password. What I built is the trust boundary — every API request independently proves itself with a fresh, cryptographically verified token, so a browser 'looking' authenticated is never enough on its own."*

---

## 6. ROOM CREATION & JOINING

### Create Room
```
User clicks "Create Room"
        │
        ▼
Frontend sends an authenticated request to the backend
        │
        ▼
Backend verifies the Firebase token
        │
        ▼
Backend generates a unique room code and saves a Room record
in MongoDB (status: ACTIVE, with a 24-hour expiry)
        │
        ▼
Room code returned to the frontend
        │
        ▼
User shares that code with someone else
```

### Join Room
```
User enters a room code
        │
        ▼
Frontend asks the backend: "does this room exist and is it valid?"
        │
        ▼
Backend checks MongoDB — exists? still ACTIVE? not expired?
        │
        ├── No  → error shown, user never proceeds any further
        │
        └── Yes → backend generates a scoped LiveKit access token
                      │
                      ▼
              Frontend receives the token
                      │
                      ▼
              Frontend connects directly to LiveKit using that token
                      │
                      ▼
              User is now in the live meeting
```

**Why room validation exists — the actual problem it solves:** originally, a room "code" was just a string generated in the browser with nothing recorded anywhere. That meant there was no way to tell a real, shared code from something a user simply typed — any string that *looked* right was treated as valid. Making the backend the single source of truth (a real database record with a status and an expiry) closes that gap: a made-up or expired code is now rejected *before* any video connection is even attempted.

**A subtle but important detail worth mentioning in an interview:** the lookup has to be case-insensitive (people retype codes by hand), but a LiveKit room name is effectively case-sensitive — so the backend always uses *its own* stored version of the code (not whatever casing the user typed) when it actually creates the video-room token. Otherwise two people could both "successfully join" the same code typed differently and end up in two separate, unrelated video rooms without any error telling them why they can't see each other.

---

## 7. LIVEKIT + WEBRTC

**This is the section most likely to get deep follow-up questions — know it well.**

### What is WebRTC?
An open browser standard for real-time, peer-oriented audio/video/data transport. It's built into every modern browser (`RTCPeerConnection` and related APIs) — you don't install it, you call it.

### What is LiveKit?
A managed service (and open-source server) built *on top of* WebRTC that handles everything WebRTC by itself doesn't give you for free: signaling (coordinating who's connecting to whom), NAT traversal (STUN/TURN, so devices behind routers/firewalls can still connect), and — critically — acting as an **SFU (Selective Forwarding Unit)**, so video doesn't have to be sent directly from every participant to every other participant (which stops scaling past a handful of people).

### Are we directly implementing WebRTC?
**No.** We never call `RTCPeerConnection` or any raw WebRTC API ourselves. We use `livekit-client` (frontend) and `livekit-server-sdk` (backend), which wrap all of that entirely.

### What does LiveKit handle for us?
Media transport (audio/video/screen-share data), signaling/connection coordination, track publish/subscribe bookkeeping, reconnection handling, and (for chat) a reliable data-channel mechanism.

### What does the backend handle?
Exactly one thing related to LiveKit: **minting a signed access token**, after independently confirming the room is real. It never touches media.

### What does the frontend handle?
Everything from "I have a token" onward: connecting to the LiveKit room, publishing the local camera/mic (and optionally screen), and attaching remote participants' tracks to `<video>`/`<audio>` elements so the browser can render them.

### Core vocabulary, defined simply
- **Room** — the live session on LiveKit's side. (Distinct from our own MongoDB "Room" — that's "does this meeting exist," this is "the live real-time session itself.")
- **Participant** — one connected person; either the *local* participant (you) or a *remote* participant (everyone else).
- **Track** — one actual media stream: one camera feed, one mic feed, or one shared screen.
- **Publication** — the *announcement* that a participant has a track available; the actual track only becomes usable once it's "populated" (locally, once published; remotely, once subscribed).
- **Subscription** — the act of receiving someone else's published track. In this app, subscription happens automatically once connected (`autoSubscribe`), so we don't manually approve each one.

### The flow, camera as the example
```
Browser camera permission
        │
        ▼
LiveKit client SDK creates a local video track (calls getUserMedia
internally — our code never calls this directly)
        │
        ▼
SDK publishes the track over the already-open connection to LiveKit Cloud
        │
        ▼
LiveKit Cloud's SFU forwards it to every other subscribed participant
        │
        ▼
Their LiveKit client fires a "track subscribed" event
        │
        ▼
Their app attaches that track to a real <video> element
        │
        ▼
The browser natively decodes and renders it — no custom frame-handling
code exists anywhere in this project
```

### "Are you using WebSockets?" — how to answer this correctly
**The honest, precise answer:** *"LiveKit uses WebSocket-based signaling internally to coordinate the connection — that's part of how its SDK works under the hood — but I never wrote any WebSocket code myself; it's entirely encapsulated inside the `livekit-client`/`livekit-server-sdk` libraries. Separately, the backend does have `socket.io` installed and initialized at startup, but I can't confirm any currently-built feature — video, chat, or rooms — actually routes data through it; all of those go through LiveKit's own connection or plain REST."* This is a much stronger answer than either overclaiming ("yes we use WebSockets for video") or underclaiming ("no, nothing here uses WebSockets at all") — both would be wrong.

### The full communication-type distinction
| Layer | What it is | Who implements it |
|---|---|---|
| HTTP REST API | Request/response calls to our own backend (`/rooms/create`, `/rooms/join`, etc.) | Us, directly (Express + Axios) |
| WebSocket / signaling | Coordinating a LiveKit connection (who's joining, negotiating the session) | LiveKit's SDK, internally — not our code |
| WebRTC media transport | The actual audio/video/screen-share/data bytes moving between participants | Handled by WebRTC itself, orchestrated by LiveKit's SFU — not our code |
| LiveKit (the product) | The layer that ties signaling + WebRTC + SFU + a chat data-channel together into one usable SDK | The service we integrated, not built ourselves |

---

## 8. WHAT HAPPENS WHEN TWO USERS JOIN? (whiteboard flow)

**Scenario: User A creates a room. User B joins the same room.**

1. **User A authenticates** with Firebase, gets an ID token.
2. **User A creates a room** — backend verifies the token, generates a unique code, saves it in MongoDB with status `ACTIVE`, returns the code.
3. **User A's browser requests to join that same room** (this happens automatically once they land on the meeting screen) — backend re-validates the room and mints a LiveKit token scoped to that exact room name. User A's browser connects to LiveKit and publishes their camera/mic.
4. **User A shares the room code** with User B (outside the app — text, chat, etc.).
5. **User B authenticates** with Firebase independently.
6. **User B enters the code** — frontend asks the backend to validate it *before navigating anywhere*; backend confirms it's real, active, not expired.
7. **User B's browser requests to join** — backend mints a second LiveKit token, for the **same canonical room name** as User A's.
8. **User B connects to LiveKit** and publishes their own camera/mic.
9. **LiveKit's SFU now has two participants in one room** — it notifies both browsers that a new participant connected.
10. **Each browser subscribes to the other's published tracks** (automatic, since auto-subscribe is on).
11. **Each browser attaches the received video/audio track to its own UI**, and now both users can see and hear each other.

**One sentence to say while drawing this on a whiteboard:** *"Notice that steps 1 through 7 never touch video at all — that's all authentication and room bookkeeping. The actual video only starts flowing at step 8, and from that point on my backend is completely out of the picture — LiveKit and the two browsers handle everything directly."*

---

## 9. CAMERA / MICROPHONE

Conceptually, not code-level:
- **Permission** — the browser's native camera/mic permission prompt appears the first time we ask LiveKit to enable a track; we never manage permission state ourselves.
- **Local track** — created by LiveKit's SDK when we call its "enable camera"/"enable microphone" method.
- **Publishing** — the SDK sends that track up to LiveKit Cloud automatically as part of enabling it; there's no separate "publish" step we write.
- **Muting/unmuting** — a toggle button calls the SDK's enable/disable method again; LiveKit internally distinguishes a *muted* track (exists, paused) from an *unpublished* one (removed entirely).
- **What happens on the remote side when you turn your camera off:** the other participant's app receives a track-state-changed notification and updates their view of you — typically showing a placeholder/avatar instead of a frozen last frame.
- **How the UI stays in sync:** rather than the toggle button just flipping its own local flag, it re-reads the *actual* state LiveKit reports after every change — so the UI reflects reality, not an optimistic guess. This distinction (deriving UI state from the real system vs. maintaining a separate assumption) is a good thing to mention if asked about a design decision here.

---

## 10. CHAT

**Technology used:** LiveKit's own real-time **data channel** — the same connection already used for video/audio, not a separate service.

**HTTP or real-time?** Real-time — messages travel over the live LiveKit connection, not as REST requests.

**How messages move:** one participant sends a small JSON payload over the data channel; every other participant in the room receives it as an event, almost instantly.

**Are messages stored?** **No.** Chat is **not persistent** — no database table, no backend service handles chat at all. Messages exist only in each participant's browser memory for as long as they're in the call; leaving the meeting or refreshing loses the history.

**Is a separate chat backend used?** **No** — this was a deliberate choice, to avoid standing up any extra infrastructure for something LiveKit's existing connection already supports.

**Current limitations:**
- No persistence/history.
- No delivery confirmation/read receipts.
- No file/image attachments — text only.

---

## 11. SCREEN SHARING

**What it means technically:** capturing the pixels of a window/tab/entire screen (via the browser's native screen-capture API) as if it were a second camera feed.

**How it's transmitted:** exactly like camera video — it becomes a second published video track, sent through the same LiveKit connection, using WebRTC underneath.

**Does it use WebRTC/LiveKit?** Yes, entirely — no separate transport mechanism.

**How another participant receives it:** the same subscribe → attach → render pattern as camera video, just rendered in a distinct, larger tile rather than the regular camera grid, and with the video fitted-to-frame rather than cropped (since you don't want to lose part of someone's shared screen the way cropping a face to fill a square tile is fine).

**Status:** ✅ **Implemented** — including correctly stopping when the browser's own native "stop sharing" control is used, not just the app's own button, and correctly distinguishing "this is a camera track" from "this is a screen-share track" so they never get confused with each other in the UI.

---

## 12. PARTICIPANT LIST & MEETING STATUS

**How the app knows someone joined/left:** LiveKit itself fires events for this ("participant connected," "participant disconnected") — the frontend listens for them and updates its own list of who's currently in the room.

**Where this information comes from:** entirely from LiveKit's real-time events, **not** from our own backend or database. MongoDB has no live concept of "who is in the call right now" — it only knows "who has ever joined this room" as a historical record.

**Is there a dedicated participant-list UI (a sidebar showing everyone's name/mute status)?** **Not implemented** — the only participant-facing UI today is the video grid itself; there's no separate roster component.

---

## 13. DATABASE

**Why MongoDB:** a room is naturally a single, self-contained document — its code, status, expiry, and the list of who's joined all belong together and are always read/written as one unit, with no need for relational joins across multiple tables.

**What's actually persisted:** essentially one entity — **Room**: a unique code, a status (active/ended), an expiry timestamp, who created it, and a simple list of who has joined. That's it.

**What stays temporary (never touches MongoDB):** the live video/audio/screen-share data itself, chat messages, and the moment-to-moment "who is currently connected" state — all of that lives only inside LiveKit's live session and each browser's memory, never in our database.

**Why LiveKit's room state doesn't need to be duplicated in MongoDB:** they answer two genuinely different questions. MongoDB answers *"is this meeting allowed to exist and be joined"* — a durable, security-relevant fact. LiveKit's own internal room state answers *"who is connected right this second"* — a live, constantly-changing fact that would be pointless (and quickly stale) to mirror into a database on every change. Keeping these separate is a deliberate architectural boundary, not an oversight.

---

## 14. BACKEND ARCHITECTURE

```
Route
  ↓
Middleware (auth check, then request validation)
  ↓
Controller  (reads the request, calls the right service)
  ↓
Service     (the actual business logic — talks to MongoDB and/or LiveKit)
  ↓
Model / Database
```

**Why we separate these responsibilities:** each layer has one job. A route says *what URL maps to what handler*. A controller only understands HTTP (reading a request, shaping a response) — it doesn't know *how* a room gets created. A service knows the actual business rule ("a room is valid if it's active and not expired") without caring whether that rule was triggered by an HTTP request, a background job, or a test. This separation is what let two very different endpoints (validate vs. join) reuse the exact same "does this room exist" logic without duplicating it.

**Where authentication fits:** as middleware, running *before* the controller — so by the time a controller runs, it can simply trust `req.user` without re-checking anything itself.

**Where validation fits:** also middleware, checking the shape/format of the request body against a schema before the controller ever sees it — so controllers never have to defensively check "did they actually send a `roomCode`."

**Error handling:** centralized — any error thrown anywhere in this pipeline (a bad Mongo query, a failed validation, an expired token) is caught in one place and turned into a consistent JSON error response, rather than every controller having its own ad-hoc error logic.

**Environment variables:** all read through one central config file, so secrets (database connection string, Firebase/LiveKit credentials) never get scattered across the codebase as raw `process.env` reads.

---

## 15. AI / AURAGUARD CORE — ⏳ PLANNED, NOT IMPLEMENTED

**Nothing in this section is built. Confirmed:** no OpenCV, YOLO, speech-to-text library, Gemini, or Hugging Face integration exists in either repository. The separate Python AI service repo (`AuraGuard-AI-Python`) contains **only a placeholder README** — no code at all.

The **conceptual, intended pipeline** — worth being able to describe clearly, but always framed as design, not implementation:

```
VIDEO                                    AUDIO
  │                                        │
  ▼                                        ▼
Vision Processing                    Speech-to-Text
  │                                        │
  ├─ Face Detection                        ▼
  ├─ Multiple Face Detection          Text Analysis
  ├─ Phone Detection                    │
  ├─ Camera Covered Detection           ├─ Abuse Detection
  └─ Explicit Content Detection         ├─ Threat Detection
  │                                     └─ Toxic Speech Detection
  │                                        │
  └────────────────┬───────────────────────┘
                    ▼
             Violation Engine
                    │
                    ▼
             Violation Level
                    │
                    ▼
          Host / System Response
        (host decides what to do —
         see below, important decision)
```

**Important, already-made design decision:** the system should **not** automatically remove a participant from a call based on an AI detection. Detection informs; the **host** decides. This matters because automated moderation acting unilaterally is both a false-positive risk and a trust problem — the AI's job is to surface a *signal*, not to make an irreversible social decision on its own.

**What a Violation Engine is for (design intent):** a single place that turns multiple, independent detection signals (a face-detection result, a toxic-speech-detection result, etc.) into one coherent severity level, rather than each detector independently deciding to act. No scoring formula has been implemented — do not describe one as real if asked for specifics; the honest answer is "the architecture is designed, the scoring logic isn't written yet."

---

## 16. VISION PROCESSING — ⏳ PLANNED, NOT IMPLEMENTED

**Technologies discussed (not implemented):** OpenCV (a computer-vision library for image/frame manipulation and classical detection algorithms) and YOLO (a fast, real-time object-detection model family, which would be the natural fit for face/phone/object detection).

**Frame vs. video, conceptually:** a video is a continuous stream; a frame is one still image sampled from it. Vision models operate on individual frames, not the stream directly.

**Why process selected frames instead of every single one:** running a detection model on every frame of a live 30fps stream would be computationally expensive and mostly redundant — a person's face or a phone in-frame doesn't meaningfully change from one frame to the next a fraction of a second later. Sampling at a lower rate (e.g., a few frames per second) is the standard, sensible trade-off between responsiveness and cost — this is *reasoning about how it would be built*, not a description of existing code.

**How results would reach the Violation Engine (design):** each detector's output (a face count, a phone-detected boolean, etc.) would be sent to the Violation Engine as a structured signal, to be combined with audio-side signals into one violation assessment.

---

## 17. AUDIO PROCESSING — ⏳ PLANNED, NOT IMPLEMENTED

```
Microphone audio
      │
      ▼
Speech-to-Text  (converts spoken audio into text)
      │
      ▼
Text-based analysis: abuse / threat / toxicity detection
      │
      ▼
Violation Engine
```

**Why speech-to-text is needed first:** text-based moderation models (abuse/threat/toxicity classifiers) operate on language, not raw audio waveforms — converting speech to text is the necessary bridge step before any of that analysis can run.

**Which specific provider/technology has been decided:** **Not confirmed** — no speech-to-text service (Whisper, Google STT, or otherwise) has actually been integrated or chosen in code. If asked to name one, be honest that this is an open decision, not a settled one.

**Implemented / Planned / Experimental:** entirely **Planned**. Nothing here is Implemented or even Experimental (no prototype/spike code was found).

---

## 18. VIOLATION ENGINE — ⏳ PLANNED, NOT IMPLEMENTED (design concept only)

**What it is:** the proposed component that sits between raw AI detections and any real-world action — it takes in multiple, independent signals and turns them into one violation classification.

**Why not let each AI model directly take action:** if a face-detector, a phone-detector, and a toxicity-classifier could each independently trigger a response, you'd get inconsistent, uncoordinated, and likely over-aggressive behavior — three unrelated minor signals firing at once shouldn't necessarily mean the same thing as one severe signal firing alone. A single decision-making layer lets you reason about *combinations* of evidence, not isolated flags.

```
Detection  (raw model outputs — face count, toxicity score, etc.)
    │
    ▼
Classification  (turning raw outputs into a consistent internal signal)
    │
    ▼
Violation Level  (a combined severity assessment)
    │
    ▼
Decision  (what, if anything, should be surfaced)
    │
    ▼
Host / System Action  (the host chooses — not automatic removal)
```

**Why separating detection from decision-making is useful, generally:** it's a standard "single responsibility" argument — detectors stay simple and swappable (you could replace the phone-detection model without touching the decision logic at all), and the decision logic stays centralized and auditable in one place rather than smeared across every individual detector.

---

## 19. REAL-TIME COMMUNICATION — SUMMARY TABLE

| Communication | Technology | Purpose | Status |
|---|---|---|---|
| Frontend → Backend | HTTP / REST (Axios → Express) | Room creation/validation/join, authentication | ✅ Implemented |
| Frontend → Firebase | Firebase JS SDK | Login, token issuance | ✅ Implemented |
| Frontend ↔ LiveKit | LiveKit client SDK, over WebRTC (with WebSocket-based signaling internally) | Video, audio, screen share | ✅ Implemented |
| LiveKit signaling | WebSocket-based, entirely inside the LiveKit SDK | Coordinating the media connection | ✅ Implemented (not our code) |
| Participant media | WebRTC | Real-time audio/video/screen transport | ✅ Implemented (via LiveKit) |
| Chat | LiveKit data channel | In-meeting messaging | ✅ Implemented, not persisted |
| `socket.io` | Installed, initialized at backend boot | Unclear/unconfirmed current use | 🟡 Present, not confirmed in use |
| AI service communication | A thin HTTP client stub exists (`AI_SERVICE_BASE_URL`), pointing to an empty repo | Intended future AI processing calls | ❌ Not implemented |

---

## 20. DEPLOYMENT

**What's actually confirmed to exist today:** a production-oriented, multi-stage **Dockerfile** for the backend (builds a minimal Node 18 Alpine image, runs as a non-root user, includes a health-check hitting the API's `/health` endpoint), and a **docker-compose.yml** that runs the backend API alongside a local MongoDB container.

**What is *not* confirmed to exist:** any Vercel config for the frontend, any Render config for the backend, or any MongoDB Atlas connection setup. **If asked "how is this deployed," the honest answer is: "It's containerized and ready to deploy — the Docker setup already runs the backend and a database together — but no cloud provider is currently wired up. Vercel for the frontend and a container host like Render for the backend, with MongoDB Atlas as the managed database, would be the natural next step given the stack."**

**What LiveKit Cloud and Firebase mean for deployment:** these two pieces are *already* cloud-hosted, third-party services — they don't need any deployment work from us at all; the app just needs valid credentials for them in whatever environment it runs in.

**Why environment variables matter here:** every environment (local dev, a future staging/production deploy) needs its own set of secrets (database connection string, Firebase service-account credentials, LiveKit API key/secret) — none of these are hardcoded anywhere in the code, all are read from environment configuration.

**Why `LIVEKIT_API_SECRET` specifically must stay backend-only:** that secret is what *signs* a LiveKit access token. Anyone holding it could mint a valid token for any room, with any permission, completely bypassing our own room-validation logic. It is functionally equivalent to a master key — it must never ship inside frontend code, which anyone can inspect in their browser's dev tools.

---

## 21. SECURITY (interview-relevant only)

- **Firebase authentication** — identity is proven cryptographically, not via any shared secret between frontend and backend.
- **Backend token verification** — every protected request is independently re-verified server-side (Firebase Admin SDK), every time; there's no server-side session that "remembers" a browser is trusted.
- **Authorization** — currently minimal: any authenticated user can create/join any room they have the code for; there's no per-user role system yet.
- **LiveKit token generation** — happens only on the backend, only after room validation, using a secret the frontend never sees.
- **API secret protection** — `LIVEKIT_API_SECRET` and the Firebase service-account credential live only in backend environment configuration, never in frontend code.
- **CORS** — the backend explicitly allows only the known frontend origin, so a random third-party site can't call our API from a victim's browser using their session.
- **Room validation** — the actual authorization mechanism for meetings: a room must exist, be active, and not be expired before any video token is issued.
- **Why the frontend should never receive the LiveKit API secret** — see §20; it would let anyone bypass room validation entirely.

*(This is intentionally not a full audit — just the concepts worth being able to explain confidently.)*

---

## 22. IMPORTANT INTERVIEW QUESTIONS

### BEGINNER

**Q: What is AuraGuard?**
1. *Short answer:* "A video conferencing app with Firebase auth, LiveKit-powered video, and a backend-secured room system."
2. *Technical:* React + Express/MongoDB + LiveKit Cloud, communicating over REST, with the backend acting purely as an authorization gatekeeper for both room access and video-token issuance.
3. *Follow-up:* "What's the AI part?" → Be ready to pivot straight into §15's honest framing.

**Q: Why did you build it?**
1. *Short:* To build a real, secured real-time system end-to-end — not a toy CRUD app.
2. *Technical:* The interesting problems (auth trust boundaries, room security, keeping two SDKs' state in sync) are the kind that show up in real production systems.
3. *Follow-up:* "What was the hardest part?" → The room-casing/canonical-code bug (§6) or the auth-token-missing bug (§5) are both concrete, true stories.

**Q: What technologies are used?**
1. *Short:* React, Node/Express, MongoDB, Firebase, LiveKit.
2. *Technical:* see §2's full table.
3. *Follow-up:* "Why not [X]?" → Answer honestly per §25; say "inferred/reasonable" where no explicit decision record exists rather than inventing a justification.

### INTERMEDIATE

**Q: How does frontend communicate with backend?**
1. *Short:* Plain REST over HTTP, with a Firebase token attached to every request.
2. *Technical:* Axios interceptor fetches a fresh ID token per request; Express verifies it via Firebase Admin SDK before any controller runs.
3. *Follow-up:* "What if the token's expired?" → The SDK's `getIdToken()` call refreshes it transparently before returning it, since it's fetched fresh each time rather than cached.

**Q: How does authentication work?**
See §5 in full — sequence already given there.
*Follow-up:* "What's the difference between authentication and authorization here?" → §5's definition, applied concretely: authenticated = any real Firebase user; authorized = currently, that's the same thing, since there's no per-room permission system yet.

**Q: Why MongoDB?**
1. *Short:* Room data is a natural document, not a relational structure.
2. *Technical:* one Room = one document with an embedded participants array, no joins needed.
3. *Follow-up:* "Would Postgres have worked too?" → Yes, honestly — this schema has no relational complexity that would specifically favor one over the other; the choice predates the room-specific work.

**Q: Why Firebase?**
1. *Short:* Avoids building auth infrastructure myself.
2. *Technical:* client SDK + Admin SDK gives independently-verifiable tokens with no shared secret.
3. *Follow-up:* "How do you know a token wasn't forged?" → `verifyIdToken` checks the cryptographic signature against Firebase's own public keys — it's not just decoding the payload.

**Q: Why LiveKit?**
1. *Short:* Avoids building WebRTC signaling/SFU infrastructure myself.
2. *Technical:* managed SFU, handles NAT traversal and multi-participant scaling that raw WebRTC alone doesn't solve.
3. *Follow-up:* "What would break at scale without an SFU?" → A mesh topology (everyone connects directly to everyone) grows quadratically and falls apart past a handful of participants; an SFU keeps each participant's upload cost constant regardless of room size.

**Q: What is WebRTC?**
See §7 — full definition given there.

**Q: How does room creation work?**
See §6 in full.

### ADVANCED

**Q: How does LiveKit handle real-time video?**
1. *Short:* Via an SFU that forwards published tracks to subscribed participants.
2. *Technical:* §7's full explanation — publish → SFU forwards → subscribe → attach.
3. *Follow-up:* "Why not a mesh network?" → See the LiveKit answer above — doesn't scale past a few participants.

**Q: What is the difference between WebRTC and WebSocket?**
1. *Short:* WebRTC is peer-oriented real-time media transport; WebSocket is a persistent, bidirectional *messaging* channel, not itself a media protocol.
2. *Technical:* WebRTC connections are typically *negotiated* using some signaling channel (which is very often WebSocket-based, including in LiveKit's case) — but WebSocket by itself doesn't carry audio/video the way WebRTC's media transport does.
3. *Follow-up:* "So does LiveKit use WebSockets?" → See §7's dedicated answer — yes, internally for signaling, but that's entirely inside the SDK, not code we wrote.

**Q: How are LiveKit tokens generated?**
1. *Short:* Backend-only, after room validation, using a server-side secret.
2. *Technical:* the backend's LiveKit server SDK constructs a signed JWT locally (no network call to LiveKit needed to *sign* it) containing the room name, participant identity, and granted permissions, with a 1-hour expiry.
3. *Follow-up:* "Why sign it locally instead of asking LiveKit's API?" → JWT signing is just cryptography — it doesn't require a round trip to LiveKit; LiveKit's *server* validates the signature when the token is later used to connect.

**Q: Why shouldn't the API secret be on frontend?**
See §20 — full answer given there.

**Q: How does the system detect violations?**
Honest answer: **it doesn't yet** — this is the planned Violation Engine (§15/§18), not a built feature. Explain the *design* confidently, but don't imply it's running today.

**Q: How would the architecture scale?**
1. *Short:* The video path already scales independently (that's LiveKit's job); the REST/DB side would need standard measures.
2. *Technical:* multiple backend instances behind a load balancer (the code already anticipates running behind a reverse proxy — `trust proxy` is configured), a TTL index on room expiry instead of only filtering it at read time, and MongoDB Atlas for managed scaling of the database itself.
3. *Follow-up:* "What's the actual bottleneck right now?" → Honestly, none has been identified/tested — this is forward-looking reasoning, not a measured finding.

**Q: How would you handle multiple AI services?**
Design-level answer only (nothing built): likely as independent microservices (one per detection type — face, phone, toxicity, etc.), each reporting into the Violation Engine, so any one model can be swapped or scaled independently.

**Q: How would you reduce AI processing cost?**
Design-level: sample frames rather than processing every one (§16), and only run expensive audio analysis on speech segments rather than continuously.

**Q: How would you handle network failures?**
LiveKit has its own built-in reconnection behavior for the video connection. For the REST API side, `Not implemented` beyond a basic page-level error message today — there's no automatic retry-with-backoff for a failed room join, for example. Honest, not invented.

**Q: How would you prevent unauthorized room access?**
This is *already* implemented, not hypothetical: a room must exist, be `ACTIVE`, and not be expired in MongoDB before any LiveKit token is ever issued — see §6. A good follow-up to volunteer yourself: *"One gap I'm aware of is a legacy, unauthenticated token endpoint left over from before this validation existed — it's not used by the current app, but closing it off is on my list."*

---

## 23. "EXPLAIN MY PROJECT IN 60 SECONDS"

> "AuraGuard is a video conferencing app I built to work through a real distributed-systems problem, not just wire up a video call. The frontend's React, the backend's Node and Express with MongoDB, and the actual video and audio go through LiveKit Cloud — a managed WebRTC service — so my backend never touches media at all; its only job is deciding *whether someone's allowed in*.
>
> Authentication is Firebase — login happens entirely client-side, and every single API call carries a fresh, independently-verified token, so the backend never just trusts that a browser 'looks' logged in. The part I actually had to think hardest about was the room system: originally a room code was just a string with nothing behind it, so literally any guessed code would work. I rebuilt that so a room is a real database record with a status and an expiry, and the backend won't issue a video token until it's confirmed the room genuinely exists — including a subtle bug where two people typing the same code with different capitalization could end up in two *different* video rooms without any error, because the lookup needed to be case-insensitive but the actual video-room name couldn't be.
>
> On top of the core video call I added real-time chat and screen sharing, both routed through LiveKit's existing connection rather than any new infrastructure — chat rides its data channel, and screen share is just a second published video track.
>
> The AI-moderation side of the product — that's the part still ahead of me. I've got the pipeline designed conceptually: video and audio detection feeding into a violation engine that gives the host a decision, not an automatic removal — but none of that's built yet, and I'd rather say that clearly than pretend otherwise."

---

## 24. "EXPLAIN THE ARCHITECTURE ON A WHITEBOARD"

```
                         USER
                          │
                          ▼
                  React Frontend
                   /            \
                  /              \
                 ▼                ▼
          Express Backend     Firebase
             │        │       (Auth)
             │        └── verifies tokens
             │            issued by Firebase
        ┌────┴────┐
        ▼         ▼
    MongoDB    LiveKit Cloud
   (Room data)      │
                  WebRTC
                     │
            Other Participants


  (planned, not built yet — draw separately, off to the side)

  Video/Audio ──► Vision/Audio AI ──► Violation Engine ──► Host decides
```

**What to say while drawing it, step by step:**
1. Start at USER, draw the arrow into React Frontend — *"the browser only ever talks to two things: my backend, and Firebase directly."*
2. Draw the split to Express Backend and Firebase — *"Firebase handles who you are; my backend handles what you're allowed to do."*
3. Draw Backend → MongoDB — *"MongoDB is just room bookkeeping — does this room exist, is it still valid."*
4. Draw Backend → LiveKit Cloud, then Frontend → LiveKit Cloud directly — *"and this is the key thing — once the backend hands out a token, it steps out of the picture entirely. The actual video goes straight from browser to LiveKit's infrastructure, never through my server."*
5. Draw LiveKit → Other Participants → WebRTC label — *"LiveKit's the piece that actually moves audio/video between people in real time, using WebRTC underneath, at a scale a direct peer-to-peer mesh wouldn't handle."*
6. Then, *separately, clearly labeled as not-yet-built* — sketch the AI pipeline box off to the side and say exactly that: *"and this is the part I haven't built yet — the moderation layer this whole system is named for."* Drawing it honestly-separated is more credible than folding it into the main diagram as if it exists.

---

## 25. IMPORTANT "WHY" QUESTIONS

| Question | Honest Answer |
|---|---|
| Why React? | Declarative UI fits a screen with many independently-updating async pieces (video tiles reacting to SDK events). *Reasoning, not an explicit written project decision.* |
| Why Node/Express? | Lightweight REST framework, good fit for an I/O-bound backend (DB + token signing, no heavy compute). Pre-existing project choice, not decided during the room work specifically. |
| Why MongoDB? | Room data is naturally document-shaped (§13). *Inferred reasoning* — no explicit written comparison against alternatives exists in the project. |
| Why Firebase? | Avoids building auth infrastructure; gives independently-verifiable tokens with no shared secret between frontend/backend. |
| Why LiveKit? | Avoids building WebRTC signaling + SFU infrastructure myself — the standard, recommended approach for real-time video at any real scale. |
| Why WebRTC? | It's the underlying standard LiveKit is built on — not a separate choice we made independently. |
| Why not implement WebRTC ourselves? | Raw WebRTC gives you peer connections, not a scalable multi-party architecture, NAT traversal tooling, or reconnection handling — all of which LiveKit provides. Building that myself would be reinventing a hard, well-solved problem. |
| Why separate frontend/backend? | Standard separation of concerns — independent deployability, independent scaling, and a clean security boundary (secrets never need to touch the frontend at all). |
| Why backend-generated LiveKit tokens? | The signing secret must never be exposed to the browser (§20) — token minting has to happen somewhere the secret is safe, which is the backend. |
| Why OpenCV / YOLO / Speech-to-Text / separating detection from the Violation Engine? | All **design-stage reasoning only** — see §16–18. Answer these as *planned architecture*, not implemented decisions. |
| Why use cloud services (Firebase, LiveKit)? | Both solve genuinely hard, well-understood problems (identity, real-time media infra) that aren't the differentiating part of this product — building them from scratch would be a poor use of time relative to the actual value being added. |
| Why microservices for AI processing? | **Planned reasoning only** — independent detectors (vision, audio) could scale and be swapped independently if built as separate services reporting into one Violation Engine, rather than one monolithic AI module. Not implemented. |

---

## 26. KNOWN LIMITATIONS

- No dedicated AI/moderation layer exists yet — the product's core differentiator is still ahead.
- A legacy, unauthenticated LiveKit-token endpoint still exists on the backend, left over from before real room validation was built; it's not used by the current app but hasn't been removed.
- Chat has no persistence and no delivery confirmation.
- No dedicated participant-list UI beyond the video grid itself.
- No confirmed production deployment configuration (Vercel/Render/Atlas) — only local Docker containerization exists today.
- No automatic network-failure retry logic beyond LiveKit's own built-in reconnection behavior.

---

## 27. CURRENT STATUS

✅ **Working**
- Firebase authentication (email/password + Google)
- Backend-validated room creation and joining
- Two-way video and audio calling via LiveKit
- Camera/microphone toggle
- Real-time text chat (not persisted)
- Screen sharing

🟡 **In Progress / Present but not confirmed in active use**
- `socket.io` (installed, initialized, no confirmed feature using it)
- `@tanstack/react-query` (installed, wired, no actual query usage)
- Docker containerization (built and working locally, not deployed to any cloud host)

⏳ **Planned**
- AI moderation pipeline (vision + audio detection → Violation Engine → host decision)
- Cloud deployment (Vercel / Render / MongoDB Atlas)
- Dedicated participant-list UI
- Closing/removing the legacy unauthenticated token endpoint

❌ **Not implemented**
- Any actual OpenCV/YOLO/speech-to-text/Gemini/Hugging Face integration
- Automated participant removal based on AI detection (and this is intentional — the design explicitly keeps that decision with the host)
- The separate Python AI service (repo exists, contains no code)

---

*This document is intentionally conceptual. For file-level, code-level detail, see `AURAGUARD_DEVELOPER_INTERVIEW_DOCUMENTATION.md` in the same folder — but for interview prep specifically, this shorter document is the one to re-read.*
