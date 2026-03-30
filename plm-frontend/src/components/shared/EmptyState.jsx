import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data found', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <Icon size={40} strokeWidth={1} />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}
