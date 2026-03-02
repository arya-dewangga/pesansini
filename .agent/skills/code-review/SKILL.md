---
name: code-review
description: Perform a structured code review on one or more files in the order-app project. Checks for correctness, adherence to project conventions (rules.md), security, and UX quality.
---

# Code Review Skill

When asked to review code, follow these steps exactly.

---

## Step 1 — Read the target file(s)

Use `view_file` to read every file that needs to be reviewed. If the user didn't specify, ask which file(s) to review.

---

## Step 2 — Check each category below

Go through every category and note findings. Only report a category if there is something to say about it.

### ✅ Correctness
- Logic errors, off-by-one, incorrect conditions
- `async/await` used correctly; errors caught in `try/catch`
- `useEffect` has correct dependency array; no stale closures
- `onSnapshot` listeners are always unsubscribed in cleanup

### 🏗️ Architecture & Conventions (check against `.agent/rules.md`)
- Firebase calls must go through `src/services/`, never directly in pages/components
- New pages registered in `App.jsx` with correct route guard (`ProtectedRoute` / `PublicRoute`)
- Route paths are kebab-case
- Back navigation uses `window.history.length > 2` guard before `navigate(-1)`
- `serverTimestamp()` used for `createdAt`/`updatedAt`, never `new Date()`
- `increment()` used for counter fields, never manual math
- No TypeScript annotations or `React.FC`
- No direct `console.log` (only `console.error` for real errors)

### 🎨 Styling & UI
- Design tokens used (`text-primary`, `bg-background-light`, etc.) — no raw hex colors
- Page layout follows `min-h-screen bg-background-light flex flex-col items-center` → inner `w-full max-w-md`
- Cards use `rounded-3xl shadow-card border border-gray-100`
- Primary buttons use `rounded-2xl`
- Icons use `material-icons-round` (not SVGs, not Lucide) unless Lucide is already imported in that file
- Interactive elements have `transition-colors` and `active:scale-95` or `active:scale-[0.98]`
- `pb-32` on `<main>` when a fixed bottom bar is present

### 🔔 UX & Feedback
- Loading state shown while async data is fetching
- Not-found fallback shown when Firestore document is `null` after loading
- All user actions give feedback via `toast.success()` or `toast.error()`
- Destructive actions (delete, close room) use `ConfirmationModal`

### 🔒 Security
- No Firebase credentials hard-coded (must use `import.meta.env.VITE_*`)
- The `phoneNumber@bukber.app` email mapping is only inside `authService.js`
- Firestore rules cover the data being written (cross-check with `firestore.rules`)

### ⚡ Performance
- `onSnapshot` preferred over one-time `getDoc`/`getDocs` for live data
- Firestore `where` + `orderBy` on different fields requires a composite index — flag if present
- Large lists paginated or chunked (Firestore `in` supports max 10 items)

### 🧹 Code Cleanliness
- No unused imports or variables
- Derived state computed after hooks, not inside JSX
- No magic strings — room status values are `'open'` / `'closed'`
- Helper functions are inside the component unless reusable (then move to `src/utils/`)

---

## Step 3 — Write the review

Structure the output as follows:

```
## Code Review: <filename>

### Summary
One or two sentences describing the overall quality.

### Findings

#### 🔴 Critical  (must fix before merge)
- ...

#### 🟡 Warnings  (should fix)
- ...

#### 🔵 Suggestions  (nice to have)
- ...

#### ✅ Looks good
- ...
```

- Use **file + line number** references where possible (e.g., `LoginPage.jsx:31`)
- If there are no findings in a severity level, omit that section
- End with a **verdict**: `✅ Approve`, `🟡 Approve with comments`, or `🔴 Request changes`

---

## Step 4 — Offer to fix

After presenting the review, ask the user: *"Would you like me to fix any of these findings?"*  
If yes, apply the fixes using the appropriate edit tools and then run `npm run test:run` to verify nothing broke.
