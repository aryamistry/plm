export default function PageHeader({ title, description, children }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
