import ProfileForm from '../components/profile/ProfileForm';
import DietaryPrefs from '../components/profile/DietaryPrefs';
import GoalsForm from '../components/profile/GoalsForm';
import Button from '../components/ui/Button';
import { useLogout } from '../hooks/useAuth';
import { User, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const logout = useLogout();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm flex-shrink-0">
            <User size={20} className="text-sage-600" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-espresso-800 tracking-tight truncate dark:text-cream-100">
              Profile & Settings
            </h1>
            <p className="text-sm text-espresso-400 mt-1 dark:text-dark-400">Manage your personal information</p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={logout}
          icon={<LogOut size={16} />}
          className="flex-shrink-0"
        >
          Sign Out
        </Button>
      </div>

      <div className="space-y-6">
        <div className="animate-card-reveal stagger-1">
          <ProfileForm />
        </div>
        <div className="animate-card-reveal stagger-2">
          <DietaryPrefs />
        </div>
        <div className="animate-card-reveal stagger-3">
          <GoalsForm />
        </div>
      </div>
    </div>
  );
}
