# Health Tracker — UI Wireframes & Design System

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#16A34A` | Primary buttons, active states, success |
| `--color-primary-light` | `#DCFCE7` | Light green backgrounds, badges |
| `--color-primary-dark` | `#15803D` | Hover states, emphasis |
| `--color-secondary` | `#0EA5E9` | Links, info badges, chatbot accent |
| `--color-secondary-light` | `#E0F2FE` | Info callouts |
| `--color-accent` | `#F59E0B` | Warnings, workout intensity |
| `--color-bg` | `#F8FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Card backgrounds |
| `--color-text` | `#1E293B` | Primary text |
| `--color-text-muted` | `#64748B` | Secondary text, placeholders |
| `--color-border` | `#E2E8F0` | Borders, dividers |
| `--color-error` | `#EF4444` | Error states, delete buttons |

### Typography (Tailwind classes)

```
Headings: font-bold
  H1: text-3xl (Dashboard title)
  H2: text-2xl (Section headers)
  H3: text-xl  (Card titles)

Body: font-normal text-base text-slate-800
Small: text-sm text-slate-500
```

### Spacing & Layout

- Page padding: `px-4 sm:px-6 lg:px-8`
- Card padding: `p-6`
- Card gap: `gap-6` (grid)
- Section spacing: `mb-8`

### Reusable Components

**Card**: `bg-white rounded-2xl shadow-sm border border-slate-200 p-6`
**Button Primary**: `bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition`
**Button Secondary**: `bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-5 rounded-xl transition`
**Input**: `w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none`
**Badge**: `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium`
**Chat Bubble (User)**: `bg-green-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%] self-end`
**Chat Bubble (AI)**: `bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%] self-start`

---

## Page Wireframes

### 1. Login / Register Page

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                    [App Logo]                        │
│               Daily Health Tracker                   │
│                                                      │
│     ┌──────────────────────────────────────┐         │
│     │                                      │         │
│     │  [Tab: Login]  [Tab: Register]       │         │
│     │                                      │         │
│     │  Email:    [___________________]      │         │
│     │  Password: [___________________]      │         │
│     │                                      │         │
│     │  [────────── Sign In ──────────]      │         │
│     │                                      │         │
│     │  ───────── or ─────────              │         │
│     │  [Continue with Google]              │         │
│     │                                      │         │
│     └──────────────────────────────────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**States**: Loading spinner on submit, inline validation errors, success redirect to dashboard.

---

### 2. Dashboard Page (Main View)

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]  Dashboard  |  Daily Log  |  Chatbot  |  Metrics  |  [👤]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────┐ │
│  │ 🔥 Calories  │  │ 💧 Water     │  │ 🏃 Workout   │  │ 😴   │ │
│  │ 1,850        │  │ 6 / 8 glasses│  │ 45 min       │  │ 7.5h │ │
│  │ / 2,200 goal │  │              │  │ 320 cal      │  │ ★★★★ │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  🤖 Daily AI Suggestion                      [🔄 Refresh]    ││
│  │  ─────────────────────────────────────────────────────────── ││
│  │  "Based on yesterday's low protein intake (45g), try adding  ││
│  │   eggs or Greek yogurt to your breakfast today. Your workout  ││
│  │   recovery will benefit from the extra 20g of protein."      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐ │
│  │  ⚡ Quick Log           │  │  📊 Weight Trend              │ │
│  │                         │  │                                │ │
│  │  [+ Add Meal]           │  │   ┊    ╭─╮                    │ │
│  │  [+ Add Workout]        │  │   ┊   ╱   ╲    ╱             │ │
│  │  [+ Add Water]          │  │   ┊  ╱     ╲──╱              │ │
│  │  [+ Log Sleep]          │  │   ┊ ╱                        │ │
│  │  [+ Rate Mood]          │  │   ┊────────────────────      │ │
│  │                         │  │   Last 7 days: ↓ 0.5 kg      │ │
│  └─────────────────────────┘  └────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Summary cards click through to detailed log
- Quick Log buttons open inline mini-forms or modal
- AI Suggestion has regenerate button
- Weight chart is a miniature sparkline

