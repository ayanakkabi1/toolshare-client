function LoadingState({ label = 'Chargement en cours...' }) {
  return (
    <div role="status" aria-live="polite">
      {label}
    </div>
  );
}

export default LoadingState;
