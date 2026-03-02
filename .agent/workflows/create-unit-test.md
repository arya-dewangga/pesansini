---
description: how to create unit tests for this project
---

# Unit Test Workflow

This project uses **Vitest** (built on Vite) + **React Testing Library** for unit tests.

---

## Step 1 — Install dependencies (first time only)

Check whether Vitest is already installed:

```bash
grep -E "vitest|@testing-library" package.json
```

If not present, install the testing stack:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## Step 2 — Configure Vitest

Add a `test` block inside `vite.config.js`:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
```

Create the setup file at `src/test/setup.js`:

```js
import '@testing-library/jest-dom';
```

Add a `test` script to `package.json`:

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run"
}
```

---

## Step 3 — Identify what to test

| Target | What to test |
|---|---|
| `src/utils/*` | Pure functions — test inputs and outputs directly |
| `src/services/*` | Mock Firestore/Auth; test the service function logic |
| `src/components/*` | Render component, assert DOM output and interactions |
| `src/pages/*` | Integration: render with mocked router + auth context, assert page behaviour |

---

## Step 4 — File placement & naming

- Place test files **next to the file they test**:
  - `src/utils/clipboard.js` → `src/utils/clipboard.test.js`
  - `src/components/ConfirmationModal.jsx` → `src/components/ConfirmationModal.test.jsx`
  - `src/services/roomService.js` → `src/services/roomService.test.js`
- Use `.test.js` for plain JS, `.test.jsx` for files with JSX.

---

## Step 5 — Mock Firebase

Never call real Firebase in tests. At the top of every service test file, mock the firebase module:

```js
// Example: src/services/roomService.test.js
import { vi } from 'vitest';

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
  increment: vi.fn((n) => n),
  arrayUnion: vi.fn(),
}));
```

---

## Step 6 — Mock AuthContext for component/page tests

```js
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../contexts/AuthContext';

// Mock the useAuth hook
vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
  currentUser: { uid: 'test-uid' },
  userData: { uid: 'test-uid', displayName: 'Test User', phoneNumber: '081234567890' },
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
});

// Wrap component in required providers
function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}
```

---

## Step 7 — Write the test

### Utility function example

```js
// src/utils/clipboard.test.js
import { describe, it, expect, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

describe('copyTextToClipboard', () => {
  it('returns true when clipboard write succeeds', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const result = await copyTextToClipboard('hello');
    expect(result).toBe(true);
  });
});
```

### Component example

```jsx
// src/components/ConfirmationModal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from './ConfirmationModal';

describe('ConfirmationModal', () => {
  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Delete?"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

---

## Step 8 — Run tests

```bash
# Watch mode (during development)
npm test

# Single run (CI / before commit)
npm run test:run

# Interactive UI
npm run test:ui
```

---

## Checklist

- [ ] Vitest + Testing Library installed
- [ ] `vite.config.js` updated with `test` block
- [ ] `src/test/setup.js` created
- [ ] `package.json` scripts updated
- [ ] Firebase mock defined for service tests
- [ ] `useAuth` mock defined for page/component tests
- [ ] Test file placed next to the file it tests, named `*.test.js(x)`
- [ ] Tests pass with `npm run test:run`
