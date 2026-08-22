# AuraGuard AI — Developer & Interview Documentation

**Source of truth:** This document was written by reading the actual current codebase (both `AuraGuard-AI-Backend` and `Frontend` repos) file by file — not from memory or prior conversation. Every claim below is either confirmed from real code (file path + function name given) or explicitly marked `Not confirmed from the current codebase.` Nothing here documents a planned feature as if it were built.

---

## 1. PROJECT OVERVIEW

**What AuraGuard AI is:** A video-conferencing web application built on LiveKit Cloud (WebRTC infrastructure), with Firebase-based authentication and a MongoDB-backed room system. The `package.json` description frames it as: *"AuraGuard AI backend - auth, meetings, moderation orchestration, and realtime delivery. AI inference lives in the separate AuraGuard-AI-Service (FastAPI) repo."*

**What problem it solves (as currently implemented):** Lets an authenticated user create a secure video meeting room and share a code with another authenticated user to join the same room, with the backend — not the browser — deciding whether a room actually exists before any video connection is attempted.

**What problem it is *intended* to eventually solve** (per product framing in copy, not code): AI-based moderation of live video meetings ("detect unsafe behavior... before it escalates" — marketing copy on the landing page). **This layer is not implemented.** See §26.

**Current functionality (implemented):** Firebase email/password + Google login, backend-validated room creation/joining, two-way video and audio via LiveKit, camera/mic toggle, real-time text chat over LiveKit's data channel, screen sharing.

**Current project stage:** A working video-calling product with real room validation and authentication. No AI/moderation logic exists yet. No production deployment configuration exists.

**What has actually been implemented:** See §26 for the authoritative implemented/partial/planned split.

### "Tell me about your AuraGuard project" — interview-ready answers

**30-second answer:**
"AuraGuard AI is a video conferencing app I built with React on the frontend and Node/Express on the backend, using LiveKit Cloud for the actual video and audio transport, MongoDB for room data, and Firebase for authentication. A user logs in with Firebase, creates a room — which the backend registers in MongoDB with a unique code and a 24-hour expiry — and shares that code. When someone else joins, the backend checks the room actually exists and is active before it ever issues a video token, then LiveKit handles the real-time media. I also built real-time chat and screen sharing on top of the same LiveKit connection."

**1-minute answer:**
"AuraGuard AI is a two-repo project: a React/Vite frontend and a Node/Express/MongoDB backend, with LiveKit Cloud doing the actual WebRTC work. Authentication is entirely Firebase — email/password and Google — and the frontend attaches a fresh Firebase ID token to every API call. The backend verifies that token with the Firebase Admin SDK before trusting any request.

The interesting engineering problem was room security: originally, a room code was just a string generated in the browser, so any code you typed was accepted — there was no way to tell a real room from a made-up one. I fixed that by making MongoDB the source of truth: creating a room inserts a document with a unique code and expiry, and joining a room requires the backend to look that document up, confirm it's active and not expired, *before* it will mint a LiveKit access token. Only then does the frontend connect to LiveKit for actual video.

On top of the working video/audio, I added text chat and screen sharing using LiveKit's own data channel and track-publishing APIs, so neither needed a separate backend service."

**2-minute technical answer:**
"AuraGuard AI has two separate codebases — a React 19 / Vite frontend and a Node/Express backend on MongoDB — that only talk to each other over a REST API under `/api/v1`. Video/audio itself doesn't go through my backend at all; it goes directly from browser to browser through LiveKit Cloud's SFU, which is the standard architecture for WebRTC at any real scale — you never want to relay video frames through your own app server.

Authentication is Firebase-only. The frontend's Axios client has a request interceptor that calls `user.getIdToken()` fresh on every single request and attaches it as a Bearer token — not cached anywhere in app state. The backend has a dedicated middleware that verifies that token with `admin.auth().verifyIdToken()` via the Firebase Admin SDK, and only after that succeeds does it trust `req.user.uid`. That's an important distinction I had to get right: the frontend being logged in doesn't mean the backend trusts it — every request is independently re-verified server-side.

For rooms, I built a Mongoose model with a unique `roomCode`, a `status` field (`ACTIVE`/`ENDED`), and a 24-hour `expiresAt`. Creating a room is a `POST /rooms/create` that only an authenticated user can call. Joining is two steps: the Join page calls `GET /rooms/validate/:roomCode` first — so an invalid code shows an error without ever touching LiveKit — and then the meeting page itself calls `POST /rooms/join`, which re-validates and, critically, generates the LiveKit token using the room code stored in MongoDB rather than whatever casing the user typed, because lookup is case-insensitive but LiveKit room names aren't — two users typing different casing of the same code would otherwise land in two different LiveKit rooms without realizing it.

Once connected, the LiveKit `Room` object lives in a React `useRef`, not `useState`, because storing a mutable SDK object in state caused stale-reference bugs. Camera and mic tracks are published via `LocalParticipant.setCameraEnabled`/`setMicrophoneEnabled`, and remote video/audio are read off `participant.videoTrackPublications` / `audioTrackPublications` — every participant, local or remote, exposes media the same way. Chat is JSON messages sent over LiveKit's own data channel (`publishData`/`RoomEvent.DataReceived`) on a dedicated topic, so it needed zero extra backend infrastructure. Screen sharing publishes a second video track via `setScreenShareEnabled`, and I explicitly disambiguate camera vs. screen-share tracks by `Track.Source` so a participant's camera tile can never accidentally show their shared screen."

---

## 2. COMPLETE ARCHITECTURE

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   FRONTEND (React)  │  REST  │   BACKEND (Express)   │        │    MongoDB      │
│  localhost:5173      │◄──────►│   localhost:5000       │◄──────►│  auraguard_ai   │
│                      │  /api/v1│  (source of truth for │        │  (Room docs)    │
│  - React 19 + Vite   │        │   whether a room       │        └─────────────────┘
│  - Firebase client   │        │   exists)               │
│  - LiveKit client    │        │  - Express + Mongoose   │        ┌─────────────────┐
└─────────┬────────────┘        │  - Firebase Admin SDK   │◄──────►│  Firebase Auth  │
          │                     │  - LiveKit server SDK   │  verify│  (Google cloud) │
          │  direct WebRTC      └─────────────┬────────────┘ token │                 │
          │  (video/audio/data,               │ mints token         └─────────────────┘
          │   NOT through the                 │
          │   Node backend)                   ▼
          │                          ┌──────────────────┐
          └─────────────────────────►│   LiveKit Cloud   │
                                      │  wss://...livekit  │
                                      │  .cloud (SFU)       │
                                      └──────────────────┘
```

**Frontend** — React app the user's browser runs. Owns: UI, Firebase client SDK (login), the LiveKit *client* SDK (joins the room, publishes/subscribes tracks), and an Axios client that talks to the backend.

**Backend** — Express server. Owns: room persistence (MongoDB), Firebase token *verification* (not login — it never sees a password), and LiveKit *token generation* (using a server-only secret, never exposed to the browser).

**Database (MongoDB)** — stores exactly one thing relevant to this project: `Room` documents (§10). It never stores video/chat content.

**LiveKit** — a separate, third-party managed WebRTC infrastructure (a Selective Forwarding Unit / SFU). Once the frontend has a token from the backend, it connects **directly** to LiveKit's own server — video/audio/chat data never passes through the AuraGuard Node backend.

**Firebase** — Google's identity platform. Frontend uses the *client* SDK to authenticate the user and obtain short-lived ID tokens. Backend uses the *Admin* SDK, with a service-account credential, purely to verify those tokens — the backend has no login endpoint of its own for this flow.

### How the two separate applications actually communicate
They are two independent Node processes with **no shared code, memory, or process** — the *only* channel between them is HTTP. The frontend's `apiClient.js` (`src/config/apiClient.js`) is an Axios instance pointed at `VITE_API_BASE_URL` (confirmed value used during development: `http://localhost:5000/api/v1`). Every request goes out as a plain HTTP call; the backend's Express `app.js` receives it, routes it, and responds with JSON. CORS (`cors({ origin: env.clientUrl, credentials: true })` in `src/app.js`) is what allows the browser (a different origin/port) to make that call at all.

### REST API vs. Real-time communication (both are used, for different things)
- **REST API** (`/api/v1/rooms/*`) — request/response, stateless, used for anything transactional: "does this room exist," "create this room," "give me a video token." Implemented with Express + Mongoose.
- **Real-time communication** — once a LiveKit token is issued, the *frontend* opens a persistent WebSocket-based connection **directly to LiveKit**, not to the Node backend. Video, audio, and chat data packets all flow over this connection. The Node backend is not involved in this traffic at all after issuing the token.

**Why this architecture (backend never touches media)?** Relaying live video/audio through a general-purpose app server does not scale and adds latency; SFU architectures like LiveKit exist specifically so app backends stay out of the media path and only handle authorization (who is allowed to join, via short-lived tokens).

---

## 3. FRONTEND DOCUMENTATION

**Stack:** React 19.1.1, Vite 7 (dev server + bundler), React Router DOM 7 (routing), Zustand 5 (small global stores), @tanstack/react-query 5 (installed and wired via a `QueryClientProvider`, but **no query/mutation calls were found anywhere in the codebase during this review** — see §20/§26), Tailwind CSS 3 (styling), Firebase JS SDK 12 (auth), livekit-client 2.21 (WebRTC), Axios (HTTP), react-hook-form + Zod (forms), framer-motion (animation), react-icons (`Fi*` Feather icons).

### Entry point & providers
- `src/main.jsx` — mounts `<App />` inside `React.StrictMode` (this matters — see §4, StrictMode double-invokes effects in dev, which caused a real bug).
- `src/App.jsx` — calls `useAuthListener()` (a hook with no return value, just a side effect) then renders `<AppProviders><AppRoutes /></AppProviders>`.
- `src/AppProviders.jsx` — wraps the app in `<QueryClientProvider client={queryClient}>`. `queryClient` (`src/config/queryClient.js`) is configured with `refetchOnWindowFocus: false`, `retry: 1`, `staleTime: 30_000`. **This provider exists but no component in the codebase currently calls `useQuery`/`useMutation`** — react-query is installed and wired but not yet used for any data fetching found in this review.
- `src/hooks/useAuthListener.js` — subscribes to Firebase's `onAuthStateChanged` (via `subscribeToAuthChanges`) once, on mount, and forwards every auth-state change into the Zustand auth store's `setUser`. This is the **only** place that writes to the auth store — every login/logout/token-refresh event in Firebase flows through here automatically.

### Routing (`src/routes/index.jsx`)
`BrowserRouter` + `<Routes>`. Route table:
| Path | Component | Notes |
|---|---|---|
| `/` | `RootRedirect` (inline) | Redirects to `/dashboard` or `/auth/login` based on `isAuthenticated` |
| `/landing` | `LandingPage` | Public marketing page |
| `/auth/login` | `LoginPage` | Public |
| `/auth/register` | `RegisterPage` | Public |
| `/dashboard`, `/reports`, `/profile`, `/create-room`, `/join-room` | wrapped in `AppLayout` | Sidebar+Navbar shell |
| `/meeting/:roomName` | `MeetingRoom` | **Not** wrapped in `AppLayout` — renders its own full-screen layout; note the path is hardcoded as a literal string, not read from `ROUTES` |
| `*` | redirects to `/dashboard` | Catch-all |

Route path constants live in `src/constants/routes.constants.js` (a plain object, e.g. `login: '/auth/login'`).

### State management
Two small Zustand stores, no Redux, no Context API used for app data:
- `src/store/auth.store.js` — `{ user, isAuthenticated, isAuthLoading, setUser, clearAuth }`. **Does not store a token.** This is deliberate/necessary — see §7.
- `src/store/ui.store.js` — `{ sidebarOpen, theme, setSidebarOpen, toggleSidebar, setTheme }`. Purely UI chrome state (mobile sidebar open/close); `theme` field exists but is not read anywhere found in this review (styling is fixed via Tailwind classes directly, not a runtime theme switch).

Everything meeting-related (LiveKit `Room` instance, participants, chat messages, screen-share state) is **local component state / refs / custom hooks inside `MeetingRoom.jsx`**, not global state.

### FILE: `src/pages/MeetingRoom.jsx`
**Responsibility:** The entire meeting screen — connects to LiveKit, renders the video grid, controls bar, and chat panel.

**Important state:**
- `roomRef` (`useRef(null)`) — holds the live `livekit-client` `Room` instance. **Deliberately a ref, not `useState`** (see §4 for the `useRef` vs `useState` reasoning).
- `remoteParticipants` (`useState([])`) — array of `RemoteParticipant` instances, refreshed by re-reading `room.remoteParticipants.values()` whenever a relevant LiveKit event fires.
- `chatOpen`, `lastReadChatCount` — chat panel visibility + unread-count bookkeeping.
- `isLoading`, `error`, `roomConnected`, `copiedToClipboard` — page/connection UI state.

