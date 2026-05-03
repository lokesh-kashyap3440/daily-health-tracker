const suggestions = [
  'Meal plan for weight loss',
  'High-protein breakfast ideas',
  'Quick home workout routine',
  'How to improve sleep quality',
  'Healthy snacking tips',
  'Post-workout nutrition',
];

export default function SuggestionChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 p-4 pt-0">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition cursor-pointer"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
