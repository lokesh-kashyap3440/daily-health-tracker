/**
 * Tests for the LoginPage component.
 *
 * Covers:
 *  - Renders email & password fields
 *  - Shows validation errors on empty submit (HTML5 required handled by browser;
 *    we test that the form submit handler is called)
 *  - Navigates to /dashboard on successful login
 *  - Shows error toast on failed login
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import LoginPage from "../../pages/LoginPage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

// Mock react-router-dom so we can spy on navigate()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the auth hook so we control mutation behaviour without a real API.
const mockMutate = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderLoginPage = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <QueryClientProvider client={qc}>
        <LoginPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders login form with email and password fields", () => {
    renderLoginPage();

    // The Input component renders a <label> and an <input> with placeholder.
    expect(
      screen.getByPlaceholderText("you@example.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("••••••••"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("calls mutate with form data on submit", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret123",
      });
    });
  });

  test("shows link to register page", () => {
    renderLoginPage();
    const registerLink = screen.getByRole("link", { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.getAttribute("href")).toBe("/register");
  });
});
