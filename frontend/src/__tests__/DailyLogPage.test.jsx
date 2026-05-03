/**
 * Tests for the DailyLogPage component.
 *
 * Covers:
 *  - Renders date navigation controls
 *  - Renders sections for meals, workouts, water, sleep, mood
 *  - Opens meal modal when the "Add" button is clicked
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import DailyLogPage from "../../pages/DailyLogPage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Spinner
vi.mock("../../components/ui/Spinner", () => ({
  default: () => <div data-testid="spinner">Loading...</div>,
}));

// Modal – mock so it just renders children (no transition/animation)
vi.mock("../../components/ui/Modal", () => ({
  default: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="modal">
        <h3>{title}</h3>
        {children}
      </div>
    ) : null,
}));

// Child components
vi.mock("../../components/log/MealForm", () => ({
  default: ({ onClose }) => (
    <div data-testid="meal-form">
      <button onClick={onClose}>Close Meal Form</button>
    </div>
  ),
}));

vi.mock("../../components/log/WorkoutForm", () => ({
  default: () => <div data-testid="workout-form" />,
}));

vi.mock("../../components/log/MealList", () => ({
  default: ({ meals, onDelete }) => (
    <div data-testid="meal-list">
      {meals?.length
        ? meals.map((m) => (
            <div key={m.id}>
              {m.name}
              <button onClick={() => onDelete(m.id)}>delete</button>
            </div>
          ))
        : "No meals"}
    </div>
  ),
}));

vi.mock("../../components/log/WorkoutList", () => ({
  default: ({ workouts }) => (
    <div data-testid="workout-list">
      {workouts?.length ? workouts.map((w) => <div key={w.id}>{w.exercise_type}</div>) : "No workouts"}
    </div>
  ),
}));

vi.mock("../../components/log/WaterTracker", () => ({
  default: ({ glasses }) => <div data-testid="water-tracker">Water: {glasses}</div>,
}));

vi.mock("../../components/log/SleepTracker", () => ({
  default: ({ sleepHours }) => <div data-testid="sleep-tracker">Sleep: {sleepHours}</div>,
}));

vi.mock("../../components/log/MoodSelector", () => ({
  default: ({ mood }) => <div data-testid="mood-selector">Mood: {mood}</div>,
}));

// Hooks
const mockLogData = {
  water_glasses: 5,
  sleep_hours: 7.0,
  mood_rating: 4,
};

let mockIsLoading = false;

vi.mock("../../hooks/useDailyLog", () => ({
  useDailyLog: () => ({
    data: mockLogData,
    isLoading: mockIsLoading,
  }),
}));

vi.mock("../../hooks/useMeals", () => ({
  useMeals: () => ({
    data: [
      { id: "1", meal_type: "breakfast", name: "Oatmeal", calories: 350 },
    ],
  }),
  useDeleteMeal: () => ({ mutate: vi.fn() }),
}));

vi.mock("../../hooks/useWorkouts", () => ({
  useWorkouts: () => ({
    data: [
      { id: "1", exercise_type: "Running", duration_min: 30 },
    ],
  }),
  useDeleteWorkout: () => ({ mutate: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderDailyLog = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={["/daily-log"]}>
      <QueryClientProvider client={qc}>
        <DailyLogPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DailyLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
  });

  test("shows loading spinner while fetching", () => {
    mockIsLoading = true;
    renderDailyLog();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("renders date navigation controls", () => {
    renderDailyLog();
    // ChevronLeft / ChevronRight buttons are icon buttons with no accessible
    // text, but the "Today" quick-jump button is a text button.
    expect(screen.getByText(/today/i)).toBeInTheDocument();
  });

  test("renders meals section", () => {
    renderDailyLog();
    expect(screen.getByText(/meals/i)).toBeInTheDocument();
    expect(screen.getByTestId("meal-list")).toBeInTheDocument();
  });

  test("renders workouts section", () => {
    renderDailyLog();
    expect(screen.getByText(/workouts/i)).toBeInTheDocument();
    expect(screen.getByTestId("workout-list")).toBeInTheDocument();
  });

  test("renders water tracker", () => {
    renderDailyLog();
    expect(screen.getByTestId("water-tracker")).toHaveTextContent("Water: 5");
  });

  test("renders sleep tracker", () => {
    renderDailyLog();
    expect(screen.getByTestId("sleep-tracker")).toHaveTextContent("Sleep: 7");
  });

  test("renders mood selector", () => {
    renderDailyLog();
    expect(screen.getByTestId("mood-selector")).toHaveTextContent("Mood: 4");
  });

  test("opens meal modal on add button click", async () => {
    const user = userEvent.setup();
    renderDailyLog();

    // The "Add" button is inside the meals card
    const addButton = screen.getByRole("button", { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByTestId("meal-form")).toBeInTheDocument();
    });
  });
});
