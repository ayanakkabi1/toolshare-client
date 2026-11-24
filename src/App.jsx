import AppLayout from './layouts/AppLayout';
import EmptyState from './composants/EmptyState';
import './App.css';

function App() {
  return (
    <AppLayout>
      <section>
        <h1>Toolshare</h1>
        <EmptyState message="Les outils disponibles seront bientôt affichés." />
      </section>
    </AppLayout>
  );
}

export default App;
