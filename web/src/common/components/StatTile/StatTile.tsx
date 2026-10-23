import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  // Where the number leads (the catalog, a collection). The whole tile becomes the link.
  to?: string;
};

// A KPI: label on top, one big tabular number, an optional comparison line. Two per row on phone, four on desktop.
// A linked tile gets the app's card hover: the primary outline, no background change.
function StatTile({ label, value, hint, icon: Icon, to }: Props) {
  return (
    <Card
      size="sm"
      className={cn(
        'relative',
        to && 'transition-shadow focus-within:ring-2 focus-within:ring-primary hover:ring-2 hover:ring-primary',
      )}
    >
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
          {to ? (
            <Link to={to} className="outline-none after:absolute after:inset-0 after:rounded-xl">
              {label}
            </Link>
          ) : (
            label
          )}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums group-data-[size=sm]/card:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

export default StatTile;
