export default function LoadingSpinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClass} border-2 border-bg-border border-t-accent-blue rounded-full animate-spin`} />
    </div>
  );
}
