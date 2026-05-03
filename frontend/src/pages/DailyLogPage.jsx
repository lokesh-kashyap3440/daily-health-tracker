import { useState } from 'react';
import { useDailyLog } from '../hooks/useDailyLog';
import { useMeals, useDeleteMeal } from '../hooks/useMeals';
import { useWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import MealForm from '../components/log/MealForm';
import MealList from '../components/log/MealList';
import WorkoutForm from '../components/log/WorkoutForm';
import WorkoutList from '../components/log/WorkoutList';
import WaterTracker from '../components/log/WaterTracker';
import SleepTracker from '../components/log/SleepTracker';
import MoodSelector from '../components/log/MoodSelector';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

export default function DailyLogPage() {
  const [date, setDate] = useState(new Date());
  const [showMeal, setShowMeal] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);

  const dateStr = fmtDate(date);
  const { data: log, isLoading } = useDailyLog(dateStr);
  const { data: meals } = useMeals(dateStr);
  const { data: workouts } = useWorkouts(dateStr);
  const deleteMeal = useDeleteMeal();
  const deleteWorkout = useDeleteWorkout();

  const changeDay = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Daily Log</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><ChevronLeft size={20} /></button>
          <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><ChevronRight size={20} /></button>
          <button onClick={() => setDate(new Date())} className="text-xs text-green-600 font-medium hover:underline cursor-pointer">Today</button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Meals</h3>
          <button onClick={() => setShowMeal(true)} className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline cursor-pointer">
            <Plus size={16} /> Add
          </button>
        </div>
        <MealList meals={meals} onDelete={(id) => deleteMeal.mutate(id)} />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Workouts</h3>
          <button onClick={() => setShowWorkout(true)} className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline cursor-pointer">
            <Plus size={16} /> Add
          </button>
        </div>
        <WorkoutList workouts={workouts} onDelete={(id) => deleteWorkout.mutate(id)} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><h3 className="font-semibold text-slate-800 mb-3">Water</h3><WaterTracker glasses={log?.water_glasses || 0} date={dateStr} /></Card>
        <Card><h3 className="font-semibold text-slate-800 mb-3">Sleep</h3><SleepTracker sleepHours={log?.sleep_hours} sleepQuality={log?.sleep_quality} date={dateStr} /></Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-3">Mood</h3>
        <MoodSelector mood={log?.mood_rating} date={dateStr} />
      </Card>

      {log?.weight_kg && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-1">Weight</h3>
          <p className="text-2xl font-bold text-slate-800">{log.weight_kg} <span className="text-base font-normal text-slate-500">kg</span></p>
        </Card>
      )}

      <Modal isOpen={showMeal} onClose={() => setShowMeal(false)} title="Add Meal">
        <MealForm date={dateStr} onClose={() => setShowMeal(false)} />
      </Modal>
      <Modal isOpen={showWorkout} onClose={() => setShowWorkout(false)} title="Add Workout">
        <WorkoutForm date={dateStr} onClose={() => setShowWorkout(false)} />
      </Modal>
    </div>
  );
}
