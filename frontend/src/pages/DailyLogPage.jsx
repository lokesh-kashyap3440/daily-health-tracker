import { useState } from 'react';
import { useDailyLog, useCreateDailyLog } from '../hooks/useDailyLog';
import { useMeals, useDeleteMeal } from '../hooks/useMeals';
import { useWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import MealForm from '../components/log/MealForm';
import MealList from '../components/log/MealList';
import WorkoutForm from '../components/log/WorkoutForm';
import WorkoutList from '../components/log/WorkoutList';
import WaterTracker from '../components/log/WaterTracker';
import SleepTracker from '../components/log/SleepTracker';
import MoodSelector from '../components/log/MoodSelector';
import { ChevronLeft, ChevronRight, Plus, Utensils, Dumbbell, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

export default function DailyLogPage() {
  const [date, setDate] = useState(new Date());
  const [showMeal, setShowMeal] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);

  const dateStr = fmtDate(date);
  const { data: log, isLoading: logLoading, isError: logError, refetch: refetchLog } = useDailyLog(dateStr);
  const { data: meals, isLoading: mealsLoading } = useMeals(dateStr);
  const { data: workouts, isLoading: workoutsLoading } = useWorkouts(dateStr);
  const deleteMeal = useDeleteMeal();
  const deleteWorkout = useDeleteWorkout();
  const createDailyLog = useCreateDailyLog();

  const dailyLogId = log?.id;

  const changeDay = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d);
  };

  const handleCreateLog = () => {
    createDailyLog.mutate(
      { log_date: dateStr, water_glasses: 0, sleep_hours: 0, mood_rating: 3 },
      { onSuccess: () => { toast.success('Daily log created'); refetchLog(); } }
    );
  };

  if (logLoading) return <Spinner size="lg" label="Loading your log..." />;

  const isToday = fmtDate(new Date()) === dateStr;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with date navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
            <ClipboardList size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-espresso-800 tracking-tight">
              Daily Log
            </h1>
            <p className="text-sm text-espresso-400 mt-1 dark:text-dark-400">Track meals, workouts, and wellness</p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-cream-200 shadow-sm self-start dark:bg-dark-800 dark:border-dark-700">
          <button onClick={() => changeDay(-1)} className="p-1.5 hover:bg-cream-100 rounded-xl transition-colors cursor-pointer text-espresso-400 hover:text-espresso-600 dark:hover:bg-dark-700 dark:text-dark-400 dark:hover:text-cream-200">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-espresso-700 min-w-[130px] text-center font-display dark:text-cream-100">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button onClick={() => changeDay(1)} className="p-1.5 hover:bg-cream-100 rounded-xl transition-colors cursor-pointer text-espresso-400 hover:text-espresso-600 dark:hover:bg-dark-700 dark:text-dark-400 dark:hover:text-cream-200">
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button onClick={() => setDate(new Date())} className="ml-1 text-xs font-semibold text-sage-600 hover:text-sage-700 px-2.5 py-1 rounded-lg hover:bg-sage-50 transition-colors cursor-pointer dark:text-sage-400 dark:hover:text-sage-300 dark:hover:bg-dark-700">
              Today
            </button>
          )}
        </div>
      </div>

      {/* Error / No log state */}
      {logError && !logLoading ? (
        <Card variant="warm" className="text-center py-8">
          <EmptyState
            icon={<ClipboardList size={32} />}
            title="No log for this date"
            description="Start tracking by creating a daily log."
            action={
              <button
                onClick={handleCreateLog}
                disabled={createDailyLog.isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-sage-600 to-sage-500 text-white rounded-xl text-sm font-medium hover:from-sage-700 hover:to-sage-600 disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                {createDailyLog.isPending ? 'Creating...' : 'Create Daily Log'}
              </button>
            }
          />
        </Card>
      ) : null}

      {dailyLogId ? (
        <div className="space-y-6">
          {/* Meals Section */}
          <Card variant="warm" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-sm">
                  <Utensils size={18} className="text-amber-600" />
                </div>
                <h3 className="font-display text-base font-semibold text-espresso-800">Meals</h3>
              </div>
              <button onClick={() => setShowMeal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-white bg-sage-600 hover:bg-sage-700 px-5 py-3 sm:py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] min-h-[44px]">
                <Plus size={18} /> Add Meal
              </button>
            </div>
            {mealsLoading ? (
              <Spinner size="sm" />
            ) : meals && meals.length > 0 ? (
              <MealList meals={meals} onDelete={(id) => deleteMeal.mutate(id)} />
            ) : (
              <EmptyState variant="compact" icon={<Utensils size={28} />} title="No meals logged" description="Tap Add Meal to log your first meal of the day." />
            )}
          </Card>

          {/* Workouts Section */}
          <Card variant="warm" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
                  <Dumbbell size={18} className="text-purple-600" />
                </div>
                <h3 className="font-display text-base font-semibold text-espresso-800">Workouts</h3>
              </div>
              <button onClick={() => setShowWorkout(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-white bg-sage-600 hover:bg-sage-700 px-5 py-3 sm:py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] min-h-[44px]">
                <Plus size={18} /> Add Workout
              </button>
            </div>
            {workoutsLoading ? (
              <Spinner size="sm" />
            ) : workouts && workouts.length > 0 ? (
              <WorkoutList workouts={workouts} onDelete={(id) => deleteWorkout.mutate(id)} />
            ) : (
              <EmptyState variant="compact" icon={<Dumbbell size={28} />} title="No workouts logged" description="Tap Add Workout to log your first workout." />
            )}
          </Card>

          {/* Water + Sleep Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card variant="warm" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-100/50 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 shadow-sm">
                  <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5c0-4.142 7.5-13.5 7.5-13.5s7.5 9.358 7.5 13.5z" /></svg>
                </div>
                <h3 className="font-display text-base font-semibold text-espresso-800">Water</h3>
              </div>
              <WaterTracker glasses={log?.water_glasses || 0} date={dateStr} />
            </Card>

            <Card variant="warm" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 shadow-sm">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </div>
                <h3 className="font-display text-base font-semibold text-espresso-800">Sleep</h3>
              </div>
              <SleepTracker sleepHours={log?.sleep_hours || 0} sleepQuality={log?.sleep_quality || 0} date={dateStr} />
            </Card>
          </div>

          {/* Mood */}
          <Card variant="warm" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-display text-base font-semibold text-espresso-800">Mood</h3>
            </div>
            <MoodSelector mood={log?.mood_rating} date={dateStr} />
          </Card>

          {/* Weight */}
          {log?.weight_kg && (
            <Card variant="warm" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sage-100/50 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-1 relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-sage-100 to-emerald-100 shadow-sm">
                  <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                </div>
                <h3 className="font-display text-base font-semibold text-espresso-800">Weight</h3>
              </div>
              <p className="font-display text-3xl font-bold text-espresso-800 mt-2">
                {log.weight_kg} <span className="text-lg font-normal text-espresso-400">kg</span>
              </p>
            </Card>
          )}
        </div>
      ) : !logError ? (
        <div className="text-center py-12">
          <Spinner size="md" label="Loading daily data..." />
        </div>
      ) : null}

      <Modal isOpen={showMeal} onClose={() => setShowMeal(false)} title="Add Meal">
        <MealForm dailyLogId={dailyLogId} onClose={() => setShowMeal(false)} />
      </Modal>
      <Modal isOpen={showWorkout} onClose={() => setShowWorkout(false)} title="Add Workout">
        <WorkoutForm dailyLogId={dailyLogId} onClose={() => setShowWorkout(false)} />
      </Modal>
    </div>
  );
}
