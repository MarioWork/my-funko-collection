// Between the two ways to sign in. The line is decoration; the word is read out.
function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      or
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}

export default OrDivider;
