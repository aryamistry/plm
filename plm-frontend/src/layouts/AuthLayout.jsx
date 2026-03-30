export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-display tracking-tight">PLM</h1>
          <p className="text-text-secondary text-sm mt-1"> Engineering Change Order System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
