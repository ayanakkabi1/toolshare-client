function ErrorState({ message = 'Une erreur est survenue.', onRetry }) {
  return (
    <div role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
