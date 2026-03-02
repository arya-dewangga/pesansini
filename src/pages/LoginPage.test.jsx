import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as AuthContext from '../contexts/AuthContext';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock react-hot-toast so we can assert on calls without real toasts
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock package.json version import used in the footer
vi.mock('../../package.json', () => ({ default: { version: '1.0.0' } }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function renderLogin({ loginFn = vi.fn(), locationState = null } = {}) {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        currentUser: null,
        userData: null,
        loading: false,
        login: loginFn,
        register: vi.fn(),
        logout: vi.fn(),
    });

    const initialEntry = locationState
        ? { pathname: '/login', state: locationState }
        : '/login';

    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <LoginPage />
        </MemoryRouter>
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Rendering ---

    it('renders phone and password inputs', () => {
        renderLogin();
        expect(screen.getByLabelText(/Nomor WhatsApp/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Kata Sandi/i)).toBeInTheDocument();
    });

    it('renders the submit button', () => {
        renderLogin();
        expect(screen.getByRole('button', { name: /Masuk/i })).toBeInTheDocument();
    });

    it('renders the register link', () => {
        renderLogin();
        expect(screen.getByRole('link', { name: /Daftar Sekarang/i })).toBeInTheDocument();
    });

    it('renders the help WhatsApp link', () => {
        renderLogin();
        const helpLink = screen.getByRole('link', { name: /Butuh Bantuan/i });
        expect(helpLink).toHaveAttribute('href', 'https://wa.me/628988804460');
    });

    // --- Password visibility toggle ---

    it('toggles password visibility when the eye button is clicked', async () => {
        renderLogin();
        const passwordInput = screen.getByLabelText(/Kata Sandi/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        // The toggle button contains a material icon span — find it by its icon text
        const toggleBtn = screen.getByText('visibility_off').closest('button');
        await userEvent.click(toggleBtn);
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(screen.getByText('visibility')).toBeInTheDocument();

        await userEvent.click(toggleBtn);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    // --- Validation ---

    it('shows error toast when submitting with empty fields', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderLogin();

        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        expect(toast.error).toHaveBeenCalledWith('Mohon lengkapi semua data');
    });

    it('shows error toast when only phone is filled', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderLogin();

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        expect(toast.error).toHaveBeenCalledWith('Mohon lengkapi semua data');
    });

    // --- Successful login ---

    it('calls login() with phone and password on submit', async () => {
        const loginFn = vi.fn().mockResolvedValue(undefined);
        renderLogin({ loginFn });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'secret123');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        await waitFor(() => expect(loginFn).toHaveBeenCalledWith('081234567890', 'secret123'));
    });

    it('navigates to /dashboard after successful login', async () => {
        const loginFn = vi.fn().mockResolvedValue(undefined);
        renderLogin({ loginFn });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'secret123');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
    });

    it('navigates to the original route (from state) after login', async () => {
        const loginFn = vi.fn().mockResolvedValue(undefined);
        renderLogin({
            loginFn,
            locationState: { from: { pathname: '/room/abc123' } },
        });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'secret123');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/room/abc123', { replace: true })
        );
    });

    it('falls back to /dashboard instead of /profile (security guard)', async () => {
        const loginFn = vi.fn().mockResolvedValue(undefined);
        renderLogin({
            loginFn,
            locationState: { from: { pathname: '/profile' } },
        });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'secret123');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
        );
    });

    // --- Failed login ---

    it('shows error toast when login() throws', async () => {
        const toast = (await import('react-hot-toast')).default;
        const loginFn = vi.fn().mockRejectedValue(new Error('auth/wrong-password'));
        renderLogin({ loginFn });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'wrongpass');
        fireEvent.click(screen.getByRole('button', { name: /Masuk/i }));

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Gagal login. Periksa kembali nomor HP dan password Anda.'
            )
        );
    });

    it('re-enables the submit button after a failed login', async () => {
        const loginFn = vi.fn().mockRejectedValue(new Error('auth/wrong-password'));
        renderLogin({ loginFn });

        await userEvent.type(screen.getByLabelText(/Nomor WhatsApp/i), '081234567890');
        await userEvent.type(screen.getByLabelText(/Kata Sandi/i), 'wrongpass');

        // Use the form's submit button (type=submit)
        const submitBtn = screen.getByRole('button', { name: /Masuk/i });
        fireEvent.click(submitBtn);

        // After the failed login resolves, the button should no longer be disabled
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Masuk/i })).not.toBeDisabled()
        );
    });
});
