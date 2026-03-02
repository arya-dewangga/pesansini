import { test, expect } from '@playwright/test';

const TEST_PHONE = process.env.VITE_TEST_PHONE || '';
const TEST_PASSWORD = process.env.VITE_TEST_PASSWORD || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function goToLogin(page) {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
}

async function fillLoginForm(page, phone, password) {
    await page.getByLabel(/Nomor WhatsApp/i).fill(phone);
    await page.getByLabel(/Kata Sandi/i).fill(password);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {

    test.beforeEach(async ({ page }) => {
        await goToLogin(page);
    });

    // ── Rendering ──────────────────────────────────────────────────────────

    test('renders the login page with all expected elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Mulai Catat Pesanan/i })).toBeVisible();
        await expect(page.getByLabel(/Nomor WhatsApp/i)).toBeVisible();
        await expect(page.getByLabel(/Kata Sandi/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Masuk/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Daftar Sekarang/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Butuh Bantuan/i })).toBeVisible();
    });

    test('displays the app version in the footer', async ({ page }) => {
        await expect(page.locator('text=/^v\\d+\\.\\d+\\.\\d+$/')).toBeVisible();
    });

    // ── Password Visibility Toggle ─────────────────────────────────────────

    test('password input starts as type=password', async ({ page }) => {
        const input = page.getByLabel(/Kata Sandi/i);
        await expect(input).toHaveAttribute('type', 'password');
    });

    test('clicking the eye icon reveals the password', async ({ page }) => {
        const input = page.getByLabel(/Kata Sandi/i);
        await input.fill('mypassword');

        const toggleBtn = page.locator('text=visibility_off').locator('..');
        await toggleBtn.click();

        await expect(input).toHaveAttribute('type', 'text');
        await expect(page.locator('text=visibility')).toBeVisible();
    });

    test('clicking the eye icon again hides the password', async ({ page }) => {
        const input = page.getByLabel(/Kata Sandi/i);
        await input.fill('mypassword');

        // Use a stable locator: the toggle button is the only button inside the password field wrapper
        const toggleBtn = page.locator('button[type="button"]');
        await toggleBtn.click(); // → text (visible)
        await expect(input).toHaveAttribute('type', 'text');

        await toggleBtn.click(); // → password (hidden)
        await expect(input).toHaveAttribute('type', 'password');
    });

    // ── Validation & Error Feedback ────────────────────────────────────────

    test('shows error toast when submitting with empty fields', async ({ page }) => {
        await page.getByRole('button', { name: /Masuk/i }).click();
        await expect(page.getByText('Mohon lengkapi semua data')).toBeVisible();
    });

    test('shows error toast when only phone is filled', async ({ page }) => {
        await page.getByLabel(/Nomor WhatsApp/i).fill('081234567890');
        await page.getByRole('button', { name: /Masuk/i }).click();
        await expect(page.getByText('Mohon lengkapi semua data')).toBeVisible();
    });

    test('shows error toast for wrong credentials', async ({ page }) => {
        await fillLoginForm(page, '081111111111', 'wrongpassword');
        await page.getByRole('button', { name: /Masuk/i }).click();
        await expect(
            page.getByText('Gagal login. Periksa kembali nomor HP dan password Anda.')
        ).toBeVisible({ timeout: 15_000 });
    });

    test('submit button is re-enabled after a failed login attempt', async ({ page }) => {
        // Tests that setLoading(false) in the finally block works correctly.
        // The transient disabled state is too brief to assert reliably in E2E,
        // so we assert on the stable post-failure state instead.
        await fillLoginForm(page, '081111111111', 'wrongpassword');
        await page.getByRole('button', { name: /Masuk/i }).click();

        // After Firebase responds with an error, the button should be clickable again
        await expect(page.getByRole('button', { name: /Masuk/i })).toBeEnabled({ timeout: 15_000 });
    });

    // ── Successful Login ───────────────────────────────────────────────────
    // These tests require VITE_TEST_PHONE and VITE_TEST_PASSWORD to be set in .env

    test('successful login shows success toast and redirects to /dashboard', async ({ page }) => {
        test.skip(!TEST_PHONE || !TEST_PASSWORD, 'VITE_TEST_PHONE / VITE_TEST_PASSWORD not set');

        await fillLoginForm(page, TEST_PHONE, TEST_PASSWORD);
        await page.getByRole('button', { name: /Masuk/i }).click();

        await expect(page.getByText('Login berhasil!')).toBeVisible({ timeout: 15_000 });
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    });

    test('after login, visiting /login redirects back to /dashboard (PublicRoute guard)', async ({ page }) => {
        test.skip(!TEST_PHONE || !TEST_PASSWORD, 'VITE_TEST_PHONE / VITE_TEST_PASSWORD not set');

        // Login first
        await fillLoginForm(page, TEST_PHONE, TEST_PASSWORD);
        await page.getByRole('button', { name: /Masuk/i }).click();
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

        // Navigate back to /login — should be redirected away
        await page.goto('/login');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('deep-link is preserved after login', async ({ page }) => {
        test.skip(!TEST_PHONE || !TEST_PASSWORD, 'VITE_TEST_PHONE / VITE_TEST_PASSWORD not set');

        // Access a protected page directly while logged out
        await page.goto('/history');
        await expect(page).toHaveURL(/\/login/); // ProtectedRoute kicks in

        // Login — should be sent to /history, not /dashboard
        await fillLoginForm(page, TEST_PHONE, TEST_PASSWORD);
        await page.getByRole('button', { name: /Masuk/i }).click();
        await expect(page).toHaveURL(/\/history/, { timeout: 15_000 });
    });

    // ── Navigation links ───────────────────────────────────────────────────

    test('"Daftar Sekarang" link navigates to /register', async ({ page }) => {
        await page.getByRole('link', { name: /Daftar Sekarang/i }).click();
        await expect(page).toHaveURL(/\/register/);
    });

    test('"Butuh Bantuan?" link points to the correct WhatsApp URL', async ({ page }) => {
        const link = page.getByRole('link', { name: /Butuh Bantuan/i });
        await expect(link).toHaveAttribute('href', 'https://wa.me/628988804460');
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
});
