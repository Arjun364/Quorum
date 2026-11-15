/** Full-screen placeholder shown while the session is being restored at startup. */
export function SplashScreen() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-muted">
      Loading…
    </div>
  );
}
