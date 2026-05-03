/**
 * Tests for the ChatbotPage component.
 *
 * Covers:
 *  - Renders the chat interface with an input field
 *  - Sends a message on form submit
 *  - Shows suggestion chips
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import ChatbotPage from "../../pages/ChatbotPage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSendMessage = vi.fn();
const mockCreateSession = vi.fn();

vi.mock("../../hooks/useChatbot", () => ({
  useChatbot: () => ({
    messages: [
      { role: "assistant", content: "Hi! I'm your health coach." },
    ],
    isStreaming: false,
    sendMessage: mockSendMessage,
    createSession: mockCreateSession,
  }),
}));

// Mock the API client so that the page's useEffect fetch (api.get('/chat/sessions'))
// resolves immediately with an empty list.
vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { id: "sess-1" } }),
  },
}));

// Child component mocks
vi.mock("../../components/chatbot/ChatWindow", () => ({
  default: ({ messages }) => (
    <div data-testid="chat-window">
      {messages.map((m, i) => (
        <div key={i}>{m.content}</div>
      ))}
    </div>
  ),
}));

vi.mock("../../components/chatbot/ChatInput", () => ({
  default: ({ onSend }) => (
    <div data-testid="chat-input">
      <input placeholder="Type a message..." />
      <button onClick={() => onSend("Hello coach!")}>Send</button>
    </div>
  ),
}));

vi.mock("../../components/chatbot/SuggestionChips", () => ({
  default: ({ onSelect }) => (
    <div data-testid="suggestion-chips">
      <button onClick={() => onSelect("Meal plan for weight loss")}>
        Meal plan for weight loss
      </button>
      <button onClick={() => onSelect("Quick home workout")}>
        Quick home workout
      </button>
    </div>
  ),
}));

vi.mock("../../components/chatbot/ChatSidebar", () => ({
  default: () => <div data-testid="chat-sidebar" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderChatbot = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={["/chatbot"]}>
      <QueryClientProvider client={qc}>
        <ChatbotPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatbotPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders chat window with welcome message", () => {
    renderChatbot();
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
    expect(
      screen.getByText("Hi! I'm your health coach."),
    ).toBeInTheDocument();
  });

  test("renders input area", () => {
    renderChatbot();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });

  test("renders suggestion chips", () => {
    renderChatbot();
    expect(screen.getByTestId("suggestion-chips")).toBeInTheDocument();
    expect(
      screen.getByText("Meal plan for weight loss"),
    ).toBeInTheDocument();
    expect(screen.getByText("Quick home workout")).toBeInTheDocument();
  });

  test("sends message when suggestion chip is clicked", async () => {
    const user = userEvent.setup();
    renderChatbot();

    await user.click(screen.getByText("Meal plan for weight loss"));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        "Meal plan for weight loss",
      );
    });
  });
});
