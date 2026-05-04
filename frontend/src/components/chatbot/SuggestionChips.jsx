const suggestions = [
  { text: 'Meal plan for weight loss', emoji: '🥗' },
  { text: 'High-protein breakfast ideas', emoji: '🍳' },
  { text: 'Quick home workout routine', emoji: '💪' },
  { text: 'How to improve sleep quality', emoji: '😴' },
  { text: 'Healthy snacking tips', emoji: '🥜' },
  { text: 'Post-workout nutrition', emoji: '🏋️' },
];

export default function SuggestionChips({ onSelect }) {
  if (!onSelect) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-3 pt-1">
      {suggestions.map((s, i) => (
        <button
          key={s.text}
          onClick={() => onSelect(s.text)}
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 bg-cream-50 hover:bg-sage-100 hover:text-sage-700 text-espresso-500 text-xs font-medium rounded-full border border-cream-200 hover:border-sage-300 transition-all duration-200 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
        >
          <span className="text-sm">{s.emoji}</span>
          <span>{s.text}</span>
        </button>
      ))}
    </div>
  );
}