---

### 3. Daily Log Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]  Dashboard  |  [Daily Log] |  Chatbot  |  Metrics  |  [👤] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📅 Wednesday, May 3, 2026          [← Prev] [Today] [Next →]    │
│                                                                  │
│  ┌─── Meals ───────────────────────────────────────────────────┐│
│  │  Breakfast                                          [+ Add]  ││
│  │  ┌─ Oatmeal with berries ───────────────────────────────┐   ││
│  │  │ 350 cal | P:12g | C:58g | F:8g          [✏️] [🗑️]   │   ││
│  │  └───────────────────────────────────────────────────────┘   ││
│  │  Lunch                                              [+ Add]  ││
│  │  ┌─ Grilled chicken salad ───────────────────────────────┐   ││
│  │  │ 420 cal | P:38g | C:12g | F:24g          [✏️] [🗑️]   │   ││
│  │  └───────────────────────────────────────────────────────┘   ││
│  │  Dinner                                             [+ Add]  ││
│  │  (empty)                                                     ││
│  │  Snacks                                             [+ Add]  ││
│  │  (empty)                                                     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─── Workout ─────────────────────────────────────────────────┐│
│  │  ┌─ Morning Run ──────────────────────────────────────────┐  ││
│  │  │ Running | 30 min | Medium | 320 cal       [✏️] [🗑️]   │  ││
│  │  └─────────────────────────────────────────────────────────┘  ││
│  │  [+ Add Workout]                                             ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─── Water ──────────────────────────┐  ┌─── Sleep ───────────┐│
│  │  💧 💧 💧 💧 💧 💧 ◌ ◌            │  │  Hours: [7.5]        ││
│  │  6 of 8 glasses                    │  │  Quality: ★★★★☆     ││
│  │  [+ Add Glass]                     │  │                      ││
│  └────────────────────────────────────┘  └──────────────────────┘│
│                                                                  │
│  ┌─── Mood & Weight ───────────────────────────────────────────┐│
│  │  Mood: 😊 😄 😐 😕 😢     Weight: [74.5] kg                 ││
│  │              ↑ selected                                      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4. Chatbot Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]  Dashboard  |  Daily Log  |  [Chatbot] |  Metrics  |  [👤] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Chat History ───┐  ┌─── Chat ─────────────────────────────┐│
│  │                    │  │                                      ││
│  │ [+ New Chat]       │  │  🤖 How can I help with your        ││
│  │                    │  │     health goals today?              ││
│  │ ● Meal plan ideas  │  │                                      ││
│  │ ● Workout routine  │  │  👤 I need a high-protein breakfast  ││
│  │ ● Weight loss tips │  │     idea under 400 calories          ││
│  │                    │  │                                      ││
│  │                    │  │  🤖 Here are 3 options:              ││
│  │                    │  │     1. Greek yogurt bowl...          ││
│  │                    │  │     2. 3-egg white omelette...       ││
│  │                    │  │     3. Protein smoothie...           ││
│  │                    │  │                                      ││
│  └────────────────────┘  │  ┌────────────────────────────┐     ││
│                          │  │ [Type your message...]  [→]│     ││
│                          │  └────────────────────────────┘     ││
│                          │                                      ││
│                          │  Suggested: [Meal plan] [Workout]    ││
│                          │             [Nutrition] [Sleep]      ││
│                          └──────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Chat features**:
- Streaming responses (typewriter effect)
- Markdown rendering in AI responses
- Suggested question chips below input
- Chat history persists across sessions
- "New Chat" creates fresh session

---

