// Two soft teal glows behind the card, so the page feels warm instead of flat. Decorative.
function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-24 size-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}

export default AuthBackdrop;
