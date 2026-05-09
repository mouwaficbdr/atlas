export default function HomePage() {
  return (
    <main style={{ pointerEvents: 'none' }}>
      {/* 
        The Globe and Loading Screen are now handled by PersistentLayout 
        so they don't unmount when navigating to a country page.
      */}
    </main>
  );
}
