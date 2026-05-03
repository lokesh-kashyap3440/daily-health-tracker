import { Pencil, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

const mealColors = { breakfast: 'green', lunch: 'blue', dinner: 'amber', snack: 'slate' };

export default function MealList({ meals, onDelete }) {
  const grouped = meals?.reduce((acc, meal) => {
    (acc[meal.meal_type] = acc[meal.meal_type] || []).push(meal);
    return acc;
  }, {}) || {};

  const order = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-4">
      {order.map((type) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">{type}</h3>
          {grouped[type]?.length > 0 ? (
            grouped[type].map((meal) => (
              <div key={meal.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{meal.food_name}</p>
                  <p className="text-xs text-slate-500">
                    {meal.calories} cal | P:{meal.protein_g}g | C:{meal.carbs_g}g | F:{meal.fat_g}g
                  </p>
                </div>
                <button onClick={() => onDelete(meal.id)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer text-slate-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic mb-2">No {type} logged</p>
          )}
        </div>
      ))}
    </div>
  );
}
