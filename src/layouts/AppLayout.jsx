function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <a href="/" aria-label="Toolshare, accueil">
          Toolshare
        </a>
      </header>
      <main className="app-layout__main">{children}</main>
    </div>
  );
}

export default AppLayout;
