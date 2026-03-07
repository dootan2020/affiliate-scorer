/** Constrains page content to max-w-6xl with standard padding. Used by all pages except dashboard. */
export function PageContainer({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  );
}
