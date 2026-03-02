---
trigger: always_on
---

# AI Agent Rules — Order App

Rules for the AI agent when working on this project. Derived from the current implementation.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v3 (custom config) |
| Icons | Material Icons Round (`material-icons-round`) + Material Symbols (`material-symbols-outlined`) |
| Notifications | `react-hot-toast` |
| Backend | Firebase (Firestore + Firebase Auth) |
| Font | Plus Jakarta Sans (Google Fonts) |
| Deployment | Vercel (`vercel.json` SPA redirect config) |

---

## 2. Project Structure

```
src/
  pages/       → Full-page components (one file per route)
  components/  → Shared reusable UI components
  contexts/    → React contexts (AuthContext only)
  services/    → Firebase service functions (authService, roomService, orderService)
  utils/       → Pure utility functions (e.g., clipboard.js)
  firebase.js  → Firebase app init; exports `auth` and `db`
  App.jsx      → Routing tree (ProtectedRoute / PublicRoute wrappers)
  index.css    → Global styles + Tailwind directives
```

- **New pages** go in `src/pages/` and must be imported and registered in `App.jsx`.
- **New shared UI** goes in `src/components/`.
- **All Firebase calls** must go through a service file in `src/services/`, never called directly from a page component.
- **New utilities** go in `src/utils/`.

---

## 3. Component Conventions

- Use `export default function ComponentName()` (named default export, PascalCase).
- File name matches the exported function name exactly (e.g., `RoomPage.jsx` → `export default function RoomPage()`).
- Pages are `function PageName()`, components are `function ComponentName()`.
- Use functional components only — no class components.
- Keep hooks at the top of the component, before any derived state or helper functions.
- Derived state (e.g., `const myOrder = orders.find(...)`) goes after hooks.
- Helper functions defined inside the component (not exported unless reusable).

---

## 4. Routing & Auth

- **Protected routes** wrap pages with `<ProtectedRoute>`. Unauthenticated users are redirected to `/login` with `state={{ from: location }}` (deep-link preservation).
- **Public-only routes** (login, register) wrap pages with `<PublicRoute>`. Authenticated users are redirected to `location.state?.from?.pathname || '/dashboard'`.
- Route paths follow kebab-case: `/create-room`, `/edit-profile`, `/room/:id/form`.
- **Back navigation**: check `window.history.length > 2` before calling `navigate(-1)`, otherwise fall back to `navigate('/dashboard')`.

---

## 5. Firestore Data Model

### `users/{uid}`
```
uid, phoneNumber, displayName, createdAt, joinedRooms[]
```

### `rooms/{roomId}`
```
id, roomCode, hostUid, hostName, eventName, restaurantName,
deadline, notes, status ('open'|'closed'), createdAt, participantCount
```

### `rooms/{roomId}/orders/{orderId}`
```
participantUid, participantName, items[{ menuName, quantity, notes }],
createdAt, updatedAt?
```

- Auth uses a fake-email pattern: `{phoneNumber}@bukber.app` — never expose or hard-code this mapping outside `authService.js`.
- Room codes are 6-digit numeric strings generated client-side.

---

## 6. Service Layer Rules

- Each service file corresponds to one Firestore collection (`roomService`, `orderService`, `authService`).
- Use `onSnapshot` for real-time listeners. Always return the unsubscribe function and call it in `useEffect` cleanup.
- Use `serverTimestamp()` for all `createdAt`/`updatedAt` fields — never `new Date()`.
- Use `increment()` for counter fields (`participantCount`).
- Never perform direct Firestore calls inside page/component files.

---

## 7. Styling conventions

### Design tokens (always use these, not raw colors)
| Token | Value | Usage |
|---|---|---|
| `primary` | `#f48c25` | Brand orange, CTAs, active states |
| `primary-dark` | `#d97715` | Hover state for primary |
| `background-light` | `#f8f7f5` | Page background |
| `surface-light` | `#ffffff` | Cards |
| `shadow-card` | custom | Cards |
| `shadow-fab` | custom | Floating action buttons |

### Layout
- All pages use a **mobile-first, centered single-column** layout: `min-h-screen bg-background-light flex flex-col items-center` → inner `w-full max-w-md`.
- Use `px-6` for horizontal page padding.
- Use `pb-32` on `<main>` when a fixed bottom bar is present, to prevent content clipping.

### Rounding & Elevation
- Cards: `rounded-3xl shadow-card border border-gray-100`
- Buttons (primary, full-width): `rounded-2xl`
- Pill/tag: `rounded-full`

### Icons
- Navigation / inline icons → `<span className="material-icons-round">icon_name</span>`
- QR / special glyphs → `<span className="material-symbols-outlined">icon_name</span>`
- Do **not** use SVGs or Lucide icons unless already imported in that file.

### Animations
- Interactive elements: `transition-colors`, `active:scale-95` or `active:scale-[0.98]`
- Loading spinner: `animate-spin` on a rounded border div — see `LoadingSpinner.jsx` for reference.

---

## 8. UX & Feedback

- Use `toast.success()` / `toast.error()` (from `react-hot-toast`) for all user feedback.
- Show a `loading` guard at the start of every page that fetches async data (return spinner or null while loading).
- Show a "not found" fallback when a Firestore document doesn't exist (check `if (!room)` after loading).
- Use the `ConfirmationModal` component for destructive actions (delete, close room).

---

## 9. Environment Variables

All Firebase config values must come from `import.meta.env.VITE_*` variables defined in `.env`. Never hard-code Firebase credentials. The `.env` file is gitignored.

---

## 10. Do Not

- Do **not** add new CSS frameworks or UI libraries (no Material UI, no Chakra, no shadcn) unless explicitly asked.
- Do **not** use `React.FC` or TypeScript annotations — this project is plain JavaScript.
- Do **not** use `any` service or utility not already in `node_modules` without asking first.
- Do **not** add console.log statements in production code unless they are `console.error` for actual error conditions.
- Do **not** write Firestore queries with `orderBy` + `where` on different fields without ensuring a Firestore composite index exists.
