import WeightChart from '../components/metrics/WeightChart';
import CalorieChart from '../components/metrics/CalorieChart';
import WorkoutHeatmap from '../components/metrics/WorkoutHeatmap';
import SleepChart from '../components/metrics/SleepChart';

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Health Metrics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightChart />
        <CalorieChart />
        <WorkoutHeatmap />
        <SleepChart />
      </div>
    </div>
  );
}
