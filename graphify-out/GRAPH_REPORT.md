# Graph Report - C:/claude/health-tracker  (2026-05-07)

## Corpus Check
- 2 files · ~1,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1741 nodes · 5004 edges · 112 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 189 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 147|Community 147]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]
- [[_COMMUNITY_Community 151|Community 151]]
- [[_COMMUNITY_Community 152|Community 152]]

## God Nodes (most connected - your core abstractions)
1. `defineProperty()` - 81 edges
2. `getOwnPropertyDescriptor()` - 80 edges
3. `i()` - 78 edges
4. `forEach()` - 71 edges
5. `get()` - 59 edges
6. `ic()` - 54 edges
7. `set()` - 53 edges
8. `t()` - 50 edges
9. `n()` - 49 edges
10. `E()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `hash_password()` --calls--> `second_user()`  [INFERRED]
  backend/app/core/security.py → conftest.py
- `create_access_token()` --calls--> `auth_headers()`  [INFERRED]
  backend/app/core/security.py → conftest.py
- `create_access_token()` --calls--> `other_auth_headers()`  [INFERRED]
  backend/app/core/security.py → conftest.py
- `DailyLog` --calls--> `daily_log()`  [INFERRED]
  backend/app/models/daily_log.py → conftest.py
- `User` --calls--> `second_user()`  [INFERRED]
  backend/app/models/user.py → conftest.py

## Hyperedges (group relationships)
- **** — backend_fastapi, rabbitmq_service, suggestion_worker, deepseek_api [EXTRACTED 1.00]
- **** — frontend_nginx_spa, backend_fastapi, postgresql_service, redis_service [EXTRACTED 1.00]
- **** — playwright_auth_spec, playwright_chatbot_spec, err_connection_refused, test_failure_summary [EXTRACTED 1.00]
- **Dashboard navigation tests fail with ERR_CONNECTION_REFUSED (server not running)** —  [INFERRED 0.90]

## Communities (153 total, 35 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (126): aa(), ac(), ai(), ao(), as(), ba(), bc(), Bo() (+118 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (41): accessor(), Ax(), Az(), bz(), clearInterval(), cm(), dispatch(), divide() (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (87): Ad(), Al(), ar(), bi(), bl(), bn(), br(), cf() (+79 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (23): a, c(), d(), deleteCacheAndMetadata(), e(), f(), h(), i (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (46): Au(), bu(), cd(), ce(), Cu(), dd(), de(), Du() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (39): AN(), ap(), Cl(), Cn(), cx(), db(), defineProperty(), eb() (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (23): Tests for workout endpoints.  Covers:     - POST   /api/workouts       (create w, PUT /api/workouts/{id} with partial data updates supplied fields., PUT /api/workouts/{id} with partial data updates supplied fields., PUT for a non-existent workout returns 404., PUT for a non-existent workout returns 404., DELETE /api/workouts/{id} removes the user's own workout (204)., DELETE /api/workouts/{id} removes the user's own workout (204)., A user cannot delete another user's workout (403). (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (34): A(), ae(), ag(), b(), C(), clearTimeout(), D(), E() (+26 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (23): Tests for meal endpoints.  Covers:     - POST   /api/meals       (create meal wi, PUT /api/meals/{id} with partial data updates only supplied fields., PUT /api/meals/{id} with partial data updates only supplied fields., PUT for a non-existent meal returns 404., PUT for a non-existent meal returns 404., DELETE /api/meals/{id} removes the user's own meal (204)., DELETE /api/meals/{id} removes the user's own meal (204)., A user cannot delete another user's meal (403). (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (33): Be(), bk(), bt(), displayable(), et(), Fe(), from(), ge() (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (22): Tests for daily-log endpoints.  Covers:     - POST /api/daily-logs  (create new, A date with no log returns 404., A date with no log returns 404., PUT /api/daily-logs/water updates the water-glasses field., PUT /api/daily-logs/water updates the water-glasses field., PUT /api/daily-logs/sleep updates the sleep-hours field., PUT /api/daily-logs/sleep updates the sleep-hours field., PUT /api/daily-logs/mood updates the mood-rating field. (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (32): ah(), am(), createDraft(), Dh(), Dm(), Eh(), Em(), fm() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (32): applyPatches(), AV(), ay(), Bv(), concat(), cy(), dv(), dy() (+24 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (31): add(), aw(), bh(), bM(), by(), ch(), delete(), deleteProperty() (+23 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (31): af(), Bd(), Bf(), ct(), Ef(), f(), ff(), gf() (+23 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (31): #_(), addObserver(), cancel(), clearGcTimeout(), createResult(), destroy(), fetch(), getMutationCache() (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (30): Ab(), bb(), bP(), cB(), cv(), fb(), gb(), hb() (+22 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (15): Tests for authentication and user endpoints.  Covers:     - POST /api/auth/regis, Incorrect password returns 401., Login with an unknown email returns 401., Providing a valid refresh token returns a new token pair., A garbage refresh token is rejected with 401., An authenticated request returns the user's profile., A request without a token returns 401., Register a valid new user returns 201 with user details. (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (26): Alembic Database Migrations, Async Suggestion Generation Pipeline, Backend FastAPI Service, Backend Python Dependencies, Backend Served Production HTML, DeepSeek AI API, Docker Compose Orchestration, ERR_CONNECTION_REFUSED on Port 1252 (+18 more)

### Community 19 - "Community 19"
Cohesion: 0.1
Nodes (8): get_redis_client(), get_redis(), RedisClient, main(), process_suggestion(), RabbitMQ consumer worker for async suggestion generation.  Listens on the `sugge, Process a single suggestion generation request., Connect to RabbitMQ and start consuming suggestion requests.

