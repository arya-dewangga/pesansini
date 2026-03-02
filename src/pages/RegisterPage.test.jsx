import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import * as AuthContext from '../contexts/AuthContext';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../package.json', () => ({ default: { version: '1.0.0' } }));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderRegister({ registerFn = vi.fn(), locationState = null } = {}) {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        currentUser: null,
        userData: null,
        loading: false,
        login: vi.fn(),
        register: registerFn,
        logout: vi.fn(),
    });

    const initialEntry = locationState
        ? { pathname: '/register', state: locationState }
        : '/register';

    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <RegisterPage />
        </MemoryRouter>
    );
}

// Shortcuts for the four inputs (no id attrs — query by placeholder)
const getNameInput = () => screen.getByPlaceholderText(/Budi Santoso/i);
const getPhoneInput = () => screen.getByPlaceholderText(/0812 3456 7890/i);
// There are two password inputs sharing the same placeholder — use getAllByPlaceholderText
const getPasswordInput = () => screen.getAllByPlaceholderText('••••••••')[0];
const getConfirmPasswordInput = () => screen.getAllByPlaceholderText('••••••••')[1];
const getSubmitBtn = () => screen.getByRole('button', { name: /Daftar Sekarang/i });

// Fill all four fields with valid data
async function fillValidForm() {
    await userEvent.type(getNameInput(), 'Budi Santoso');
    await userEvent.type(getPhoneInput(), '081234567890');
    await userEvent.type(getPasswordInput(), 'password123');
    await userEvent.type(getConfirmPasswordInput(), 'password123');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Rendering ---

    it('renders all four input fields', () => {
        renderRegister();
        expect(getNameInput()).toBeInTheDocument();
        expect(getPhoneInput()).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    it('renders the submit button', () => {
        renderRegister();
        expect(getSubmitBtn()).toBeInTheDocument();
    });

    it('renders the login link in the footer', () => {
        renderRegister();
        expect(screen.getByRole('link', { name: /Masuk/i })).toBeInTheDocument();
    });

    it('renders the page heading', () => {
        renderRegister();
        expect(screen.getByRole('heading', { name: /Registrasi Baru/i })).toBeInTheDocument();
    });

    // --- Password visibility toggle ---

    it('both password fields start as type=password', () => {
        renderRegister();
        const [pwd, confirm] = screen.getAllByPlaceholderText('••••••••');
        expect(pwd).toHaveAttribute('type', 'password');
        expect(confirm).toHaveAttribute('type', 'password');
    });

    it('toggles both password fields to type=text when eye button is clicked', async () => {
        renderRegister();
        const toggleBtn = screen.getByText('visibility_off').closest('button');
        await userEvent.click(toggleBtn);

        const [pwd, confirm] = screen.getAllByPlaceholderText('••••••••');
        expect(pwd).toHaveAttribute('type', 'text');
        expect(confirm).toHaveAttribute('type', 'text');
    });

    it('toggles back to type=password when eye button is clicked again', async () => {
        renderRegister();
        const toggleBtn = screen.getByText('visibility_off').closest('button');
        await userEvent.click(toggleBtn); // → text
        await userEvent.click(toggleBtn); // → password

        const [pwd, confirm] = screen.getAllByPlaceholderText('••••••••');
        expect(pwd).toHaveAttribute('type', 'password');
        expect(confirm).toHaveAttribute('type', 'password');
    });

    // --- Validation: empty fields ---

    it('shows error toast when all fields are empty', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderRegister();
        fireEvent.click(getSubmitBtn());
        expect(toast.error).toHaveBeenCalledWith('Mohon lengkapi semua data');
    });

    it('shows error toast when only name is filled', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderRegister();
        await userEvent.type(getNameInput(), 'Budi');
        fireEvent.click(getSubmitBtn());
        expect(toast.error).toHaveBeenCalledWith('Mohon lengkapi semua data');
    });

    // --- Validation: password rules ---

    it('shows error toast when password is shorter than 8 characters', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderRegister();
        await userEvent.type(getNameInput(), 'Budi Santoso');
        await userEvent.type(getPhoneInput(), '081234567890');
        await userEvent.type(getPasswordInput(), 'short');
        await userEvent.type(getConfirmPasswordInput(), 'short');
        fireEvent.click(getSubmitBtn());
        expect(toast.error).toHaveBeenCalledWith('Password minimal 8 karakter');
    });

    it('shows error toast when passwords do not match', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderRegister();
        await userEvent.type(getNameInput(), 'Budi Santoso');
        await userEvent.type(getPhoneInput(), '081234567890');
        await userEvent.type(getPasswordInput(), 'password123');
        await userEvent.type(getConfirmPasswordInput(), 'different456');
        fireEvent.click(getSubmitBtn());
        expect(toast.error).toHaveBeenCalledWith('Password tidak sama');
    });

    // --- Successful registration ---

    it('calls register() with correct phone, password, and name', async () => {
        const registerFn = vi.fn().mockResolvedValue(undefined);
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(registerFn).toHaveBeenCalledWith('081234567890', 'password123', 'Budi Santoso')
        );
    });

    it('navigates to /dashboard after successful registration', async () => {
        const registerFn = vi.fn().mockResolvedValue(undefined);
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
        );
    });

    it('navigates to the original deep-link route (from state) after registration', async () => {
        const registerFn = vi.fn().mockResolvedValue(undefined);
        renderRegister({
            registerFn,
            locationState: { from: { pathname: '/room/abc123' } },
        });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/room/abc123', { replace: true })
        );
    });

    it('falls back to /dashboard when from state is /profile', async () => {
        const registerFn = vi.fn().mockResolvedValue(undefined);
        renderRegister({
            registerFn,
            locationState: { from: { pathname: '/profile' } },
        });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
        );
    });

    it('shows success toast after successful registration', async () => {
        const toast = (await import('react-hot-toast')).default;
        const registerFn = vi.fn().mockResolvedValue(undefined);
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith('Registrasi berhasil!')
        );
    });

    // --- Failed registration ---

    it('shows "Nomor HP sudah terdaftar" toast for auth/email-already-in-use error', async () => {
        const toast = (await import('react-hot-toast')).default;
        const err = Object.assign(new Error('already in use'), { code: 'auth/email-already-in-use' });
        const registerFn = vi.fn().mockRejectedValue(err);
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith('Nomor HP sudah terdaftar')
        );
    });

    it('shows generic error toast for all other errors', async () => {
        const toast = (await import('react-hot-toast')).default;
        const registerFn = vi.fn().mockRejectedValue(new Error('network error'));
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith('Gagal mendaftar. Silakan coba lagi.')
        );
    });

    it('re-enables the submit button after a failed registration', async () => {
        const registerFn = vi.fn().mockRejectedValue(new Error('network error'));
        renderRegister({ registerFn });
        await fillValidForm();
        fireEvent.click(getSubmitBtn());

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Daftar Sekarang/i })).not.toBeDisabled()
        );
    });
});
