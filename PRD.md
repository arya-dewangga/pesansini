# Product Requirements Document (PRD): Bukber Order App

## 1. Overview
The **Bukber Order App** is a web-based application designed to simplify the coordination of Iftar (Buka Puasa) food orders within a group. A **Host** creates a "room" for an event, generates a unique link/QR code, and shares it with participants. **Participants** access the link to input their orders. The Host can then monitor all orders in real-time and generate a summary for the restaurant.

## 2. Goals & Success Metrics
-   **Simplicity**: Hosts can create a room in under 1 minute.
-   **Transparency**: Participants can see each other's orders to avoid duplicates or confusion.
-   **Efficiency**: Consolidates orders into a single view for the host.

## 3. Tech Stack
-   **Frontend**: React (v19) + Vite
-   **Styling**: Tailwind CSS (with a custom design system based on the "Orange/Friendly" theme)
-   **Backend / Database**: Firebase (Firestore)
-   **Routing**: React Router DOM (v7)
-   **State Management**: React Context + Hooks
-   **Utilities**:
    -   `react-hot-toast` for notifications
    -   `qrcode.react` for generating room QR codes
    -   `lucide-react` for icons
    -   `bcryptjs` (or similar) for password hashing

## 4. User Flows

### 4.1. Host Flow (Owner)
1.  **Registration/Login**:
    -   **Register**: Input Phone Number, Display Name, Password. System checks if Phone Number exists. If unique, hash password and save to `users` collection.
    -   **Login**: Input Phone Number and Password. specific System validates credentials against `users` collection. Set user session (localStorage/Context).
2.  **Dashboard**:
    -   View list of active and past rooms (query `rooms` where `hostId` == `currentUser.uid`).
    -   Button to "Create New Room".
3.  **Create Room**:
    -   Input: Event Name (e.g., "Bukber Kantor"), Restaurant Name, Date/Time Deadline, Optional Notes.
    -   Action: System generates a unique creates a Room ID.
4.  **Share Room**:
    -   Host views Room Details.
    -   Host sees a unique Invite Link (e.g., `/room/:uniqueId`) and QR Code.
    -   Host shares this link/QR with friends.
5.  **Monitor & Manage**:
    -   Real-time list of incoming participant orders (Firestore `onSnapshot`).
    -   Ability for the Host to input their own order.
    -   Ability for the Host to edit participant order.
    -   "Close Room" action to lock orders after the deadline (update `status` to `closed`).
    -   Summary view (Total items, Total price if applicable).

### 4.2. Participant Flow (Guest)
1.  **Access**:
    -   Opens the shared unique link.
    -   **Authentication**: If not logged in, prompt to Login or Register (same flow as Host).
2.  **Room View**:
    -   View Event Details (Host Name, Restaurant, Deadline).
    -   **Status Check**: If `status` is `closed` or `deadline` passed, disable order form.
    -   View existing orders from other participants (Transparency).
3.  **Place Order**:
    -   Form pre-filled with their Display Name & Phone (from Session).
    -   Menu Selection: Text input (or predefined limit).
    -   Validate: At least 1 item key-in.
    -   Submit: Create document in `orders` collection.
4.  **Confirmation**:
    -   Success message/toast.
    -   Redirect to Room View to see their order in the list.

## 5. Design System (Based on Stitch Project)
-   **Theme**: Friendly, Social, Appetizing.
-   **Primary Color**: `#f48c25` (Orange) for primary actions and highlights.
-   **Typography**: `Plus Jakarta Sans` for a modern, geometric look.
-   **Shape**: `ROUND_FULL` (High border-radius buttons and cards).
-   **Layout**: Mobile-first responsive design.

## 6. Database Schema (Firestore)

### `users` Collection
Stores user profile information.
```json
{
  "uid": "string (UUID or Auto-ID)",
  "phoneNumber": "string (+6281234567890) [Unique Index]",
  "password": "string (hashed)",
  "displayName": "string",
  "createdAt": "timestamp"
}
```

### `rooms` Collection
Represents a Bukber event.
```json
{
  "id": "string (Auto-ID)",
  "hostId": "string (ref users.uid)",
  "hostName": "string",
  "title": "string (Event Name)",
  "restaurant": "string",
  "deadline": "timestamp",
  "notes": "string (optional)",
  "uniqueId": "string (8-char random alphanumeric, for URL)",
  "status": "open" | "closed",
  "createdAt": "timestamp"
}
```

### `orders` Collection
Individual orders placed within a room.
```json
{
  "id": "string (Auto-ID)",
  "roomId": "string (ref rooms.id)",
  "participantId": "string (ref users.uid)",
  "participantName": "string",
  "phoneNumber": "string (redundant but useful for quick contact)",
  "menuItems": ["string"],
  "notes": "string (optional)",
  "createdAt": "timestamp"
}
```

## 7. Folder Structure
The project follows a standard feature-based React architecture.

```
src/
├── assets/             # Static assets (images, logos)
├── components/         # Reusable UI components
│   ├── ui/             # Generic UI elements (Button, Input, Card)
│   ├── layout/         # Layout components (Navbar, Footer, ProtectedRoute)
│   └── icons/          # Icon wrappers (if not using lucide-react directly)
├── contexts/           # React Contexts
│   └── AuthContext.jsx # Handles user session state
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Auth logic hook
│   └── useRooms.js     # Room management logic
├── lib/                # Utility libraries and configurations
│   ├── firebase.js     # Firebase initialization
│   └── utils.js        # Helper functions (date formatting, class names)
├── pages/              # Page components (routed views)
│   ├── Auth/           # Login/Register pages
│   ├── Dashboard/      # Host dashboard
│   ├── Room/           # Room details and creation
│   └── NotFound.jsx    # 404 page
├── services/           # API/Firestore service functions
│   ├── authService.js  # specific auth logic
│   └── dbService.js    # Firestore CRUD operations
├── App.jsx             # Main app component & Routing
└── main.jsx            # Entry point
```

## 8. Detailed Business Logic

### Authentication Logic
-   **Sign Up**: 
    1.  Check `users` collection for existing `phoneNumber`.
    2.  If exists -> Throw error "Phone number already registered".
    3.  If new -> Hash password (bcrypt), create user doc.
-   **Login**:
    1.  Query `users` by `phoneNumber`.
    2.  If not found -> Error "User not found".
    3.  Compare input password with stored hash.
    4.  If match -> key session token (store UID in localStorage), redirect to Dashboard.

### Room Logic
-   **Unique ID Generation**: Generate a short 8-char string (e.g., `BKBR-2024`) for easier sharing url than the long Firestore ID.
-   **Closing Room**:
    -   Manual: Host clicks "Close Room".
    -   Auto: Front-end checks if `new Date() > room.deadline` to show "Closed" badge, but strictly enforced by Host action or Firestore Rules (if implemented).

### Order Logic
-   **Transparency**:
    -   Detailed realtime listener on `orders` where `roomId` == current room.
    -   This allows everyone to see "Who ordered what" to prevent duplication.
