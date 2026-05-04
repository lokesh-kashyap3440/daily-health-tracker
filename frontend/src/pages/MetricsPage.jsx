import WeightChart from '../components/metrics/WeightChart';
import CalorieChart from '../components/metrics/CalorieChart';
import WorkoutHeatmap from '../components/metrics/WorkoutHeatmap';
import SleepChart from '../components/metrics/SleepChart';
import { BarChart3 } from 'lucide-react';

export default function MetricsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 shadow-sm">
          <BarChart3 size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-espresso-800 tracking-tight">
            Health Metrics
          </h1>
          <p className="text-sm text-espresso-400 mt-1">Visualize your progress over time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="animate-card-reveal stagger-1">
          <WeightChart />
        </div>
        <div className="animate-card-reveal stagger-2">
          <CalorieChart />
        </div>
        <div className="animate-card-reveal stagger-3">
          <WorkoutHeatmap />
        </div>
        <div className="animate-card-reveal stagger-4">
          <SleepChart />
        </div>
      </div>
    </div>
  );
}
