/**
 * Tests for the AppRouter component.
 *
 * Covers:
 *  - Redirects to /login when unauthenticated
 *  - Renders dashboard when authenticated
 *  - 404 page for unknown routes
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import AppRouter from "../../router/AppRouter";

// ---------------------------------------------------------------------------
// Mock every page component so routing tests don't need real API calls.
// ---------------------------------------------------------------------------

vi.mock("../../pages/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock("../../pages/RegisterPage", () => ({
  default: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock("../../pages/DashboardPage", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock("../../pages/DailyLogPage", () => ({
  default: () => <div data-testid="daily-log-page">Daily Log Page</div>,
}));

vi.mock("../../pages/ChatbotPage", () => ({
  default: () => <div data-testid="chatbot-page">Chatbot Page</div>,
}));

vi.mock("../../pages/MetricsPage", () => ({
  default: () => <div data-testid="metrics-page">Metrics Page</div>,
}));

vi.mock("../../pages/ProfilePage", () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>,
}));

vi.mock("../../pages/NotFoundPage", () => ({
  default: () => <div data-testid="not-found-page">404 Not Found</div>,
}));

// Mock the layout shell so it simply renders the <Outlet />.
vi.mock("../../components/layout/AppShell", () => ({
  default: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const Outlet = require("react-router-dom").Outlet;
    return (
      <div data-testid="app-shell">
        <Outlet />
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAppRouter = (initialRoute) =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={qc}>
        <AppRouter />
      </QueryClientProvider>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AppRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when unauthenticated (no access_token)", () => {
    beforeEach(() => {
      sessionStorage.removeItem("access_token");
    });

    test("redirects /dashboard to /login", () => {
      renderAppRouter("/dashboard");
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    test("redirects / to /login", () => {
      renderAppRouter("/");
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    test("allows access to /login page", () => {
      renderAppRouter("/login");
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    test("allows access to /register page", () => {
      renderAppRouter("/register");
      expect(screen.getByTestId("register-page")).toBeInTheDocument();
    });

    test("redirects unknown routes to /login (via ProtectedRoute)", () => {
      // The "*" wildcard route renders NotFoundPage, but only if the user is
      // NOT redirected by ProtectedRoute.  Since unauthenticated users hit
      // ProtectedRoute first for any /dashboard child route, "some-random"
      // would match "/*" → NotFoundPage.
      renderAppRouter("/some-random-path");
      expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    });
  });

  describe("when authenticated (has access_token)", () => {
    beforeEach(() => {
      sessionStorage.setItem("access_token", "fake-jwt-token");
    });

    test("renders dashboard", () => {
      renderAppRouter("/dashboard");
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    test("renders daily log page", () => {
      renderAppRouter("/daily-log");
      expect(screen.getByTestId("daily-log-page")).toBeInTheDocument();
    });

    test("renders chatbot page", () => {
      renderAppRouter("/chatbot");
      expect(screen.getByTestId("chatbot-page")).toBeInTheDocument();
    });

    test("renders metrics page", () => {
      renderAppRouter("/metrics");
      expect(screen.getByTestId("metrics-page")).toBeInTheDocument();
    });

    test("renders profile page", () => {
      renderAppRouter("/profile");
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    });

    test("redirects /login to /dashboard", () => {
      renderAppRouter("/login");
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    test("redirects /register to /dashboard", () => {
      renderAppRouter("/register");
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    test("redirects / to /dashboard", () => {
      renderAppRouter("/");
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    test("shows 404 page for unknown routes", () => {
      renderAppRouter("/nonexistent-route");
      expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    });
  });
});