### 5. Profile / Settings Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]  Dashboard  |  Daily Log  |  Chatbot  |  Metrics  |  [👤] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Personal Info ───────────────────────────────────────────┐│
│  │  First Name: [Lokesh____]  Last Name: [Kashyap____]         ││
│  │  Email: [lokesh@email.com]                                  ││
│  │  Age: [25]  Height: [178] cm  Weight: [74.5] kg            ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─── Dietary Preferences ────────────────────────────────────┐  ││
│  │  Diet: ○ Vegetarian  ● Non-Vegetarian  ○ Vegan  ○ Keto    │  ││
│  │  Allergies: [▣ Peanuts] [▣ Dairy] [☐ Shellfish] [☐ None]  │  ││
│  │  Cuisine Preference: [Indian ▼]                            │  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─── Fitness Goals ──────────────────────────────────────────┐  ││
│  │  Goal: ● Weight Loss  ○ Muscle Gain  ○ Maintenance         │  ││
│  │  Target Weight: [70] kg by [2026-08-03]                    │  ││
│  │  Activity Level: [Moderately Active ▼]                     │  ││
│  │  Workout Days/Week: [5]                                    │  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [─────────────── Save Changes ───────────────]                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 6. Health Metrics Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]  Dashboard  |  Daily Log  |  Chatbot  |  [Metrics] |  [👤] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Time Range: [1W] [1M] [3M] [6M] [1Y] [All]                     │
│                                                                  │
│  ┌─── Weight Trend ────────────────────────────────────────────┐│
│  │                                                             ││
│  │  76 ┤          ╭──╮                                         ││
│  │  75 ┤    ╭─────╯  ╰──╮    ╭──╮                              ││
│  │  74 ┤   ╱             ╲──╯  ╰────                           ││
│  │  73 ┤──╱                                                    ││
│  │      └──┬────┬────┬────┬────┬────┬────┬────                 ││
│  │        Apr 6  13   20   27  May 3                            ││
│  │  Start: 76.2 kg → Current: 74.5 kg → Goal: 70 kg            ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─── Calorie Balance ───────────────────────┐  ┌─── Sleep ────┐│
│  │  ████████████░░░░░░ Input: 2,100          │  │  8 ┤  ▄  █   ││
│  │  ██████████░░░░░░ Burn: 1,800             │  │  7 ┤  █  █   ││
│  │  Net: +300 cal/day avg                     │  │  6 ┤  █  █   ││
│  └────────────────────────────────────────────┘  │    M  T  W  ││
│                                                  └──────────────┘│
│  ┌─── Workout Frequency (This Month) ───────────────────────────┐│
│  │  Mon  ██                                                    ││
│  │  Tue  ████                                                  ││
│  │  Wed  ██                                                    ││
│  │  Thu  ██████                                                ││
│  │  Fri  ████                                                  ││
│  │  Sat  ██                                                    ││
│  │  Sun  █                                                     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## User Flows

### New User Onboarding
```
Register → Verify Email → Complete Profile Form → Dashboard (empty state)
→ "Get Started" prompt → Log first meal → See first AI suggestion
→ Try chatbot with suggested question
```

### Daily Usage Loop
```
Open App → Dashboard loads → See today's AI suggestion
→ Quick-log breakfast → Update water glasses throughout day
→ Log workout → Check metrics trend → Chat with bot for dinner ideas
→ Log dinner → Rate mood → Dashboard updates summary cards
```

### Weekly Review
```
Navigate to Metrics → Select "1M" range
→ Review weight trend → Check calorie balance
→ See workout consistency → Adjust goals if needed
→ Chatbot gives week summary and next-week tips
```

---

## Responsive Behavior

- **Desktop (lg+)**: Sidebar navigation, 3-column dashboard grid, chat with history sidebar
- **Tablet (md)**: Top navbar, 2-column grid, chat full-width with collapsible history
- **Mobile (sm)**: Bottom tab nav, single column, full-screen chat, cards stack vertically

---

## Empty States

- **No logs yet**: "Welcome! Start by logging your first meal" with CTA button
- **No chatbot history**: Show suggested questions as tappable chips
- **No metrics data**: "Log for 3 more days to see your first trend"
- **No suggestions**: "Complete your profile to get personalized tips"