**Important functions:**
- The connect `useEffect` (the largest block in the file) — calls `joinRoom(roomName, displayName)` (the backend API), constructs `new Room()`, registers ~9 `room.on(RoomEvent.X, ...)` listeners (`LocalParticipantConnected`, `ParticipantConnected`, `ParticipantDisconnected`, `TrackSubscribed`, `TrackUnsubscribed`, `TrackMuted`, `TrackUnmuted`, `Disconnected`, `ConnectionLost`), then calls `room.connect(serverUrl, token, { autoSubscribe: true })`, then `room.localParticipant.setCameraEnabled(true)` and `setMicrophoneEnabled(true)`.
- `handleLeave` — `roomRef.current.disconnect()` then navigates to `/dashboard`.
- `handleToggleChat` — toggles `chatOpen`.

**Data flow:** `useParams()` gives `roomName` from the URL → `joinRoom()` API call → LiveKit `Room` created and connected → child components (`VideoGrid`, `MeetingControls`, `ChatPanel`) receive `room={roomRef.current}` as a prop and read live state directly off the SDK object, not off React state that mirrors it.

**Key implementation decision — the StrictMode guard:** Because `main.jsx` renders inside `<React.StrictMode>`, React (in dev) intentionally mounts, unmounts, then remounts every effect once. Without guarding this, the connect effect would run twice, opening two LiveKit connections from one browser tab. The effect uses a closure-local `let cancelled = false; let room = null;`, checks `if (cancelled) return;` after every `await`, disconnects the **effect's own** `room` variable in cleanup (not `roomRef.current`, which a second effect run may have already overwritten), and ignores the room's own `Disconnected` event when `cancelled` is true. **This is confirmed present in the current file, unchanged since it was written.**

### FILE: `src/components/meeting/MeetingControls.jsx`
**Responsibility:** The bottom control bar — Mic, Camera, Screen Share, Chat, Leave buttons.

**Props:** `room`, `onLeave`, `chatOpen`, `onToggleChat`, `unreadChatCount`, `isScreenSharing`, `onToggleScreenShare`.

**State:** `isMicEnabled`, `isCameraEnabled` — **not** driven by button clicks directly; a `useEffect` reads the actual state off `localParticipant.videoTrackPublications`/`audioTrackPublications` and subscribes to `'trackMuted'`, `'trackUnmuted'`, `'trackPublished'` participant events to stay in sync, so the UI reflects what LiveKit actually did, not an optimistic guess.

**Important functions:** `handleToggleMic`/`handleToggleCamera` call `localParticipant.setMicrophoneEnabled(newState)` / `setCameraEnabled(newState)` directly on the SDK object.

**Implementation detail worth knowing for an interview:** the Chat and Screen Share buttons are plain `<button>` elements with hand-written Tailwind classes, **not** the shared `Button` component (`src/components/ui/Button.jsx`). Reason (in a code comment, confirmed in the file): `Button`'s variants (`secondary`/`ghost`/`danger`) are light-colored, but this control bar has a dark background (`bg-slate-900/50`), and the project's `mergeClassNames` helper (`src/utils/helpers.js`) is a **plain string join with no Tailwind-merge/deduplication** — `classes.filter(Boolean).join(' ')` — so a `className` override passed to `Button` could not reliably win a CSS-cascade conflict against the variant's own `bg-*` classes. **Known, unaddressed side effect:** the pre-existing Mic-Off/Camera-Off buttons *do* still use `Button`'s `danger` variant and therefore render with reduced contrast on this dark bar — this is a real, currently-unfixed cosmetic issue, not a functional one.

### FILE: `src/components/meeting/VideoGrid.jsx`
**Responsibility:** Lays out one tile per participant (camera) and, when active, one large tile for a screen share.

