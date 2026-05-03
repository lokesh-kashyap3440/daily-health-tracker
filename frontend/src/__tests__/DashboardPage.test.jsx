/**
 * Tests for the DashboardPage component.
 *
 * Covers:
 *  - Renders summary cards (water, calories, workout, sleep)
 *  - Renders daily suggestion section
 *  - Renders quick-log action buttons
 *  - Shows loading spinner while data is being fetched
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import DashboardPage from "../../pages/DashboardPage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Spinner renders an animated div – give it a test-id so we can target it.
vi.mock("../../components/ui/Spinner", () => ({
  default: () => <div data-testid="spinner">Loading...</div>,
}));

// We want to control what the suggestion / summary hooks return.
// The page uses:
//   - useDailyLog(date)  -> { data: log, isLoading }
// We'll mock the hook directly.
let mockLogData = null;
let mockIsLoading = false;

vi.mock("../../hooks/useDailyLog", () => ({
  useDailyLog: () => ({
    data: mockLogData,
    isLoading: mockIsLoading,
  }),
}));

// Mock the child components that make further API calls so they render
// predictable markup.
vi.mock("../../components/dashboard/DailySuggestion", () => ({
  default: () => <div data-testid="daily-suggestion">Suggestion</div>,
}));

vi.mock("../../components/dashboard/WeightSparkline", () => ({
  default: () => <div data-testid="weight-sparkline" />,
}));

// QuickLog renders navigation buttons.
vi.mock("../../components/dashboard/QuickLog", () => ({
  default: () => <div data-testid="quick-log">Quick Log</div>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDashboard = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <QueryClientProvider client={qc}>
        <DashboardPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogData = null;
    mockIsLoading = false;
  });

  test("shows loading spinner while fetching", () => {
    mockIsLoading = true;
    renderDashboard();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("renders summary cards when data loads", () => {
    mockLogData = {
      water_glasses: 6,
      sleep_hours: 7.5,
      mood_rating: 4,
      total_calories: 1800,
      workout_minutes: 30,
    };
    renderDashboard();

    // SummaryCards renders static labels:
    expect(screen.getByText(/calories/i)).toBeInTheDocument();
    expect(screen.getByText(/water/i)).toBeInTheDocument();
    expect(screen.getByText(/workout/i)).toBeInTheDocument();
    expect(screen.getByText(/sleep/i)).toBeInTheDocument();

    // The heading text
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test("renders daily suggestion section", () => {
    renderDashboard();
    expect(screen.getByTestId("daily-suggestion")).toBeInTheDocument();
  });

  test("renders quick-log buttons", () => {
    renderDashboard();
    expect(screen.getByTestId("quick-log")).toBeInTheDocument();
  });

  test("renders weight sparkline", () => {
    renderDashboard();
    expect(screen.getByTestId("weight-sparkline")).toBeInTheDocument();
  });
});
