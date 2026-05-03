import ProfileForm from '../components/profile/ProfileForm';
import DietaryPrefs from '../components/profile/DietaryPrefs';
import GoalsForm from '../components/profile/GoalsForm';
import Button from '../components/ui/Button';
import { useLogout } from '../hooks/useAuth';

export default function ProfilePage() {
  const logout = useLogout();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Profile & Settings</h2>
        <Button variant="ghost" onClick={logout} className="text-red-500 hover:bg-red-50">Sign Out</Button>
      </div>
      <ProfileForm />
      <DietaryPrefs />
      <GoalsForm />
    </div>
  );
}
