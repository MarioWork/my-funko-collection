import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  icon?: LucideIcon;
  description?: string;
};

// The page's icon (as in the navigation) in a tinted square, then the h1 and its one-line description.
function PageTitle({ title, icon: Icon, description }: Props) {
  return (
    <div className="flex min-w-0 flex-1 basis-0 items-start gap-3">
      {Icon ? (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary lg:size-10"
        >
          <Icon className="size-5" />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}

export default PageTitle;