### Community 20 - "Community 20"
Cohesion: 0.1
Nodes (13): get_bmi_history(), get_dashboard(), get_metrics_service(), get_metrics_summary(), get_weight_history(), Get weight history for the specified number of days., Get BMI history for the specified number of days., Record a new weight entry. (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (15): Tests for chatbot endpoints.  Covers:     - POST /api/chat/send        (success, POST /api/chat/send returns 200 with an assistant response.          The DeepSee, POST /api/chat/send returns 200 with an assistant response.          The DeepSee, Empty content is rejected (422)., Empty content is rejected (422)., POST /api/chat/send without auth returns 401., POST /api/chat/send without auth returns 401., Omitting ``session_id`` auto-creates a new session. (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (19): _log_to_response(), BaseModel, ChangePasswordRequest, Config, LoginRequest, RefreshRequest, RegisterRequest, TokenResponse (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (7): Base, ChatMessage, ChatSession, Meal, Workout, ChatbotService, Stream a chat response from DeepSeek API using SSE.

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (19): _coerce_enum(), get_current_user_profile(), _get_enum_value(), get_user_preferences(), get_user_profile(), Get the current user's detailed profile., Get the current user's dietary preferences and goals., Update the current user's dietary preferences and goals. (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (21): bw(), cw(), Ft(), gw(), hw(), kw(), Lt(), mw() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (4): ForbiddenException, NotFoundException, MealType, LogService

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (13): useCreateDailyLog(), useDailyLog(), useAddMeal(), useDeleteMeal(), useMeals(), useAddWorkout(), useDeleteWorkout(), useWorkouts() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): create_access_token(), create_refresh_token(), decode_refresh_token(), hash_password(), verify_password(), RefreshToken, User, AuthService (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (16): delete_conversation(), get_chatbot_service(), get_conversation_history(), list_sessions(), List all chat sessions for the current user., Delete a conversation session and all its messages., Send a message to the AI chatbot and get a response., Send a message to the AI chatbot and stream the response via SSE. (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (8): AppException, ConflictException, ExternalAPIException, RateLimitException, Base application exception., UnauthorizedException, ValidationException, Exception

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (15): create_daily_log(), get_log_by_date(), get_log_service(), get_logs_in_range(), get_today_log(), Update water intake for a specific date (defaults to today)., Update sleep hours and quality for a specific date (defaults to today)., Update mood rating for a specific date (defaults to today). (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (16): build(), defaultMutationOptions(), defaultQueryOptions(), ee(), ensureInfiniteQueryData(), ensureQueryData(), fetchOptimistic(), fetchQuery() (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (7): ai_estimate(), Use AI to estimate nutritional info for a meal or calories for a workout., AIEstimateRequest, AIEstimateResponse, AIEstimateService, Estimate macros for a food item., Estimate calories burned for an exercise.

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (9): get_db(), Base, check_db_connection(), get_session(), health_check(), lifespan(), Health check endpoint for monitoring., Application lifespan: startup and shutdown. (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (13): client(), override_deps(), Test configuration for the Health Tracker API.  Handles: - PostgreSQL type monke, Create all tables once, drop them when the session ends., Create all tables once, drop them when the session ends., Override FastAPI dependencies for the duration of one test.      The overrides m, Override FastAPI dependencies for the duration of one test.      The overrides m, Async HTTP client wired to the FastAPI app via ASGITransport.      Dependencies (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (3): FakeRedis, In-memory fake that implements every RedisClient method used by services., In-memory fake that implements every RedisClient method used by services.

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (8): DailyLog, Tests for metrics endpoints.  Covers:     - GET /api/metrics/summary  (empty dat, GET /api/metrics/summary with no data returns defaults., Aggregated metrics reflect several days of logged data., Logs outside the requested date range are excluded., GET /api/metrics/weight with no weight data.          This call will raise ``Att, TestMetricsSummary, TestWeightHistory

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (9): Tests for suggestion endpoints.  Covers:     - GET  /api/suggestions/today, GET /api/suggestions/today when no suggestion exists returns 404., GET /api/suggestions/today when no suggestion exists returns 404., When a suggestion exists for today, it is returned., When a suggestion exists for today, it is returned., POST /api/suggestions/refresh calls DeepSeek and returns new data., POST /api/suggestions/refresh calls DeepSeek and returns new data., TestGetTodaySuggestion (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (8): WeightSparkline(), useCalorieHistory(), useMetrics(), useWeightHistory(), CalorieChart(), SleepChart(), WeightChart(), WorkoutHeatmap()

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (11): dismiss_suggestion(), get_recent_suggestions(), get_suggestion_service(), get_today_suggestion(), Dismiss a suggestion., Get today's AI-generated suggestion. Auto-generates if none exists yet., Get recent AI-generated suggestions., Request immediate refresh of today's suggestion. (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (12): change_password(), get_auth_service(), login(), logout(), Register a new user account., Authenticate and receive JWT tokens., Refresh an expired access token using a refresh token., Logout and invalidate the refresh token. (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (11): create_workout(), delete_workout(), get_log_service(), get_workouts(), Update a workout entry., Delete a workout entry., Get workouts for a date range., update_workout() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (9): ChatRole, GoalType, HealthGoal, DailySuggestion, SuggestionCategory, ActivityLevel, DietaryPreference, FitnessGoal (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.26
Nodes (13): Cz(), dz(), fz(), hz(), Iz(), lz(), mz(), Nz() (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (13): at(), clamp(), Dt(), formatHsl(), getDefaultOptions(), getOptimisticResult(), getQueryCache(), it() (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (13): Authentication E2E Test Spec, Auth Test Error Context, Auth Login Page Render Retry Failure Screenshot, Auth Login Page Render Test Failure Screenshot, Auth Login Redirect Retry Failure Screenshot, Auth Login Redirect Test Failure Screenshot, Auth Register Page Render Retry Failure Screenshot, Auth Register Page Render Test Failure Screenshot (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (11): create_health_goal(), delete_health_goal(), get_health_goal(), get_health_goals(), Update a health goal., Delete a health goal., Create a new health goal., Get all health goals for the current user. (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (8): create_meal(), get_log_service(), get_meals(), Get meals for a date range., update_meal(), MealCreate, MealResponse, MealUpdate

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (11): canRun(), continue(), execute(), find(), isFocused(), onFocus(), onOnline(), refetch() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.2
Nodes (11): cp(), jp(), kl(), mp(), ov(), ql(), sp(), wP() (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (7): _JSON, SQLite-compatible UUID type that stores UUIDs as 36-char strings., SQLite-compatible UUID type that stores UUIDs as 36-char strings., SQLite-compatible JSON type that serialises to/from text., SQLite-compatible JSON type that serialises to/from text., _UUID, TypeDecorator

### Community 54 - "Community 54"
Cohesion: 0.31
Nodes (10): ck(), gk(), hk(), jk(), mk(), pk(), tk(), vk() (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (6): useLogin(), useLogout(), useRegister(), LoginPage(), ProfilePage(), RegisterPage()

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (9): arc(), bezierCurveTo(), closePath(), draw(), lineEnd(), lineTo(), moveTo(), point() (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): Run migrations in 'offline' mode., Run migrations in 'online' mode with async engine., Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online()

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (3): BaseHTTPMiddleware, RequestLoggingMiddleware, RateLimitMiddleware

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (7): Hy(), mv(), pv(), vy(), Xg(), Xy(), Zy()

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (7): findAll(), getAll(), getQueriesData(), isFetching(), isMutating(), isOnline(), resumePausedMutations()

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (7): bindMethods(), constructor(), LM(), setAutoFreeze(), setPrototypeOf(), setUseStrictIteration(), setUseStrictShallowCopy()

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (6): getObserversCount(), isActive(), isDisabled(), isFetched(), isStale(), isStatic()

### Community 63 - "Community 63"
Cohesion: 0.6
Nodes (5): dashboard.spec.js Â» Dashboard Â» navigating to daily log page works, dashboard.spec.js Â» Dashboard Â» navigating to daily log page works (retry1), dashboard.spec.js Â» Dashboard Â» navigating to metrics page works, dashboard.spec.js Â» Dashboard Â» navigating to metrics page works (retry1), ERR_CONNECTION_REFUSED at /login

### Community 64 - "Community 64"
Cohesion: 0.4
Nodes (3): downgrade(), Initial database schema with all tables  Revision ID: 001 Revises: Create Date:, Drop all tables and ENUM types.

### Community 65 - "Community 65"
Cohesion: 0.5
Nodes (4): get_current_active_user(), get_current_user(), get_optional_user(), decode_access_token()

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (5): mG(), notify(), optionalRemove(), remove(), write()

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (5): addAngleAxis(), addRadiusAxis(), reducer(), setChartData(), Ty()

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (4): Ak(), copy(), kk(), Ok()

### Community 76 - "Community 76"
Cohesion: 0.67
Nodes (3): ex(), nx(), tx()

### Community 77 - "Community 77"
Cohesion: 0.67
Nodes (3): Hn(), nn(), Pn()

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): mount(), subscribe(), toAbortSignal()

### Community 79 - "Community 79"
Cohesion: 0.67
Nodes (3): db_session(), Provide a clean session per test (rolled back after the test)., Provide a clean session per test (rolled back after the test).

### Community 80 - "Community 80"
Cohesion: 0.67
Nodes (3): mock_deepseek_client(), Return an ``AsyncMock`` that stands in for ``httpx.AsyncClient``.      The retur, Return an ``AsyncMock`` that stands in for ``httpx.AsyncClient``.      The retur

### Community 81 - "Community 81"
Cohesion: 0.67
Nodes (3): meal(), A sample meal linked to the fixture daily_log., A sample meal linked to the fixture daily_log.

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (3): auth_headers(), JWT auth headers (Bearer token) for the primary test user., JWT auth headers (Bearer token) for the primary test user.

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (3): other_auth_headers(), JWT auth headers for the secondary user., JWT auth headers for the secondary user.

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (3): A sample workout linked to the fixture daily_log., A sample workout linked to the fixture daily_log., workout()

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (3): daily_log(), A daily log for the primary test user on today's date., A daily log for the primary test user on today's date.

## Knowledge Gaps
- **220 isolated node(s):** `Run migrations in 'offline' mode.`, `Run migrations in 'online' mode with async engine.`, `Run migrations in 'online' mode.`, `Initial database schema with all tables  Revision ID: 001 Revises: Create Date:`, `Drop all tables and ENUM types.` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NotFoundException` connect `Community 26` to `Community 47`, `Community 48`, `Community 23`, `Community 24`, `Community 28`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `Community 22` to `Community 33`, `Community 40`, `Community 41`, `Community 42`, `Community 47`, `Community 49`, `Community 24`, `Community 29`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `$()` connect `Community 0` to `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `Run migrations in 'offline' mode.`, `Run migrations in 'online' mode with async engine.`, `Run migrations in 'online' mode.` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._