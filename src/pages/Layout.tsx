export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">{children}</div>
    </div>
  );
}