**Important logic:**
- `displayParticipants` (`useMemo`) — combines `room.localParticipant` and the `remoteParticipants` prop into `[{ participant, isLocal }, ...]`. **Participants are wrapped in an object, never spread** (`{...participant}` would strip the class instance's prototype/methods — a real bug that was found and fixed; the comment explaining this is present in the current file).
- `screenShareEntry` (`useMemo`) — scans every displayed participant's `videoTrackPublications` for one whose `source === Track.Source.ScreenShare`; if found, that participant's screen is rendered via `ScreenShareTile` above a shrunk horizontal strip of camera thumbnails; if not found, the original full-height camera grid renders unchanged.
- The `localScreenSharing` prop exists **solely** as a `useMemo` dependency-array trigger — its value is never read in the memo body. It exists because toggling the *local* user's screen share doesn't change `room.localParticipant`'s object reference or the `remoteParticipants` array, so without an extra trigger the grid wouldn't notice the local user started/stopped sharing.

### FILE: `src/components/meeting/VideoTile.jsx`
**Responsibility:** Renders exactly one participant's camera feed (+ audio, for remote participants only).

**Important logic:**
- `preferredTrack(publications, preferredSource)` — iterates a participant's `videoTrackPublications` (or `audioTrackPublications`) Map, remembers the first track it sees as a fallback, but returns immediately if it finds one whose `.source` matches the requested `Track.Source` (`Camera` or `Microphone`). This exists because once screen sharing publishes a *second* video track for the same participant, "just take whichever publication is first" becomes ambiguous.
- **Confirmed critical fact, directly from the code comment:** there is **no `videoTrackSubscriptions`/`audioTrackSubscriptions` property** in the installed `livekit-client` — the correct API is `videoTrackPublications`/`audioTrackPublications`, taking `.track` off the publication once it's populated (on subscribe, for remote; on publish, for local).
- `videoTrack.attach(videoElement)` / `.detach(videoElement)` — attaches the MediaStreamTrack to an actual `<video>` DOM element. **Detach is always called with the specific element**, not bare `.detach()`, because a bare call detaches the track from *every* element it's attached to, not just this one.
- `participantName` — resolution chain: `participant.name` → parse `participant.metadata` as JSON and use `.displayName`/`.email` → `participant.identity`. This chain exists because the installed `livekit-server-sdk` version can't set `name` on a token (see §11), so the backend puts the display name in `metadata` instead.

### FILE: `src/features/meetings/pages/CreateRoomPage.jsx`
Auth-guarded (`useEffect` redirects to login if `!user`). `handleGenerateRoom` calls `createRoom()` (the API function, not a local generator) and displays the returned `roomCode`. `handleJoinRoom` navigates to `/meeting/${roomCode}`.

### FILE: `src/features/meetings/pages/JoinRoomPage.jsx`
Auth-guarded the same way. `handleJoinRoom` first does a **client-side format check** (`isValidRoomName`, a regex `^[a-zA-Z0-9-]+$`, from `src/utils/roomNameGenerator.js` — this file also still exports a `generateRoomName()` function that is **no longer called anywhere**, dead code left over from before room creation moved server-side), then calls `validateRoom(roomCode)` (a real backend call). On success it navigates using **the server's returned canonical `roomCode`**, not the string the user typed — this is deliberate (see §9).

### FILE: `src/services/roomApi.js`
Four functions, all thin wrappers around `apiClient`:
- `createRoom(displayName)` → `POST /rooms/create`
- `joinRoom(roomCode, displayName)` → `POST /rooms/join`
- `validateRoom(roomCode)` → `GET /rooms/validate/:roomCode`
- `getRoomToken`/`getToken` → `POST /rooms/token` (legacy, unauthenticated — kept for backward compatibility, not called by any current page)

Each of the three main functions catches a 401 and rethrows a clearer `Error('Authentication required. Please login first.')`.

### FILE: `src/config/apiClient.js`
An Axios instance (`baseURL: env.apiBaseUrl`, `withCredentials: true`) whose request interceptor is `async`: it calls `auth.currentUser?.getIdToken()` **fresh, on every single outgoing request**, and sets `Authorization: Bearer <token>`. Nothing is cached — this is what guarantees the token is never stale.

### Routing / Auth wiring summary
`useAuth()` (`src/hooks/useAuth.js`) is a thin selector over the Zustand auth store (via `useShallow`, to avoid unnecessary re-renders). It never talks to Firebase directly — it only reads whatever `useAuthListener` last wrote.

---

## 4. REACT CONCEPTS USED IN THE PROJECT

### `useState`
Used everywhere for simple local UI/data state (`isLoading`, `error`, `remoteParticipants`, form drafts, etc.). **Nothing surprising** — standard usage throughout.

### `useRef`
**Where:** `roomRef` in `MeetingRoom.jsx` holds the LiveKit `Room` instance. Also used for DOM refs (`videoRef`/`audioRef` in `VideoTile.jsx`/`ScreenShareTile.jsx`, `scrollRef` in `ChatPanel.jsx`) and for a `seenIds` Set in `useLiveKitChat.js` that must survive re-renders without itself triggering one.
**Why `useRef` instead of `useState` for the Room instance specifically:** The LiveKit `Room` is a mutable SDK object with internal state (Maps of tracks/participants) that changes without React knowing. Storing it in `useState` doesn't make React re-render when its *internal* state changes (only when you call the setter with a new reference), so it produced stale-UI bugs. A ref avoids implying to future readers that assigning to it will trigger a re-render — instead, the code deliberately pairs ref mutation with an *unrelated* `setState` call (e.g., `setRoomConnected(true)`) to force the re-render that lets children read the ref's current value.
**What would happen if removed:** Reverting to `useState(room)` for the Room instance would reintroduce the original staleness bug this project already hit and fixed.
**Interview question:** *"Why did you use `useRef` here instead of `useState`?"* → "Because the Room object mutates internally in ways React can't observe, and I don't want a state setter that implies 'assigning this triggers a re-render' when it doesn't — I trigger re-renders explicitly via other state instead."

### `useEffect`
Used extensively: the LiveKit connect/cleanup effect (`MeetingRoom.jsx`), track-state sync effects (`MeetingControls.jsx`, `useScreenShare.js`), data-channel listener registration (`useLiveKitChat.js`), DOM track attach/detach (`VideoTile.jsx`, `ScreenShareTile.jsx`), auth-redirect guards (`CreateRoomPage.jsx`, `JoinRoomPage.jsx`), scroll-to-bottom (`ChatPanel.jsx`), and the one-time Firebase auth subscription (`useAuthListener.js`).
**Cleanup functions** are used correctly and are load-bearing in several places: the connect effect's cleanup disconnects the LiveKit room; `VideoTile`'s video-attach effect's cleanup calls `.detach(videoElement)`; `useLiveKitChat`'s effect cleanup calls `room.off(RoomEvent.DataReceived, handleData)`.
**What would happen if a cleanup function were removed:** e.g., removing the `.detach()` cleanup in `VideoTile` would leave a track attached to a `<video>` element that's since been unmounted/reused, causing duplicate or ghost video rendering when a participant list changes.
**Interview question:** *"Why does every `useEffect` here that attaches a LiveKit track also return a cleanup function?"* → "Because LiveKit tracks are attached imperatively to DOM elements outside React's normal render cycle, so React unmounting or re-rendering a component doesn't automatically detach them — I have to do that myself in cleanup, or the SDK keeps pushing frames into a DOM node React thinks no longer exists."

### `useMemo`
**Where:** `VideoGrid.jsx` — `displayParticipants`, `screenShareEntry`, `gridColsClass`.
**Why:** These are derived from participant/track data on every render; `useMemo` avoids rebuilding these arrays/objects when nothing relevant changed, and — more importantly for `displayParticipants` — the dependency array is the actual mechanism controlling *when* the grid recomputes, including the deliberate `localScreenSharing` trigger-only dependency described in §3.
**What would happen if removed:** Functionally the grid would still work (it would just recompute on every render), but the deliberate trigger pattern for local-screen-share detection would need a different mechanism.

### `useCallback`
**Where:** `sendMessage` in `useLiveKitChat.js`, `toggle` in `useScreenShare.js`.
**Why:** Both are returned from a custom hook and consumed as event handlers passed down through props; wrapping them keeps their identity stable across re-renders when their dependencies (`room`, `isSharing`) haven't changed.

### Custom hooks
- `useAuth` — thin selector over the auth Zustand store.
- `useAuthListener` — side-effect-only hook, wires Firebase's `onAuthStateChanged` into the store.
- `useLiveKitChat(room)` — encapsulates chat state + send/receive logic.
- `useScreenShare(room)` — encapsulates screen-share state + toggle logic.
**Why custom hooks here specifically:** both `useLiveKitChat` and `useScreenShare` needed their own `useEffect`-registered LiveKit event listeners, independent of (and without modifying) the large, StrictMode-guarded connect effect in `MeetingRoom.jsx` — extracting them into hooks let two new features be added without touching the most fragile part of the codebase.

### Context API
**Not used for application state.** The only context in the tree is `@tanstack/react-query`'s `QueryClientProvider` (installed, wired, currently unused for actual queries — see §3).

### Conditional rendering
Used throughout: auth-loading spinners, error banners, `showPlaceholder` (camera-off avatar) in `VideoTile`, `screenShareEntry ? ... : ...` branch in `VideoGrid`, `!isOpen ? null : ...` early return in `ChatPanel`.

### Event handling
Standard React synthetic events (`onClick`, `onChange`, `onKeyDown`) throughout forms and buttons; e.g. `ChatPanel`'s `handleKeyDown` checks `e.key === 'Enter' && !e.shiftKey` to send on Enter but allow Shift+Enter (though the input is a single-line `<input>`, not a `<textarea>`, so Shift+Enter has no visible multi-line effect currently — worth noting as a minor inconsistency, not a bug).

### Component lifecycle (in modern/functional terms)
Mount → effects run → user interacts → state updates → re-render → (on unmount) cleanup functions run. The project's most important lifecycle-sensitive code is the StrictMode-safe connect effect described in §3 — a textbook case of getting mount/remount/unmount ordering wrong causing a real production-observed bug (duplicate LiveKit connections).

---

## 5. BACKEND DOCUMENTATION

**Stack:** Node.js (≥18), Express 4.19, Mongoose 8.5 (MongoDB ODM), firebase-admin 12, livekit-server-sdk (declared `^0.4.4`, resolves to `0.4.10`), Zod 3 (validation), Winston (logging), Helmet + CORS + express-rate-limit (security middleware), jsonwebtoken + bcrypt (a **separate, legacy** auth system — see §7).

### Server startup (`src/server.js`)
1. `require('./config/firebase-admin')` — initializes the Firebase Admin SDK **before anything else**, at module-load time.
2. `connectDB()` (from `src/config/db.js`) — `mongoose.connect(env.mongo.uri)`, exits the process (`process.exit(1)`) if it fails.
3. `initSocket(httpServer)` + `registerSocketHandlers(io)` — sets up `socket.io` on the same HTTP server. **Note:** confirmed present in `server.js`, but its internal handlers were not opened in this review — treat as `Not confirmed from the current codebase` whether socket.io is used by any currently-built feature (it is not used by rooms/video/chat, which all go through LiveKit or REST).
4. `registerJobs()` — scheduled/background jobs; internals not opened in this review.
5. `httpServer.listen(env.port, ...)`.
6. Graceful shutdown on `SIGTERM`/`SIGINT`: closes the HTTP server, then `disconnectDB()`, with a 10-second forced-exit timeout as a safety net.

### Express app setup (`src/app.js`)
```
app.set('trust proxy', 1)
  → helmet()
  → cors({ origin: env.clientUrl, credentials: true })
  → express.json({ limit: '10mb' })
  → express.urlencoded({ extended: true, limit: '10mb' })
  → cookieParser(env.cookieSecret)
  → requestLogger
  → apiLimiter                         (global rate limiter, applies to ALL routes)
  → GET /health                        (unversioned health check)
  → /api/v1/docs                       (Swagger UI)
  → /api/v1/*                          (v1Routes — everything else)
  → notFoundHandler                    (404 for anything unmatched)
  → errorHandler                       (must be last — catches everything)
```

### Route mounting (`src/routes/v1/index.js`)
Confirmed module routers mounted at `/api/v1`: `/auth`, `/users`, `/meetings`, `/rooms`, `/ai-monitoring`, `/violations`, `/moderation`, `/reports`, `/notifications`, `/dashboard`, `/admin`, `/settings`, `/audit-logs`. **Only `/rooms` was opened and reviewed in depth for this document.** The other modules exist and are mounted but their internal implementation was not read — do not describe their behavior; if asked, say "exists, not reviewed."

### FILE: `src/modules/rooms/room.model.js`
Mongoose schema for a `Room` document — see §10 for full field list. **Responsibility:** the single source of truth for whether a room exists, is active, and hasn't expired.

### FILE: `src/modules/rooms/room.service.js`
**Functions:** `generateRoomCode()` (pure, no I/O — picks a random adjective + 6-char base36 suffix), `createRoom(userId, userEmail)` (loops generating codes until one is unique in the DB, saves a new `ACTIVE` room with a 24h `expiresAt`), `getRoomByCode(roomCode)` (case-insensitive, regex-escaped lookup; throws `ApiError.notFound`/`badRequest` for missing/inactive/expired rooms), `addParticipantToRoom(roomCode, userId, userEmail)` (pushes into `participants[]` if not already present), `endRoom(roomCode)` (sets `status: 'ENDED'` — **defined but not wired to any route**, see §15), `escapeRegex(value)` (private helper, prevents a room code from being interpreted as a regex pattern).

### FILE: `src/modules/rooms/room.controller.js`
**Functions:** `createRoom`, `joinRoom`, `validateRoom`, `generateToken` (legacy) — see §6 for full request/response detail on each. **Key implementation detail:** `joinRoom` never trusts the room-code casing from the request body for anything security-relevant after the initial lookup — it re-derives `canonicalRoomCode = room.roomCode` from the DB result and uses *that* for the participant record, the LiveKit grant, and the response.

### FILE: `src/modules/rooms/room.routes.js`
```js
router.post('/token', validate(generateTokenSchema), roomController.generateToken);           // NO auth
router.post('/create', authenticateFirebaseUser, validate(createRoomSchema), roomController.createRoom);
router.post('/join', authenticateFirebaseUser, validate(joinRoomSchema), roomController.joinRoom);
router.get('/validate/:roomCode', authenticateFirebaseUser, roomController.validateRoom);
```

### FILE: `src/modules/rooms/room.validator.js`
Three Zod schemas (`generateTokenSchema`, `createRoomSchema`, `joinRoomSchema`) — all simple string-length constraints, no complex validation logic.

### FILE: `src/middlewares/firebase-auth.middleware.js`
`authenticateFirebaseUser` — extracts `Authorization: Bearer <token>`, calls `admin.auth().verifyIdToken(token)`, sets `req.user = { _id: uid, uid, email, name, isFirebaseUser: true }` and `req.firebaseUser = decodedToken`. On failure: 401 with a specific message for missing token / expired token (`auth/id-token-expired`) / invalid token (`auth/invalid-id-token`) / generic failure. **Logs are non-secret** — logs booleans and the UID/email, never the token itself.

### FILE: `src/middlewares/auth.middleware.js` (legacy, separate system)
`authenticate` — reads a Bearer token or an `accessToken` cookie, verifies it as a **custom JWT** via `verifyAccessToken()` (`src/utils/generateToken.js`, uses `JWT_ACCESS_SECRET`), then looks up `User.findById(payload.sub).select('-password')` in MongoDB and checks `.isActive`. **This is not used by the rooms module** — it verifies a different kind of token entirely (an app-issued JWT, not a Firebase ID token) and would reject a Firebase token outright, since Firebase tokens aren't signed with `JWT_ACCESS_SECRET`.

### FILE: `src/config/firebase-admin.js`
Initializes `firebase-admin` once at require-time: `admin.initializeApp({ projectId: env.firebaseProjectId })`. Credential discovery relies on the standard `GOOGLE_APPLICATION_CREDENTIALS` environment variable (Google's own convention, not custom code in this file) pointing at a service-account JSON file.

### FILE: `src/services/livekit.service.js`
`generateRoomToken(roomName, userId, displayName, extraMetadata)` — constructs a LiveKit `AccessToken` with `identity`, `metadata: JSON.stringify({ displayName, ...extraMetadata })`, `ttl: 3600`; grants `{ room, roomJoin: true, canPublish: true, canPublishData: true, canSubscribe: true }`; returns the signed JWT + the configured `serverUrl`. **`name` is not passed** — a code comment confirms the installed SDK version doesn't support it, so `metadata` carries the display name instead.

### FILE: `src/utils/ApiError.js`
A custom `Error` subclass with static factory methods: `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.unprocessable()`, `.internal()`. Each sets a `statusCode`, `details`, `isOperational`, and `success: false`.

### FILE: `src/utils/ApiResponse.js`
Wraps every success response in a consistent shape: `{ success: true, statusCode, message, data, meta? }`, sent via `.send(res)` which calls `res.status(statusCode).json(this)`.

### FILE: `src/utils/catchAsync.js`
A one-line wrapper: `(fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)` — lets every controller be written as an `async` function without a manual `try/catch`, forwarding rejections to Express's error-handling middleware.

### FILE: `src/middlewares/error.middleware.js`
Central error handler. `normalizeError()` converts Mongoose `ValidationError`/`CastError`/duplicate-key (`code: 11000`) errors and JWT errors (`JsonWebTokenError`/`TokenExpiredError`) into a consistent `ApiError` shape before responding. Final response shape: `{ success: false, message, details, stack (only when NODE_ENV === 'development') }`. Operational errors are logged as warnings; non-operational (unexpected) errors are logged as errors with the full stack.

### FILE: `src/middlewares/validate.middleware.js`
`validate(schema, part = 'body')` — runs `schema.safeParse(req[part])`; on failure, builds a `{ field, message }[]` list from Zod's issues and passes a `422 Unprocessable Entity` `ApiError` to `next()`. On success, replaces `req[part]` with the parsed (and therefore type-coerced/defaulted) data.

### Complete request lifecycle (rooms)
```
HTTP Request
  → helmet / cors / json-parser / cookie-parser / requestLogger / apiLimiter  (app.js, global)
  → Express router match (/api/v1/rooms/...)
  → authenticateFirebaseUser middleware   (verifies Firebase ID token, sets req.user)
  → validate(schema) middleware            (Zod-validates req.body/req.params)
  → controller function                    (room.controller.js)
  → service function                       (room.service.js — talks to MongoDB via Mongoose)
  → [for join: also calls livekit.service.js to mint a token]
  → ApiResponse(...).send(res)             (success)
     — or, on any thrown error anywhere above —
  → error.middleware.js                    (normalizes + sends a consistent error JSON)
```

---

## 6. API DOCUMENTATION

All endpoints below are confirmed live in `src/modules/rooms/room.routes.js`. Base path: `/api/v1`.

### `POST /api/v1/rooms/create`
- **Purpose:** Register a new room in MongoDB and return its unique code.
- **Authentication:** Required — Firebase Bearer token (`authenticateFirebaseUser`).
- **Request body:** `{ displayName?: string (1-128 chars) }` — validated by `createRoomSchema`.
- **Response (201):** `{ success: true, statusCode: 201, message: "Room created successfully", data: { roomCode, roomName, hostEmail, status, createdAt, expiresAt } }`
- **Possible errors:** 401 (missing/invalid/expired Firebase token), 422 (validation failure), 500 (unexpected).
- **Frontend caller:** `createRoom(displayName)` in `src/services/roomApi.js`, called from `CreateRoomPage.jsx`'s `handleGenerateRoom`.
- **Backend handler → controller → service:** `room.routes.js` → `roomController.createRoom` → `roomService.createRoom(userId, userEmail)`.
- **Database interaction:** loops `Room.findOne({ roomCode })` until a generated code is unique, then `new Room({...}).save()`.
- **LiveKit interaction:** none — no token is issued at this step.

### `POST /api/v1/rooms/join`
- **Purpose:** Validate a room, register the caller as a participant, and mint a LiveKit access token for it.
- **Authentication:** Required — Firebase Bearer token.
- **Request body:** `{ roomCode: string (1-128), displayName?: string (1-128) }` — validated by `joinRoomSchema`.
- **Response (200):** `{ success: true, data: { token, serverUrl, roomCode (canonical DB casing), roomName } }`
- **Possible errors:** 404 `"Room not found"`, 400 `"Room is no longer active"` / `"Room has expired"`, 401 (auth), 422 (validation).
- **Frontend caller:** `joinRoom(roomCode, displayName)` in `roomApi.js`, called from `MeetingRoom.jsx`'s connect effect (**not** from `JoinRoomPage.jsx` — that page only *validates*; the actual token request happens once the user lands on `/meeting/:roomName`).
- **Backend handler → controller → service:** `room.routes.js` → `roomController.joinRoom` → `roomService.getRoomByCode` + `roomService.addParticipantToRoom` → `liveKitService.generateRoomToken`.
- **Database interaction:** case-insensitive `Room.findOne` (via regex), then `room.participants.push(...)` + `room.save()` if the user isn't already listed.
- **LiveKit interaction:** builds an `AccessToken` (identity = `${firebaseUid}-${randomSuffix}`), grants room-join/publish/subscribe permissions, signs it.

### `GET /api/v1/rooms/validate/:roomCode`
- **Purpose:** Check a room exists/is active *before* navigating the user into the meeting UI at all.
- **Authentication:** Required — Firebase Bearer token.
- **Request:** `roomCode` as a URL param.
- **Response (200):** `{ success: true, data: { roomCode, status, expiresAt } }`
- **Possible errors:** 404 `"Room not found"`, 400 (inactive/expired), 401 (auth).
- **Frontend caller:** `validateRoom(roomCode)` in `roomApi.js`, called from `JoinRoomPage.jsx`'s `handleJoinRoom` **before** navigation.
- **Backend handler → controller → service:** `room.routes.js` → `roomController.validateRoom` → `roomService.getRoomByCode`.
- **Database interaction:** read-only `Room.findOne` (regex, case-insensitive).
- **LiveKit interaction:** none.

### `POST /api/v1/rooms/token` — legacy, unauthenticated
- **Purpose:** Historical/legacy way to get a LiveKit token for *any* room name, no existence check.
- **Authentication:** **None.**
- **Request body:** `{ roomName: string (1-128), displayName?: string (1-128) }`.
- **Response (200):** `{ success: true, data: { token, serverUrl, roomName } }`
- **Frontend caller:** `getRoomToken`/`getToken` in `roomApi.js` — **exported, but not called from any page currently reviewed.**
- **Security note:** this endpoint bypasses the entire room-validation system built for the other three endpoints. See §18.

### Complete step-by-step flow — Create Room
```
User clicks "Generate Room Code" (CreateRoomPage.jsx)
  → handleGenerateRoom()
  → createRoom() [roomApi.js]
  → apiClient.post('/rooms/create', { displayName })
  → Axios request interceptor: auth.currentUser.getIdToken() → Authorization header attached
  → HTTP POST http://localhost:5000/api/v1/rooms/create
  → Express: helmet/cors/json/cookies/logger/rateLimit
  → authenticateFirebaseUser: admin.auth().verifyIdToken() → req.user set
  → validate(createRoomSchema): parses req.body
  → roomController.createRoom: reads req.user._id/email
  → roomService.createRoom: generates unique code, saves Room doc
  → ApiResponse(201, ...).send(res)
  → axios resolves → response.data.data
  → setRoomCode(roomInfo.roomCode) → UI displays the code
```

---

## 7. AUTHENTICATION & AUTHORIZATION

**Authentication** answers "who are you" — handled entirely by Firebase. **Authorization** answers "are you allowed to do this" — in this project, authorization is currently minimal: *any* successfully authenticated Firebase user can create or join *any* room they know the code for. There is no role system, no per-room permission check beyond "the room exists and is active," and no concept of a room "owner" being treated differently from any other participant at the API level (the `hostId` field is stored but not currently used to gate any action — confirmed by reading `room.controller.js` in full).

### Login (implemented)
- **Email/Password:** `signInWithEmailAndPassword` (Firebase JS SDK), wrapped as `signInWithEmail` in `src/features/authentication/services/firebaseAuth.service.js`.
- **Google:** `signInWithPopup(auth, new GoogleAuthProvider())`, wrapped as `signInWithGoogle`.
- **Register:** `createUserWithEmailAndPassword`, then `updateProfile(credential.user, { displayName: name })` if a name was given.
- **Logout:** `signOut(auth)`, wrapped as `signOutUser`, called from `Navbar.jsx`'s `handleLogout`.

### How the frontend obtains and attaches the token
1. Firebase's client SDK manages the ID token lifecycle internally (issuance, silent refresh) once a user is signed in.
2. `useAuthListener` keeps the Zustand store's `user` object up to date via `onAuthStateChanged`.
3. On **every** outgoing API call, `apiClient.js`'s request interceptor calls `auth.currentUser.getIdToken()` — this returns the current valid token, refreshing it transparently if it's near expiry — and sets `Authorization: Bearer <token>`.

### How the backend receives and verifies it
`firebase-auth.middleware.js`: reads the header, calls `admin.auth().verifyIdToken(token)` (Firebase Admin SDK, using the service-account credential configured in `firebase-admin.js`). This call cryptographically verifies the token's signature against Google's public keys and checks expiry — it is **not** just decoding the JWT payload; a forged or expired token fails here.

### How authenticated user info is obtained
The **decoded token itself** is the source of identity — `decodedToken.uid`, `decodedToken.email`, `decodedToken.name`. The backend does **not** perform a database lookup to "find" the user for room operations (unlike the legacy `auth.middleware.js`, which does look up a Mongo `User` document). `req.user._id`/`req.user.uid` is trusted directly from the verified token.

### What happens when the token is missing
`firebase-auth.middleware.js` throws `ApiError.unauthorized('Authentication token is missing')` → 401, before the controller ever runs.

### What happens when the token is invalid/expired
`admin.auth().verifyIdToken()` throws; caught and mapped to a specific message: `'Authentication token has expired'` (`auth/id-token-expired`) or `'Invalid authentication token'` (`auth/invalid-id-token`), or a generic `'Authentication token verification failed'` for anything else. All map to 401.

### Why frontend authentication does NOT automatically mean the backend trusts the user
The frontend's `isAuthenticated` flag only reflects **local Firebase SDK state in the browser** — it proves nothing to the server by itself. Every single request must independently carry and prove a valid token, which the server re-verifies cryptographically every time (`verifyIdToken` is called on every protected request — there's no server-side session or "trust this browser" mechanism). This is precisely the bug this project actually hit: early in development, the Axios interceptor wasn't attaching any token at all (it read a Zustand field, `accessToken`, that never existed), and the app *looked* logged in in the browser while every backend call still failed with 401 — a direct, concrete illustration of "frontend auth state ≠ backend trust."

### Authentication vs. Authorization, in AuraGuard's terms
- **Authentication (implemented):** "This request really comes from Firebase user `UWbhfgPAIHSrrBj6k8ybM1QfCID3`." Enforced by `firebase-auth.middleware.js` on every room route except the legacy `/token`.
- **Authorization (minimal/not implemented beyond existence):** "Is this specific authenticated user allowed to do this specific thing." Currently, being authenticated is sufficient to create or join any room — there's no ownership check, no room-membership-based access control, no admin/moderator role distinction enforced anywhere in the reviewed code.

### Sequence diagram
```
Browser                 Firebase Auth        AuraGuard Backend         Firebase Admin SDK        MongoDB
   |                          |                      |                         |                    |
   |--- login (email/Google)->|                      |                         |                    |
   |<-- ID token + user ------|                      |                         |                    |
   |                          |                      |                         |                    |
   |--- POST /rooms/join -------------------------->|                         |                    |
   |    Authorization: Bearer <token>                |                         |                    |
   |                          |                      |--verifyIdToken(token)->|                    |
   |                          |                      |<--decoded {uid,email}--|                    |
   |                          |                      |--- Room.findOne ------------------------->|
   |                          |                      |<-- room doc -------------------------------|
   |                          |                      |--- AccessToken.toJwt() (local, no network) |
   |<-- { token, serverUrl } -------------------------|                         |                    |
   |                          |                      |                         |                    |
   |--- room.connect(serverUrl, token) -------------------------> LiveKit Cloud (separate service) |
```

---

## 8. ROOM CREATION FLOW

```
User (Dashboard/CreateRoomPage)
  → clicks "Generate Room Code"
  → CreateRoomPage.jsx: handleGenerateRoom()
  → roomApi.js: createRoom(displayName)
  → apiClient (Firebase token attached)
  → POST /api/v1/rooms/create
  → authenticateFirebaseUser (backend trusts req.user.uid from the verified token)
  → validate(createRoomSchema)
  → room.controller.js: createRoom()
  → room.service.js: createRoom(userId, userEmail)
       loop: generateRoomCode() → Room.findOne({roomCode}) until unique
       → new Room({ roomCode, roomName: roomCode, hostId: userId, hostEmail,
                     status: 'ACTIVE', expiresAt: now+24h,
                     participants: [{ userId, email }] }).save()
  → ApiResponse(201, ...) returned
  → CreateRoomPage.jsx: setRoomCode(roomInfo.roomCode) — code displayed to the user
  (LiveKit is NOT involved in this step at all — no token is minted here)
```

**Where the room code is generated:** server-side, in `room.service.js`'s `generateRoomCode()` — a pure function (adjective + random 6-char base36 suffix), called from `createRoom()`.

**Why we changed from frontend-only room generation to backend/database-backed validation:** originally, `roomNameGenerator.js`'s `generateRoomName()` produced a code entirely in the browser, with nothing persisted anywhere. **The security problem:** since nothing recorded which codes were "real," the Join flow (which only checked the *format* of a typed code with a regex, `isValidRoomName`) had no way to distinguish a genuine, shared room code from an arbitrary string a user typed — any syntactically valid string was treated as a valid room to join.

**Current solution:** `generateRoomName()` in `roomNameGenerator.js` still exists in the codebase but is **no longer called** by `CreateRoomPage.jsx` — room codes are now generated server-side and persisted as MongoDB documents, so "does this room exist" became a real database question instead of an unanswerable one.

---

## 9. ROOM JOIN FLOW

```
User (JoinRoomPage) enters a code
  → JoinRoomPage.jsx: handleJoinRoom()
      1. isValidRoomName(roomCode) — client-side FORMAT check only (regex), not existence
      2. validateRoom(roomCode) — GET /api/v1/rooms/validate/:roomCode
           → authenticateFirebaseUser → roomService.getRoomByCode (case-insensitive)
           → 404 "Room not found" if no match
           → 400 "Room is no longer active" / "Room has expired" if applicable
           → 200 { roomCode (canonical), status, expiresAt } on success
      3. On success: navigate(`/meeting/${canonicalRoomCode}`)  — the SERVER's
         returned casing is used, not whatever the user typed

MeetingRoom.jsx (on mount, useParams gives roomName from the URL)
  → joinRoom(roomName, displayName) — POST /api/v1/rooms/join
       → getRoomByCode() re-validated
       → addParticipantToRoom()
       → generateRoomToken() using room.roomCode (canonical), NOT the raw
         request value — this matters: lookup is case-insensitive, but a
         LiveKit room name is effectively case-sensitive, so two users
         joining with different casing of the same code must still be
         granted the SAME LiveKit room name, or they'd silently end up
         in two different LiveKit rooms and never see each other
  → { token, serverUrl, roomCode, roomName } returned
  → new Room(); room.connect(serverUrl, token, { autoSubscribe: true })
  → room.localParticipant.setCameraEnabled(true) / setMicrophoneEnabled(true)
  → RoomEvent.ParticipantConnected / TrackSubscribed fire as the other
    participant joins and publishes → VideoGrid re-renders with both tiles
```

### Documented behavior for specific failure cases
- **Room does not exist:** `getRoomByCode` throws `ApiError.notFound('Room not found')` → 404 → `JoinRoomPage.jsx` displays the message in an error banner and does **not** navigate.
- **Room is expired:** `getRoomByCode` throws `ApiError.badRequest('Room has expired')` → 400 → same page-level error handling.
- **Room status is `ENDED`:** `ApiError.badRequest('Room is no longer active')` → 400.
- **User is not authenticated:** both `CreateRoomPage.jsx` and `JoinRoomPage.jsx` have a `useEffect` that redirects to `/auth/login` if `!user` once `isAuthLoading` is false — the user never even reaches a point where an API call is attempted. If somehow a request is made without a valid token anyway, the backend independently returns 401.
- **LiveKit token is invalid or LiveKit connection fails:** `MeetingRoom.jsx`'s connect effect catches any error from `room.connect(...)` in its outer `try/catch`, sets the page-level `error` state, and renders a "Failed to Join Room" screen with a "Back to Dashboard" button (no retry-without-reload logic implemented).

---

## 10. MONGODB DOCUMENTATION

**Why MongoDB is used:** `Not confirmed from the current codebase` as an explicit written rationale — MongoDB was the pre-existing database for this project before the room-management work began; no comparison/decision document exists in the code. A reasonable, defensible reason for *this specific* data (see §25) is that a `Room` document is small, self-contained, and doesn't need multi-table joins — but this is inferred, not something stated in the project.

### IMPLEMENTED DATABASE STRUCTURE

**Collection: `Room`** (`src/modules/rooms/room.model.js`, Mongoose model name `'Room'`)

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `roomCode` | `String` | yes | — | `unique: true`, `index: true`, `trim: true` |
| `roomName` | `String` | yes | — | Currently always set equal to `roomCode` at creation time |
| `hostId` | `String` | yes | — | Firebase UID. **Not** `ObjectId` — was originally `ObjectId` with `ref: 'User'` and this broke immediately on real data, since Firebase UIDs aren't valid ObjectIds; fixed to plain `String` |
| `hostEmail` | `String` | yes | — | |
| `status` | `String` | no | `'ACTIVE'` | `enum: ['ACTIVE', 'ENDED']` |
| `createdAt` | `Date` | no | `Date.now` | Also duplicated by the schema's `timestamps: true` option — a minor, harmless redundancy, not cleaned up |
| `expiresAt` | `Date` | yes | — | Set at creation to `now + 24 hours`; no TTL index — expiry is checked in application code (`getRoomByCode`), not enforced by MongoDB itself |
| `participants` | `Array` of subdocuments | — | `[]` | Each: `{ userId: String, email: String, joinedAt: Date (default now) }` |

**Indexes:** `roomCode` (unique, from field-level `unique: true`/`index: true`), `hostId` (field-level `index: true`), and a compound `roomSchema.index({ status: 1, expiresAt: 1 })` (defined for future cleanup/lookup queries by status+expiry — not currently used by any query in the reviewed code beyond the implicit filtering already done in application logic).

**Relationships:** None via Mongoose `ref`/`populate`. `hostId` and `participants[].userId` are plain Firebase UID strings, not foreign keys into any local collection.

**Queries actually performed (confirmed from `room.service.js`):**
- `Room.findOne({ roomCode })` — during unique-code generation.
- `Room.findOne({ roomCode: new RegExp(...) })` — case-insensitive lookup, in `getRoomByCode`.
- `new Room({...}).save()` — create.
- `room.participants.push({...}); room.save()` — update (add participant).
- `room.status = 'ENDED'; room.save()` — update (in `endRoom`, **not currently wired to any route**).

**What happens if two users join "simultaneously":** each join request independently calls `getRoomByCode` (a read) then, if the participant isn't already in the array, appends and saves. There is no explicit optimistic-concurrency/version check on the `participants` array save — `Not confirmed` whether a true race (two saves overlapping) could drop one participant's entry; Mongoose's default `save()` does use versioning (`__v`) internally on document updates, but no test or explicit handling for this race was found in the reviewed code.

### PLANNED DATABASE STRUCTURE
None found in code (no other Mongoose models were reviewed beyond the legacy `User` model referenced only by field name in `auth.middleware.js` — `_id`, `password` (excluded via `.select('-password')`), `.isActive`; its full schema was not opened in this review, so do not describe it beyond these three confirmed fields).

### Interview questions (relevant to this implementation)
- **"Why MongoDB instead of MySQL for this Room model?"** → A `Room` document is a natural fit for a document store: one self-contained object with an embedded array (`participants`) that's always read/written together with its parent, no joins needed. (Framed as *my reasoning for the shape of the data*, not as "why the project chose Mongo overall" — that predates the room work.)
- **"What is a document, what is a collection?"** → A document is one Room record (e.g., `{roomCode: "Aurora-FTFLMG", status: "ACTIVE", ...}`); the collection is `rooms`, the set of all such documents.
- **"How does indexing help here?"** → The `roomCode` unique index is what makes `Room.findOne({roomCode: ...})` fast and also *enforces* uniqueness at the database level, not just in application logic (though the current uniqueness-check loop in `createRoom` is a pre-check, not a reliance on a duplicate-key error).
- **"How would you scale this?"** → `Not confirmed from the current codebase` as an implemented answer; reasonable directions given the schema: a TTL index on `expiresAt` to auto-expire old rooms instead of only filtering them at read time, sharding by `roomCode` if write volume ever became a bottleneck. These are **my own extrapolation**, not implemented.
- **"What happens if two users join simultaneously?"** → See "What happens if two users join simultaneously" above — honestly answer that no explicit race-condition handling beyond Mongoose's default versioning was found, and that in the worst case it's a rare, low-stakes race (a participant record potentially being dropped from an array), not a correctness-critical one like double-charging a payment.

---

## 11. LIVEKIT DOCUMENTATION

**What LiveKit is:** A managed WebRTC infrastructure provider (an SFU — Selective Forwarding Unit) that handles the actual real-time transport of audio/video/data between browsers, so the app doesn't have to implement WebRTC signaling, NAT traversal (STUN/TURN), or media routing itself.

**Why it's used:** to avoid building WebRTC signaling/SFU infrastructure from scratch. `Not confirmed from the current codebase` as an explicitly written rationale in code comments, but this is the standard, well-understood reason to use a managed WebRTC platform, and is consistent with how the project is structured (backend only ever *mints tokens*, never touches media).

**LiveKit Cloud:** the specific hosted offering used (confirmed by the server URL scheme `wss://<project>.livekit.cloud` seen in `.env` configuration and used in `livekit.service.js`'s `env.livekitUrl`) — a managed SaaS version of LiveKit, as opposed to self-hosting the LiveKit server.

### Core concepts, defined with AuraGuard's actual code
- **Room** — the LiveKit-side session. In code: `const room = new Room();` then `room.connect(serverUrl, token, {...})` (`MeetingRoom.jsx`). Distinct from AuraGuard's own MongoDB `Room` document — the MongoDB Room is "does this meeting exist and is it valid to join"; the LiveKit Room is "the live real-time session itself." **Naming this distinction clearly is an important interview point** — see §2/§8.
- **Participant** — one person connected to a Room. Two kinds:
  - **LocalParticipant** — `room.localParticipant`, the current browser's own presence. Used to publish (camera/mic/screen) and to read your own track state (`MeetingControls.jsx`).
  - **RemoteParticipant** — everyone else, obtained from `room.remoteParticipants` (a `Map`). `MeetingRoom.jsx` re-reads `Array.from(room.remoteParticipants.values())` into React state whenever a relevant event fires.
- **Track** — a single media stream (one camera's video, one mic's audio, or a screen-share's video). Accessed via `publication.track`.
- **TrackPublication** — a *reference* to a track that a participant has published to the room, along with metadata like `.source` (`Track.Source.Camera` / `Track.Source.Microphone` / `Track.Source.ScreenShare`) and, once available, `.track` itself. Confirmed the code reads these via `participant.videoTrackPublications` / `audioTrackPublications` (Maps).
- **Track subscription** — the *act* of a remote participant's track becoming available to you (LiveKit auto-subscribes here, since `room.connect(..., { autoSubscribe: true })`). Once subscribed, `publication.track` becomes populated, which is exactly what `preferredTrack()` in `VideoTile.jsx` polls for.

**Confirmed important fact:** `livekit-client` (the installed version, 2.21.0) has **no** `videoTrackSubscriptions`/`audioTrackSubscriptions` property on a participant — an earlier version of this code tried to read that and it silently returned `undefined` forever. The correct, currently-used API is `videoTrackPublications`/`audioTrackPublications`.

### Camera flow, as actually implemented
```
User's browser camera permission
  → room.localParticipant.setCameraEnabled(true)     [MeetingRoom.jsx, on connect]
  → LiveKit client SDK internally: getUserMedia() → LocalVideoTrack created
  → SDK publishes the track to the LiveKit Room (over the WebRTC connection
    to LiveKit Cloud) — this is a single SDK call; AuraGuard's own code
    does not manually construct or publish a MediaStreamTrack itself
  → LOCAL side: VideoTile.jsx finds this track via
    participant.videoTrackPublications (source === Track.Source.Camera)
    → videoTrack.attach(videoElement)  → local preview renders
  → REMOTE side (other participant's browser): LiveKit delivers the track
    → RoomEvent.TrackSubscribed fires on their Room instance
    → their MeetingRoom.jsx refreshes remoteParticipants
    → their VideoGrid/VideoTile finds the SAME publication pattern
      (videoTrackPublications, source === Camera) and attaches it to
      their own <video> element
```
Toggling off: `setCameraEnabled(false)` — this unpublishes/mutes the track; `MeetingControls.jsx` learns this via the `'trackMuted'`/`'trackUnmuted'`/`'trackPublished'` participant events it's subscribed to, and updates its own button state.

### Microphone flow — identical pattern, `Track.Source.Microphone`, `setMicrophoneEnabled(true/false)`.

---

## 12. VIDEO CONFERENCING FLOW

1. **Browser camera permission** — requested implicitly the first time `setCameraEnabled(true)` is called (the browser's native permission prompt).
2. **Local video track creation** — handled internally by `livekit-client` when `setCameraEnabled(true)` is called; AuraGuard's code never calls `getUserMedia()` directly.
3. **Publishing** — also handled by the same SDK call; the track is sent up to LiveKit Cloud over the existing room connection.
4. **LiveKit transport** — LiveKit Cloud's SFU receives the track and forwards it to every other subscribed participant in the same Room. This is entirely LiveKit-managed infrastructure, outside AuraGuard's own servers.
5. **Remote participant** — on the other browser, the Room instance receives a new publication and, since `autoSubscribe: true` was set on connect, automatically subscribes.
6. **Remote track subscription** — `RoomEvent.TrackSubscribed` fires; `MeetingRoom.jsx`'s handler re-reads `remoteParticipants` into React state.
7. **Track attachment** — `VideoTile.jsx`'s `useEffect` calls `videoTrack.attach(videoElement)`, which is a `livekit-client` SDK method that assigns the underlying `MediaStream` to the `<video>` element's `srcObject`.
8. **Rendering in VideoTile** — the `<video>` element (`autoPlay`, `playsInline`, `objectFit: 'cover'`) then plays the stream natively via the browser's own video decoding — no custom frame handling code exists anywhere in this project.
9. **Camera toggle** — `MeetingControls.jsx`'s `handleToggleCamera` → `localParticipant.setCameraEnabled(newState)`.
10. **Camera mute/unmute** — the same call; LiveKit distinguishes "muted" (track exists but is paused) from "unpublished" (track removed entirely) internally — `VideoTile.jsx`'s `showPlaceholder` logic is driven by whether a *track* is found at all, and shows a placeholder avatar with "Camera off" text when a remote participant has none.

**What a "video frame" means:** one still image in the continuous video stream (e.g., 30 per second) — this project never touches individual frames; the browser's native WebRTC/video stack decodes and renders them, and LiveKit's SFU forwards encoded media without AuraGuard's code inspecting frame content.

**Why we don't manually send every frame through the Node backend:** the Node backend is not in the media path at all — see §2's architecture diagram. Relaying live video through a general-purpose HTTP app server would be far too slow/expensive at any real scale; that's precisely the problem SFU services like LiveKit solve, and why the backend's only job here is issuing an authorization token.

**Video stream vs. Track vs. Frame vs. Participant vs. Publication:**
- **Stream** — informal term for the continuous flow of media.
- **Track** (`LocalVideoTrack`/`RemoteVideoTrack`) — the actual media object in the SDK, wrapping a browser `MediaStreamTrack`.
- **Frame** — one image within a track's stream; never directly touched by this codebase.
- **Participant** — a person/connection in the Room; owns zero or more tracks.
- **Publication** (`TrackPublication`) — the *reference/announcement* that a participant has a track available, which may or may not yet have `.track` populated (depending on subscription state) — this is the object AuraGuard's code actually iterates over (`videoTrackPublications`), not tracks directly.

---

## 13. MICROPHONE / AUDIO FLOW

**Implemented:**
- Browser microphone permission — requested implicitly by `setMicrophoneEnabled(true)`.
- Local audio track — created/published by the same LiveKit SDK call (`MeetingRoom.jsx`, on connect).
- Muting/unmuting — `MeetingControls.jsx`'s `handleToggleMic` → `localParticipant.setMicrophoneEnabled(newState)`; state synced back via `'trackMuted'`/`'trackUnmuted'`/`'trackPublished'` participant events.
- Remote audio — `VideoTile.jsx` renders a hidden `<audio>` element **for remote participants only** (`!isLocal && <audio ref={audioRef} autoPlay playsInline />`) and attaches the remote participant's audio track to it via `preferredTrack(participant.audioTrackPublications, Track.Source.Microphone)`. The local user's own mic is never played back to themselves (`isLocal` participants render no `<audio>` element at all).

**Speech-to-text / AI audio analysis:**
**PLANNED — NOT CURRENTLY IMPLEMENTED.** No Whisper, no Gemini, no any audio-analysis library or API call exists anywhere in either repo as reviewed. Do not describe this as built.

---

## 14. MEETING CONTROLS

**File:** `src/components/meeting/MeetingControls.jsx` — see full breakdown in §3. Summary of behavior:
- **Camera toggle:** `handleToggleCamera` → `localParticipant.setCameraEnabled(!isCameraEnabled)`.
- **Microphone toggle:** `handleToggleMic` → `localParticipant.setMicrophoneEnabled(!isMicEnabled)`.
- **Leave meeting:** the "Leave" button calls the `onLeave` prop, which `MeetingRoom.jsx` wires to its `handleLeave` function (`roomRef.current.disconnect()` then `navigate(ROUTES.dashboard, { replace: true })`).
- **State management:** `isMicEnabled`/`isCameraEnabled` are **read from LiveKit's actual track state**, not driven optimistically by the click handlers — a `useEffect` subscribes to `'trackMuted'`/`'trackUnmuted'`/`'trackPublished'` on `localParticipant` and re-derives both booleans from `videoTrackPublications`/`audioTrackPublications` every time.
- **LiveKit methods used:** `setCameraEnabled(bool)`, `setMicrophoneEnabled(bool)`, `.on('trackMuted'/'trackUnmuted'/'trackPublished', cb)`, `.off(...)` in cleanup.

### The `ReferenceError: updateCounterRef is not defined` bug
`Not confirmed from the current codebase` in the sense that no `updateCounterRef` identifier exists anywhere in the current `MeetingControls.jsx` (confirmed by reading the full current file). This was a bug encountered **earlier in this project's development**, in an intermediate version of the toggle logic (before the "read state directly off the SDK" pattern documented above was settled on) — the current file shows no trace of it, and no code path could currently throw this error.
**Lesson for the developer (based on the surrounding fix that *is* present in the current code):** UI toggle state for something driven by an external, asynchronous system (like a hardware device permission or a WebRTC track) should be **derived from that system's actual state**, not maintained as an independent piece of React state that the click handler mutates optimistically and hopes stays in sync — that's exactly the shape of bug class (stale/undefined refs used for manual re-render forcing) this kind of error tends to come from, and it's why the current implementation instead re-reads `videoTrackPublications`/`audioTrackPublications` and subscribes to the SDK's own change events.

---

## 15. PARTICIPANT MANAGEMENT

**Implemented:**
- **Local participant:** `room.localParticipant`, read directly by `VideoGrid`/`MeetingControls`/the two new hooks.
- **Remote participants:** `room.remoteParticipants` (a `Map`), mirrored into React state (`MeetingRoom.jsx`'s `remoteParticipants`) whenever `ParticipantConnected`, `ParticipantDisconnected`, `TrackSubscribed`, `TrackUnsubscribed`, `TrackMuted`, or `TrackUnmuted` fires.
- **Connection/disconnection:** handled via `RoomEvent.ParticipantConnected`/`ParticipantDisconnected` listeners in the connect effect.
- **Track publication/subscription:** as described in §11/§12 — `videoTrackPublications`/`audioTrackPublications` per participant.
- **Rendering:** `VideoGrid.jsx` maps every `{participant, isLocal}` pair to a `VideoTile`; at most one active screen share additionally renders via `ScreenShareTile`.
- **State updates:** always by re-reading the live SDK Maps into a fresh array (`Array.from(room.remoteParticipants.values())`), never by manually mutating a cached participant list.

**A dedicated "Participant List" UI (e.g., a sidebar showing names/mute-status of everyone in the call, independent of the video grid):** **NOT IMPLEMENTED.** The only participant-facing UI is the video grid itself (name labels on tiles) — there is no separate roster/list component anywhere in the codebase reviewed.

---

## 16. CHAT / SCREEN SHARE

### Chat — **IMPLEMENTED**
**Files:** `src/hooks/useLiveKitChat.js`, `src/components/meeting/ChatPanel.jsx`, wired in `MeetingRoom.jsx`.

**How it works:** messages are JSON objects (`{id, text, senderIdentity, senderName, timestamp}`), sent via `localParticipant.publishData(encodedBytes, { reliable: true, topic: 'auraguard-chat' })` and received via `room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => ...)`, filtered to only the `'auraguard-chat'` topic. **No separate backend or database is involved** — messages exist only in each connected browser's memory for the lifetime of the room; nothing is persisted to MongoDB or anywhere else.

**Sender echo:** because `publishData` does not deliver a participant's own packet back to themselves, `sendMessage()` optimistically appends the message to local state immediately, before/regardless of the network call's success.

**UI:** `ChatPanel.jsx` — right-side sidebar on large screens (`lg:w-80 xl:w-96`), full-screen overlay with a dismissible backdrop on smaller screens (`fixed inset-0`, `lg:static` to switch modes). Auto-scrolls to the latest message. Enter (without Shift) sends; a send button is also present, disabled when the input is empty. Own messages render right-aligned in the accent color; others render left-aligned with the sender's name shown above the bubble. An explicit empty state ("No messages yet. Say hello to start the conversation.") is shown when there are no messages.

**Unread indicator:** `MeetingRoom.jsx` tracks `lastReadChatCount` and computes `unreadChatCount = chatOpen ? 0 : max(0, messages.length - lastReadChatCount)`, shown as a small numeric badge on the Chat button in `MeetingControls.jsx`.

### Screen Share — **IMPLEMENTED**
**Files:** `src/hooks/useScreenShare.js`, `src/components/meeting/ScreenShareTile.jsx`, plus the disambiguation fix in `VideoTile.jsx`/`VideoGrid.jsx`.

**How it works:** `localParticipant.setScreenShareEnabled(true, { audio: false })` (video-only — no system/tab audio is captured) publishes a second video track with `source: Track.Source.ScreenShare`. `useScreenShare.js` exposes `isSharing`/`toggle`/`error`, kept in sync via the same `'trackPublished'`/`'trackUnpublished'` participant events `MeetingControls.jsx` already uses for camera/mic. Stopping works three ways, all handled: clicking the app's own Screen Share button again, and closing the browser's native "Stop sharing" bar — the latter works automatically because LiveKit internally listens for the underlying `MediaStreamTrack`'s native `'ended'` event and unpublishes on its own, which then fires the same `'trackUnpublished'` event this hook already listens for.

**Cancellation handling:** if the user closes the browser's screen-picker dialog without choosing a source, `setScreenShareEnabled` rejects with `err.name === 'NotAllowedError'` — this is caught and treated as a silent no-op (logged, not surfaced as an error), distinct from a genuine failure.

**UI:** the sharer sees "You are presenting" (localized label, muted-self video preview); others see "`{name}` is presenting." `VideoGrid.jsx` renders the active share as a large tile (`ScreenShareTile`, `objectFit: 'contain'` so nothing is cropped) above a shrunk, horizontally-scrollable strip of camera thumbnails, rather than replacing the camera grid.

**Known limitation, confirmed in code comments:** no explicit handling exists for two participants trying to screen-share simultaneously — `VideoGrid.jsx`'s `screenShareEntry` logic picks whichever screen-share publication it encounters first among displayed participants; there's no lock or warning against a second concurrent share.

---

## 17. ERROR HANDLING & DEBUGGING

### 1. Camera not rendering (historical)
**Problem:** local camera video didn't appear despite the track publishing successfully.
**Root cause (as reflected in current code's defensive logging):** `Not confirmed` as a single root cause from current code alone — the current `VideoTile.jsx` contains logging specifically added to diagnose exactly this class of problem (`console.log` of `videoWidth`/`videoHeight`/`clientWidth`/`clientHeight`/`paused`/`readyState` a moment after attaching), which strongly suggests the historical issue was a track-attach/DOM-timing problem, not a LiveKit connection problem.
**Fix present in current code:** always render the `<video>` element (never conditionally skip rendering it), attach via a `useEffect` keyed on the track identity, and log element state post-attach for diagnosis.
**Status:** working in current code — the diagnostic logging remains in place as a debugging aid.

### 2. `ReferenceError: updateCounterRef is not defined`
See §14 — confirmed this identifier does not exist anywhere in the current codebase; the underlying issue was fixed by switching `MeetingControls.jsx` to derive toggle state from live LiveKit publications rather than manually-managed counters/refs.

### 3. Remote participant not appearing
**Root cause (confirmed via code comments in `VideoTile.jsx`):** the code previously read a property (`videoTrackSubscriptions`/`audioTrackSubscriptions`) that does not exist on a LiveKit `Participant` in the installed SDK version — it always evaluated to `undefined`, so remote tracks could never be found, regardless of whether they had actually arrived.
**Fix:** switched to `videoTrackPublications`/`audioTrackPublications`, taking `.track` off the publication once populated.
**Status:** fixed, confirmed present in current code, with an explanatory comment left in place specifically so this mistake isn't repeated.
**Lesson:** when an SDK method/property silently returns `undefined` instead of throwing, a plausible-looking API name is not proof it's the correct one — worth verifying against the installed package's actual exports/types rather than assuming.

### 4. Arbitrary room codes being accepted
See §8/§9 in full. **Root cause:** no backend/database validation existed originally; any string matching a format regex was treated as joinable.
**Fix:** `Room` MongoDB model + `getRoomByCode` existence/status/expiry check, called *before* any LiveKit token is issued, on both the Join page (pre-navigation) and the meeting page itself (pre-connection).
**Status:** fixed, confirmed present in current `room.service.js`/`room.controller.js`.

### 5. 401 Unauthorized during room creation
**Root cause, two layers (both confirmed as fixed by reading the current code, which no longer exhibits either):**
- **Layer 1:** the Axios interceptor previously read a `accessToken` field from the Zustand auth store that was never actually set anywhere — `auth.store.js` only ever held `user`/`isAuthenticated`/`isAuthLoading`. Current `apiClient.js` instead calls `auth.currentUser.getIdToken()` directly from the Firebase SDK on every request.
- **Layer 2:** even once the token was correctly attached, the room routes were using the **legacy** custom-JWT `auth.middleware.js`, which cannot verify a Firebase-issued token (different signing scheme entirely). Current `room.routes.js` uses the dedicated `firebase-auth.middleware.js` instead.
**Status:** fixed, confirmed present in current code on both sides.

### 6. LiveKit connection/debugging issues
The codebase's own logging convention (confirmed present throughout `MeetingRoom.jsx`, `VideoTile.jsx`, `useScreenShare.js`, `useLiveKitChat.js`, and the backend's `firebase-auth.middleware.js`) is a set of bracketed prefixes: `[ROOM]`, `[LIVEKIT]`, `[VIDEO]`, `[AUTH BACKEND]`, `[CHAT]`, `[SCREEN SHARE]`. **How to debug this project systematically, based on that convention:**
1. Open the browser console on **both** participants' tabs.
2. `[AUTH BACKEND]` lines (visible in the backend's terminal, not the browser) confirm whether token verification succeeded.
3. `[ROOM]` lines trace room creation/validation/join.
4. `[LIVEKIT]` lines trace the connection lifecycle itself (`connecting`, `connected`, `disconnected`).
5. `[VIDEO]` lines trace track discovery/attachment per tile — specifically the "Video track lookup" log showing `found: true/false` and `publications: N` is the fastest way to tell whether a remote track ever arrived vs. arrived but wasn't attached.
6. `[CHAT]`/`[SCREEN SHARE]` are scoped the same way for those two features.

---

## 18. SECURITY

**Firebase authentication:** implemented, described fully in §7. Passwords are never handled by AuraGuard's own backend at all for the Firebase flow — Firebase itself owns credential storage.

**Backend token verification:** `admin.auth().verifyIdToken()` — cryptographic verification against Firebase's own key set, not just JWT decoding.

**LiveKit token generation:** performed **only** server-side (`livekit.service.js`), using `env.livekitApiKey`/`env.livekitApiSecret`, which live only in the backend's `.env` and are never sent to the frontend. The frontend only ever receives the short-lived (1-hour `ttl`) signed JWT `token` value, never the underlying API secret.

**Why the LiveKit API secret must never be exposed in React:** the secret is what *signs* access tokens — anyone holding it could mint an unlimited number of valid tokens for any room, with any permissions, bypassing all of AuraGuard's own room-validation logic entirely. It is fundamentally a server-only credential, exactly like a JWT signing secret.

**Environment variables / API secrets:** confirmed centralized in `src/config/env.js` (backend) — "the rest of the codebase never touches `process.env` directly" (comment in the file itself). See §19 for the full list of names.

**CORS:** implemented — `cors({ origin: env.clientUrl, credentials: true })` in `app.js`, restricting which frontend origin may call the API.

**Room validation:** implemented — see §8/§9. This *is* the project's primary authorization mechanism for rooms (existence + active status + not expired), though it does not distinguish a room's host from any other participant once inside.

**Input validation:** Zod schemas (`room.validator.js`) on all room-mutating/room-reading endpoints, enforced via `validate.middleware.js`.

**Error handling:** centralized (`error.middleware.js`), and deliberately hides stack traces in any environment other than `development` (`stack: env.nodeEnv === 'development' ? err.stack : undefined`).

**Frontend/backend trust boundary:** explicitly enforced — the backend never trusts a client-supplied user ID for room operations; `req.user.uid`/`req.user.email` always come from the independently-verified token, confirmed in `room.controller.js` (`const userId = req.user._id;` — not `req.body.userId`).

### Identified, real, current security weaknesses (not invented)
1. **The legacy `POST /api/v1/rooms/token` endpoint has no authentication and no room-existence check.** It mints a valid LiveKit token for *any* room name a caller supplies, which — if actually reachable and used — would let someone bypass the entire Create/Join validation system and join an arbitrary LiveKit room by guessing/knowing its name. Confirmed still present and still mounted in `room.routes.js`, unauthenticated. It is not currently called by any reviewed frontend page, but it is a live, public endpoint on the running server.
2. **No per-room authorization beyond "room is ACTIVE and not expired."** Any authenticated Firebase user who has (or guesses) a room code can join it — there's no host-only room control (e.g., ending a room, kicking a participant) enforced at the API level; `endRoom()` exists in `room.service.js` but has no route calling it, so no one can currently end a room via the API at all, host or otherwise.
3. **No rate limiting specific to room creation/joining** — only the global `apiLimiter` applies to every route uniformly; a single authenticated account could call `POST /rooms/create` repeatedly without any room-specific throttle.
4. **`expiresAt` is enforced only in application code (`getRoomByCode`), not by a MongoDB TTL index** — an expired-but-not-yet-cleaned-up room document simply becomes unreachable via the API (correctly rejected), but the collection itself has no automatic cleanup mechanism confirmed in code.

Do not describe any weakness beyond these four — no other vulnerability was found or is claimed.

---

## 19. ENVIRONMENT CONFIGURATION

**No real secret values are reproduced below — names, purpose, and location only.**

### Backend (`AuraGuard-AI-Backend/.env`, read via `src/config/env.js`)
| Name | Purpose | Secret? |
|---|---|---|
| `NODE_ENV` | `development`/`test`/etc. — also selects `.env` vs `.env.test` | No |
| `PORT` | HTTP server port (defaults `5000`) | No |
| `API_VERSION` | API path prefix, e.g. `v1` | No |
| `CLIENT_URL` | Allowed CORS origin (the frontend's URL) | No |
| `MONGO_URI` | MongoDB connection string | Yes (contains host/credentials if remote) |
| `MONGO_URI_TEST` | MongoDB connection string used when `NODE_ENV=test` | Yes |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Legacy custom-JWT signing (not used by rooms) | Secret is Yes |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Legacy refresh-token signing | Secret is Yes |
| `COOKIE_SECRET` | Signs the `accessToken` cookie (legacy auth) | Yes |
| `BCRYPT_SALT_ROUNDS` | Legacy password hashing cost factor | No |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media storage (not used by any room/video feature reviewed) | Key/Secret are Yes |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Outbound email (not used by any feature reviewed in this document) | `SMTP_PASS` is Yes |
| `AI_SERVICE_BASE_URL` / `AI_SERVICE_API_KEY` / `AI_SERVICE_TIMEOUT_MS` / `AI_SERVICE_MAX_RETRIES` / `AI_SERVICE_RETRY_DELAY_MS` | Config for calling the separate FastAPI AI service | `AI_SERVICE_API_KEY` is Yes |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Global rate limiter config | No |
| `LOG_LEVEL` | Winston log level | No |
| `LIVEKIT_URL` | LiveKit Cloud server URL (`wss://...livekit.cloud`) | No (not itself a credential) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit token-signing credentials | **Yes, highly sensitive** |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the Firebase service-account JSON key file (standard Google SDK convention, read automatically — not custom-parsed in `env.js`) | The **file it points to** is highly sensitive |

`.env.example` exists (a template with no real values). `.env.test` is read when `NODE_ENV=test`. All confirmed via `env.js`.

### Frontend (`Frontend/.env`, read via `import.meta.env` in `src/config/env.js` and `src/config/firebase.js`)
| Name | Purpose | Secret? |
|---|---|---|
| `VITE_APP_NAME` | Display name used in UI | No |
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:5000/api/v1`) | No |
| `VITE_SOCKET_URL` | Socket.io server URL | No |
| `VITE_ENABLE_DEV_TOOLS` | Feature flag | No |
| `VITE_FIREBASE_API_KEY` | Firebase **client** config — this one is a public, client-side identifier by Firebase's own design, not a backend secret | No (Firebase client API keys are meant to be public; access is controlled by Firebase security rules, not key secrecy) |
| `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` | Firebase client SDK config | No |

**Important distinction for interviews:** the Firebase *client* API key is safe to ship in frontend bundles (it identifies the project, not a secret credential); the LiveKit API key/secret and the Firebase Admin service-account file are fundamentally different — they must never leave the backend.

---

## 20. DEPENDENCIES

### Frontend (`Frontend/package.json`)
| Package | Version | Why / where used |
|---|---|---|
| react, react-dom | ^19.1.1 | UI framework |
| vite | ^7.1.2 | Dev server + bundler |
| react-router-dom | ^7.7.1 | Routing (`src/routes/index.jsx`) |
| firebase | ^12.17.1 | Client-side auth (`src/config/firebase.js`, `firebaseAuth.service.js`) |
| livekit-client | ^2.21.0 | All WebRTC/video/audio/chat/screen-share logic |
| axios | ^1.11.0 | HTTP client (`apiClient.js`) |
| zustand | ^5.0.7 | `auth.store.js`, `ui.store.js` |
| @tanstack/react-query | ^5.84.1 | Installed, provider wired (`AppProviders.jsx`), **no actual query/mutation usage found** in this review |
| react-hook-form, @hookform/resolvers, zod | ^7.61.1 / ^5.2.1 / ^4.0.15 | Login/Register form validation |
| framer-motion | ^12.23.0 | Dashboard/landing page animations |
| react-icons | ^5.5.0 | `Fi*` (Feather) icon set, used throughout |
| socket.io-client | ^4.8.1 | Installed; **no usage confirmed** in any file reviewed for this document |
| tailwindcss | ^3.4.17 (dev) | Styling |

### Backend (`AuraGuard-AI-Backend/package.json`)
| Package | Version | Why / where used |
|---|---|---|
| express | ^4.19.2 | Web framework (`app.js`) |
| mongoose | ^8.5.2 | MongoDB ODM (`room.model.js`, `db.js`) |
| firebase-admin | ^12.0.0 | Firebase ID token verification (`firebase-admin.js`, `firebase-auth.middleware.js`) |
| livekit-server-sdk | declared `^0.4.4`, resolves `0.4.10` | Server-side LiveKit `AccessToken` minting (`livekit.service.js`) — **this version has no `name` field on `AccessToken`**, which is why `metadata` carries the display name instead |
| zod | ^3.23.8 | Request validation (`room.validator.js`) |
| jsonwebtoken, bcrypt | ^9.0.2 / ^5.1.1 | The **legacy**, separate custom-JWT auth system (`auth.middleware.js`, `generateToken.js`) — not used by rooms |
| cors, helmet, express-rate-limit | ^2.8.5 / ^7.1.0 / ^7.4.0 | Security middleware (`app.js`) |
| winston, winston-daily-rotate-file | ^3.13.1 / ^5.0.0 | Logging |
| socket.io | ^4.7.5 | Wired at server startup (`initSocket`); internal handlers not reviewed for this document |
| cloudinary, nodemailer, multer, swagger-jsdoc, swagger-ui-express | various | Present, referenced by config/route mounting; not reviewed in depth for this document |

### AI dependencies
**None found in either `package.json`.** No OpenAI/Whisper/Gemini/vector-DB/ML library of any kind is a dependency of either repo as reviewed.

---

## 21. PROJECT FOLDER STRUCTURE

*(Only files actually opened/confirmed during this review are annotated; other files in these folders exist but were not individually verified for this document — treat unannotated files as "exists, not reviewed.")*

```
AuraGuard-AI-Backend/
├── package.json                          firebase-admin, livekit-server-sdk (0.4.10), mongoose, express, zod 3
├── src/
│   ├── server.js                         boot sequence: firebase-admin init → connectDB → socket → jobs → listen
│   ├── app.js                            middleware stack, route mounting, /health, /docs
│   ├── config/
│   │   ├── env.js                        centralizes ALL process.env reads
│   │   ├── db.js                         mongoose.connect, connection event logging
│   │   └── firebase-admin.js             Firebase Admin SDK init (NEW work this project)
│   ├── middlewares/
│   │   ├── auth.middleware.js            legacy custom-JWT auth (NOT used by rooms)
│   │   ├── firebase-auth.middleware.js   Firebase ID token verification (used by rooms)
│   │   ├── validate.middleware.js        Zod request validation wrapper
│   │   └── error.middleware.js           central error handler
│   ├── routes/v1/index.js                mounts all module routers under /api/v1
│   ├── modules/rooms/
│   │   ├── room.model.js                 Mongoose Room schema
│   │   ├── room.service.js               business logic + MongoDB queries
│   │   ├── room.controller.js            HTTP handlers
│   │   ├── room.validator.js             Zod schemas
│   │   └── room.routes.js                route wiring + middleware order
│   ├── services/livekit.service.js       LiveKit AccessToken generation
│   └── utils/ (ApiError.js, ApiResponse.js, catchAsync.js, generateToken.js)

Frontend/
├── package.json                          React 19, livekit-client 2.21, firebase 12, zustand 5, react-query 5
├── tailwind.config.js                    custom `auraguard` color scale (blue-family, #0d87ea at 500)
├── src/
│   ├── main.jsx                          ReactDOM root, wraps App in React.StrictMode
│   ├── App.jsx                           useAuthListener() + AppProviders + AppRoutes
│   ├── AppProviders.jsx                  QueryClientProvider wrapper
│   ├── config/
│   │   ├── firebase.js                   Firebase client SDK init (auth export)
│   │   ├── apiClient.js                  Axios instance + async Firebase-token interceptor
│   │   ├── env.js                        import.meta.env wrapper
│   │   └── queryClient.js                react-query client config (installed, not yet used for queries)
│   ├── store/
│   │   ├── auth.store.js                 Zustand: user/isAuthenticated/isAuthLoading (NO token field)
│   │   └── ui.store.js                   Zustand: sidebarOpen/theme
│   ├── hooks/
│   │   ├── useAuth.js                    selector over auth.store
│   │   ├── useAuthListener.js            wires Firebase onAuthStateChanged → auth.store
│   │   ├── useLiveKitChat.js             chat over LiveKit data channel
│   │   └── useScreenShare.js             screen-share toggle + state
│   ├── services/roomApi.js               createRoom/joinRoom/validateRoom/legacy getToken
│   ├── utils/
│   │   ├── helpers.js                    mergeClassNames (plain string join, NOT Tailwind-merge)
│   │   └── roomNameGenerator.js          generateRoomName (dead code) + isValidRoomName (still used)
│   ├── constants/routes.constants.js     ROUTES path table
│   ├── components/
│   │   ├── ui/ (Button.jsx, Card.jsx, Input.jsx, Badge.jsx)
│   │   ├── navigation/ (Navbar.jsx, Sidebar.jsx, Breadcrumbs.jsx)
│   │   └── meeting/
│   │       ├── index.js                  barrel: VideoGrid, VideoTile, MeetingControls, ChatPanel
│   │       ├── VideoGrid.jsx
│   │       ├── VideoTile.jsx
│   │       ├── MeetingControls.jsx
│   │       ├── ChatPanel.jsx
│   │       └── ScreenShareTile.jsx       (not barrel-exported — only VideoGrid imports it directly)
│   ├── layouts/ (AppLayout.jsx, AuthLayout.jsx)
│   ├── routes/index.jsx                  BrowserRouter + all <Route> definitions
│   ├── pages/MeetingRoom.jsx              the entire meeting screen
│   └── features/
│       ├── landing/ (LandingPage.jsx, HeroSection.jsx, FeatureGrid.jsx) — static marketing copy only
│       ├── authentication/ (LoginPage.jsx, RegisterPage.jsx, firebaseAuth.service.js, ...)
│       ├── dashboard/pages/DashboardPage.jsx — Create/Join StatCards + mock "Recent Activity"
│       └── meetings/pages/ (CreateRoomPage.jsx, JoinRoomPage.jsx)
```

---

## 22. DATA FLOW DIAGRAMS

### A. Login
```
Browser form submit
  → signInWithEmail(email, password) / signInWithGoogle()   [firebaseAuth.service.js]
  → Firebase Auth (Google's servers) verifies credentials
  → onAuthStateChanged fires in the browser
  → useAuthListener's setUser(firebaseUser) → auth.store updated
  → useAuth() consumers re-render (isAuthenticated: true)
  → navigate(ROUTES.dashboard)
```

### B. Create Room
See §8 — full ASCII flow already given there.

### C. Join Room
See §9 — full ASCII flow already given there.

### D. Camera publishing
```
setCameraEnabled(true)  [MeetingRoom.jsx, on connect]
  → livekit-client: getUserMedia() → LocalVideoTrack
  → SDK publishes track over the existing WebRTC connection to LiveKit Cloud
  → LiveKit Cloud SFU forwards it to every subscribed remote participant
```

### E. Remote video rendering
```
RoomEvent.TrackSubscribed fires (this browser subscribed to a remote track)
  → MeetingRoom.jsx: updateRemoteParticipants() → setRemoteParticipants([...])
  → VideoGrid.jsx: displayParticipants memo recomputes
  → VideoTile.jsx (for that participant): preferredTrack() finds the
    Camera-sourced publication → useEffect → videoTrack.attach(videoElement)
  → browser natively decodes/renders the <video> element
```

### F. Microphone
```
setMicrophoneEnabled(true) → LocalAudioTrack created + published
  → remote side: RoomEvent.TrackSubscribed (kind: audio)
  → VideoTile.jsx (remote only): preferredTrack(audioTrackPublications, Microphone)
  → audioTrack.attach(audioElement) → <audio autoPlay> plays it
```

### G. API authentication
See §7's sequence diagram — already given in full.

### H. Room validation
```
JoinRoomPage: validateRoom(roomCode)
  → GET /rooms/validate/:roomCode (Bearer token attached)
  → authenticateFirebaseUser → verifyIdToken
  → roomService.getRoomByCode (case-insensitive regex match)
  → not found → 404 → JoinRoomPage shows error, no navigation
  → found + ACTIVE + not expired → 200 { roomCode (canonical), status, expiresAt }
  → JoinRoomPage navigates to /meeting/<canonical roomCode>
```

---

## 23. INTERVIEW PREPARATION

### Basic Questions

**Q: Why React?**
A: It's a component-based UI library well suited to a stateful, interactive screen like a video meeting room, where many independent pieces (video tiles, controls, chat) need to update in response to asynchronous events.
How it applies to AuraGuard: every LiveKit event (`ParticipantConnected`, `TrackSubscribed`, etc.) ultimately flows into a `setState` call that re-renders exactly the affected components (e.g., `VideoGrid` recomputing its tile list).
Follow-up: "Why not a simpler vanilla-JS approach for something this event-driven?" → React's declarative re-render model meant I could describe "what the grid looks like given the current participant list" once, rather than manually diffing and patching DOM nodes every time someone joins/leaves.
Strong answer: frame it around *why the SDK's event-driven nature specifically benefits from a reactive UI framework*, not a generic "React is popular" answer.

**Q: Why Node.js/Express for the backend?**
A: A lightweight, well-understood framework for building a REST API; the backend here does very little compute-heavy work — it validates requests, talks to MongoDB, and signs a JWT — so Express's minimalism was a good fit rather than a bottleneck.
How it applies: `app.js` is a short, linear middleware pipeline; every room endpoint is a thin controller → service → Mongoose call.
Follow-up: "Isn't Node bad for CPU-heavy work?" → Yes, and this project doesn't do any — signing a token and a MongoDB query are both I/O-bound, which is Node's strength.

**Q: Why MongoDB?**
A: `Reason inferred from implementation` — the `Room` document maps naturally onto a document store (a self-contained object with an embedded `participants` array, no relational joins needed). The choice of MongoDB for the *project overall* predates the room work and wasn't something I decided from scratch.

**Q: Why Firebase for authentication?**
A: Avoids building/maintaining password storage, hashing, reset flows, and OAuth integrations myself; Firebase handles email/password and Google sign-in out of the box, and issues short-lived, independently verifiable ID tokens I can check server-side without any shared secret between frontend and backend.

**Q: Why LiveKit instead of implementing WebRTC yourself?**
A: Raw WebRTC requires you to build signaling, STUN/TURN for NAT traversal, and — for anything beyond a 1:1 call — your own SFU to avoid an N² mesh of peer connections. LiveKit provides all of that as a managed service; my backend's only responsibility in the media path is authorization (minting a scoped token), which is the standard, recommended integration pattern.

### Intermediate Questions

**Q: How does authentication work end-to-end?**
A: See §7 in full — Firebase issues an ID token client-side; the frontend attaches a fresh one to every request via an Axios interceptor; the backend independently verifies it with the Firebase Admin SDK on every protected request; there's no server-side session.
Follow-up: "What if the token expires mid-request?" → `getIdToken()` refreshes it transparently if needed before returning it, since it's called fresh per-request rather than cached.

**Q: How does the frontend communicate with the backend?**
A: Plain REST over HTTP/JSON, via an Axios client pointed at `VITE_API_BASE_URL`, gated by CORS on the backend (`origin: env.clientUrl`).

**Q: How does a remote video actually appear on screen?**
A: See §12/§22-E — subscription event → React state update → the tile component finds the right track publication by `Track.Source` → `.attach()` binds it to a real `<video>` element, and the browser does the rest natively.

**Q: What is a LiveKit track, precisely, in your code?**
A: A `LocalVideoTrack`/`RemoteVideoTrack` (or Audio equivalent) object obtained via `publication.track`, where `publication` is one entry in a participant's `videoTrackPublications`/`audioTrackPublications` Map.

**Q: What happens, step by step, when I click the camera toggle button?**
A: `handleToggleCamera` → `localParticipant.setCameraEnabled(false)` → LiveKit mutes/unpublishes the track → a `trackMuted`/`trackUnpublished` event fires on `localParticipant` → the `useEffect` in `MeetingControls.jsx` re-reads publication state and flips `isCameraEnabled` → the button re-renders. Remote participants separately receive their own `TrackMuted`/`TrackUnsubscribed` event and update their view of me.

**Q: Why does the backend need to generate the LiveKit token — why can't the frontend do it?**
A: Generating a token requires the LiveKit API secret, which can sign a token for *any* room with *any* permissions — if that secret were in frontend code, anyone could extract it and mint arbitrary access, bypassing all of AuraGuard's own room-existence/authorization checks entirely.

**Q: Why validate room codes against MongoDB instead of trusting whatever the user typed?**
A: See §8/§17-#4 — without it, any syntactically valid string was accepted as a "room," because nothing recorded which codes were real. This was an actual bug found and fixed in this project, not a hypothetical.

### Advanced Questions

**Q: How would you scale this to many concurrent users?**
A: `Reason inferred / not implemented` — the media path already scales independently, since LiveKit Cloud handles that, not my backend. For the REST API/MongoDB side, reasonable next steps (not yet done) would include a MongoDB TTL index on `expiresAt` instead of only filtering it in application code, and load-balancing multiple Express instances behind the existing `trust proxy` setting (already present in `app.js`, suggesting the project anticipated running behind a reverse proxy/load balancer even though none is configured yet).

**Q: What happens if LiveKit Cloud goes down?**
A: `Not implemented/not confirmed` — there's no fallback SFU or retry-with-backoff logic; `room.connect()` failing surfaces as a page-level error ("Failed to Join Room") with a manual "Back to Dashboard" action, not an automatic reconnect strategy beyond LiveKit's own built-in reconnection behavior (which is internal SDK behavior, not something AuraGuard's code configures explicitly beyond the default `room.connect()` call).

**Q: What happens if MongoDB goes down?**
A: `connectDB()` in `db.js` calls `process.exit(1)` if the *initial* connection fails, so the server won't start in a broken state. For a runtime disconnection after startup, the code only logs a warning (`mongoose.connection.on('disconnected', ...)`) — there's no automatic reconnect-and-queue-requests logic confirmed; any in-flight Mongoose query would simply fail and propagate as a 500 through the central error handler.

**Q: How would you secure the APIs further, given what you know is currently weak?**
A: Close the legacy `/rooms/token` endpoint (delete it or put it behind the same `authenticateFirebaseUser` + real room check the other endpoints use) — that's the single most direct fix, since it currently undermines the validation work already done everywhere else. Beyond that: add room-specific rate limiting rather than relying only on the global limiter, and add a TTL index so expired rooms are actually removed rather than only being filtered at read time.

**Q: How would you prevent unauthorized room access, beyond what's implemented?**
A: Currently, "authorized" only means "any authenticated Firebase user with the code." A real next step (not implemented) would be host-gated actions — e.g., only `hostId` being allowed to call `endRoom`, and a route actually exposing that (it exists in `room.service.js` but has no route today).

**Q: What is a Track vs. a TrackPublication, and why does your code care about the distinction?**
A: A publication is the *announcement/reference* a participant has a track available; the track itself, with a populated `.track`, only exists once subscribed (remote) or created (local). This project's code explicitly iterates publications (`videoTrackPublications`), not tracks directly, and checks `publication.source` (Camera vs. ScreenShare) to disambiguate once a participant can have more than one video track — this was a real bug (§16) fixed by exactly this distinction.

---

## 24. "EXPLAIN MY PROJECT" INTERVIEW SCRIPT

See §1 for the 30-second, 1-minute, and 2-minute versions — written to be spoken naturally, not read as documentation. Re-read them there before an interview; they are written in first person and grounded in the actual, specific bugs and decisions in this codebase (the room-casing bug, the `videoTrackPublications` vs. nonexistent `videoTrackSubscriptions` bug, the `useRef` decision) rather than generic technology-choice statements, which is what makes them defensible under follow-up questioning.

---

## 25. WHY EACH TECHNOLOGY?

| Technology | Why chosen | Problem it solves | Alternative | Why alternative wasn't selected |
|---|---|---|---|---|
| React | Component-based, declarative UI, well suited to many independently-updating pieces (video tiles) reacting to async SDK events | Keeping a complex, event-driven UI (participants joining/leaving, tracks publishing) in sync without manual DOM patching | Vanilla JS / another framework | `Reason inferred from implementation` — not stated in code; React's fit for this event-driven UI is the strongest inferable reason |
| Node.js + Express | Lightweight REST API framework, good fit for an I/O-bound backend (DB queries + token signing, no heavy compute) | Serving `/api/v1/rooms/*` | Another backend stack (e.g. a different language/framework) | `Reason inferred` — this was the pre-existing stack; not a decision made during the room-management work reviewed here |
| MongoDB (Mongoose) | Document shape fits a self-contained `Room` object with an embedded `participants` array | Persisting room existence/status/expiry as the authorization source of truth | A relational DB (e.g. PostgreSQL) | `Reason inferred` — not stated; a relational DB would work equally well for this specific schema, since it has no complex joins either way |
| Firebase Authentication | Avoids building password storage/reset/OAuth integration from scratch; issues independently server-verifiable ID tokens | Identity — "who is this user" | A custom JWT/session system | The project *does* have a legacy custom-JWT system (`auth.middleware.js`) already, but it wasn't extended to cover rooms because it's structurally incompatible with Firebase's token format — building a second, Firebase-specific verification path was simpler than unifying the two |
| LiveKit Cloud | Managed WebRTC/SFU — avoids building signaling, NAT traversal, and media routing | Real-time video/audio/data transport between browsers | Raw WebRTC (`RTCPeerConnection` directly) or self-hosting an SFU | Raw WebRTC doesn't scale past 1:1 without building your own SFU; self-hosting LiveKit would add ops overhead the project doesn't need for its current scale |
| Vite | Fast dev server + build tool for the React app | Local development speed, bundling | Create React App / Webpack directly | `Reason inferred` — Vite is the modern standard for new React projects; not stated explicitly in code |
| Tailwind CSS | Utility-first styling, fast iteration, no separate CSS-file sprawl | Consistent styling across many small components | Plain CSS / CSS-in-JS / a component library | `Reason inferred` — not stated |
| Zustand | Minimal global state for auth/UI chrome, without Redux's boilerplate | Small, cross-component state (`user`, `sidebarOpen`) that Context alone would re-render too broadly for | Redux / Context API | Redux would be significant overkill for two small, flat stores; Context was avoided for the reason Zustand exists — avoiding broad re-renders on every store change |

---

## 26. CURRENT IMPLEMENTATION VS FUTURE AI

### CURRENTLY IMPLEMENTED
- Firebase Authentication: Email/Password + Google login, Register, Logout.
- Backend Firebase ID token verification (`firebase-auth.middleware.js`).
- MongoDB-backed Room creation, validation, and joining, with case-insensitive canonical-code handling.
- LiveKit video connection, camera/microphone publish + toggle, remote video/audio rendering.
- Real-time text chat over LiveKit's data channel (no separate backend).
- Screen sharing (video-only), with camera/screen-share track disambiguation.
- Centralized backend error handling, request validation (Zod), CORS, rate limiting (global), Firebase Admin SDK integration.

### PARTIALLY IMPLEMENTED
- `@tanstack/react-query`: installed and provider-wired (`AppProviders.jsx`), but **no actual data-fetching hook usage found** anywhere reviewed — all current API calls use plain `async`/`await` + Axios directly (`roomApi.js`), not `useQuery`/`useMutation`.
- `endRoom()` service function: written in `room.service.js`, but **no route exposes it** — a room can never currently be explicitly ended via the API.
- Room "host" concept (`hostId`): stored on every Room document, but **not currently used to gate any action** — any participant, host or not, has identical permissions at the API level.
- Socket.io: initialized at server startup (`initSocket`, `registerSocketHandlers`) but its internal handlers were **not reviewed**, and no frontend code path reviewed for this document uses `socket.io-client` — status of any socket.io-based feature is `Not confirmed from the current codebase`.

### PLANNED (explicitly, per product-copy language on the landing page — NOT implemented)
- "Detect unsafe behavior in live video meetings" / "live monitoring, moderator workflows, and real-time alerts" — this is static marketing copy in `HeroSection.jsx`/`FeatureGrid.jsx` ("Live detection," "Moderator actions," "Operational visibility"), not backed by any functionality. The Hero section's "Live risk snapshot" card ("Policy violation detected in meeting stream" / "Moderator notified and escalation queued") is **hardcoded static example content**, not live data.
- A separate `AuraGuard-AI-Service` (FastAPI, Python) is referenced only via backend config (`src/clients/aiService.client.js`, `AI_SERVICE_BASE_URL` env var) as where "AI inference lives" — **its contents were not reviewed and no endpoint from it is confirmed called anywhere in the reviewed code paths.**

### NOT IMPLEMENTED (explicit correction to any prior assumption)
No face detection, multiple-face detection, phone detection, camera-covered detection, explicit-content detection, Whisper (speech-to-text), Gemini (or any LLM) moderation, or "violation engine" of any kind exists in either repository as reviewed for this document. **If any earlier discussion of this project referenced a "Your Safety Layer" section with cards like "AI Protection / Vision Analysis / Audio Intelligence / Real-time Alerts" on the Dashboard — that does not exist in the current `DashboardPage.jsx`.** The current Dashboard contains only: a welcome header, Create Room / Join Room action cards, and a "Recent Activity" list backed by **mock data** (`src/utils/mockData.js`, `mockRecentActivity`) — not real backend data.

---

## 27. DEVELOPER KNOWLEDGE CHECKLIST

After studying this documentation, you should be able to explain:

- [x] React architecture (component tree, where state lives, why `useRef` vs `useState` for the LiveKit Room)
- [x] API calls (Axios interceptor, token attachment, `roomApi.js`)
- [x] Authentication (Firebase login flow, ID tokens, Admin SDK verification)
- [x] Firebase token flow (frontend obtain → attach → backend verify, per-request, no session)
- [x] Express middleware (helmet/cors/json/cookies/logger/rateLimit/auth/validate/error, in order)
- [x] Controllers/services (room.controller.js ↔ room.service.js separation)
- [x] MongoDB room model (every field, and which were changed from ObjectId to String and why)
- [x] Room creation (server-generates code, persists, returns)
- [x] Room validation (case-insensitive lookup, status/expiry checks)
- [x] Room joining (two-step: validate on Join page, join+token on meeting page; canonical-code propagation)
- [x] LiveKit architecture (Room/Participant/Track/Publication vocabulary, using this project's own code)
- [x] Participants (local vs. remote, how the list is refreshed)
- [x] Tracks (Local/RemoteVideoTrack, `.attach()`/`.detach()`)
- [x] Publications (`videoTrackPublications`/`audioTrackPublications`, `.source`, `.track`)
- [x] Subscriptions (`autoSubscribe: true`, `TrackSubscribed`/`TrackUnsubscribed`)
- [x] Camera flow (permission → local track → publish → SFU → remote subscribe → attach → render)
- [x] Microphone flow (same pattern, `Track.Source.Microphone`, remote-only `<audio>`)
- [x] Token generation (backend-only, why the secret can't be in the frontend)
- [x] Error handling (ApiError/ApiResponse/catchAsync/error.middleware pattern)
- [x] Security (what's implemented vs. the four specific, confirmed weaknesses in §18)
- [x] Debugging (the `[ROOM]`/`[LIVEKIT]`/`[VIDEO]`/`[AUTH BACKEND]`/`[CHAT]`/`[SCREEN SHARE]` logging convention and how to read it)
- [ ] Deployment architecture — **not checked**, because no deployment configuration exists in either repository as reviewed; there is nothing to explain here yet.

---

*Document generated by reading the current codebase directly (both repos) on the date of this session. Where a claim could not be verified from actual code, it is explicitly marked `Not confirmed from the current codebase` rather than inferred or invented. If the code changes after this document is written, re-verify against the code — the code is always the source of truth, not this file.*
