export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 sm:mb-5 sm:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="break-words text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
          {title}
        </h1>
        {description && (
          <div className="mt-1 text-sm text-zinc-500">{description}</div>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
