import { AVATARS } from '../data/avatars';
import { cn } from '../utils/cn';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export const AvatarPicker = ({ selectedAvatar, onSelect }: AvatarPickerProps) => {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border-2 border-gray-50 rounded-2xl">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          onClick={() => onSelect(avatar)}
          className={cn(
            "text-2xl p-2 rounded-xl transition-all hover:bg-gray-100",
            selectedAvatar === avatar ? "bg-secondary scale-110 shadow-sm" : "bg-transparent"
          )}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
};
