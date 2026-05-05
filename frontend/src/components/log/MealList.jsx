import { Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

const mealColors = { breakfast: 'green', lunch: 'blue', dinner: 'amber', snack: 'slate' };
const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪' };

export default function MealList({ meals, onDelete }) {
  const grouped = meals?.reduce((acc, meal) => {
    (acc[meal.meal_type] = acc[meal.meal_type] || []).push(meal);
    return acc;
  }, {}) || {};

  const order = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-5">
      {order.map((type) => {
        const items = grouped[type];
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{mealIcons[type]}</span>
              <h3 className="text-xs font-semibold text-espresso-500 uppercase tracking-wider">{type}</h3>
              {items?.length > 0 && (
                <span className="text-[10px] font-medium text-espresso-400 bg-cream-200 px-1.5 py-0.5 rounded-full">{items.length}</span>
              )}
            </div>
            {items?.length > 0 ? (
              <div className="space-y-1.5">
                {items.map((meal) => (
                  <div key={meal.id} className="group flex items-center justify-between bg-white rounded-xl p-3 border border-cream-200 hover:border-sage-200 hover:shadow-sm transition-all duration-200">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-espresso-800 truncate">{meal.name}</p>
                      <p className="text-xs text-espresso-400 mt-0.5 truncate">
                        <span className="font-semibold text-amber-600">{meal.calories ?? '--'}</span> cal
                        <span className="mx-1.5 text-cream-300">|</span>
                        P:<span className="font-medium text-espresso-500">{meal.protein_g ?? '--'}g</span>
                        <span className="mx-1.5 text-cream-300">|</span>
                        C:<span className="font-medium text-espresso-500">{meal.carbs_g ?? '--'}g</span>
                        <span className="mx-1.5 text-cream-300">|</span>
                        F:<span className="font-medium text-espresso-500">{meal.fat_g ?? '--'}g</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onDelete(meal.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-terracotta-50 transition-all cursor-pointer text-espresso-400 hover:text-terracotta-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-espresso-400 italic py-2 px-1">No {type} logged</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
