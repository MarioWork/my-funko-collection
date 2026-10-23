import { Sparkle, Sparkles } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import roundLogo from '../roundLogo.webp';

type Props = {
  // A little box label hanging off the figure at a tilt, as the 404 page's "Box 404".
  label: string;
};

// The round brand badge on a soft teal halo, bobbing gently over its own shadow, with two sparkles twinkling
// beside it. Still when the system asks for reduced motion. Decorative: the page's heading carries the meaning.
function FloatingLogo({ label }: Props) {
  return (
    <div className="relative flex flex-col items-center pt-2" aria-hidden="true">
      <div className="absolute top-0 size-36 rounded-full bg-primary/10" />
      <Sparkles className="absolute top-1 -left-8 size-6 text-primary motion-safe:animate-twinkle" />
      <Sparkle className="absolute top-24 -right-7 size-4 text-primary [animation-delay:1.4s] motion-safe:animate-twinkle" />
      <div className="relative motion-safe:animate-float">
        <img
          src={roundLogo}
          alt=""
          width={128}
          height={128}
          className="size-32 rounded-full bg-card shadow-lg ring-4 ring-card"
        />
        <Badge variant="outline" className="absolute -top-1 -right-9 rotate-12 bg-card shadow-sm">
          {label}
        </Badge>
      </div>
      <div className="mt-3 h-2 w-20 rounded-full bg-foreground/15 blur-[2px] motion-safe:animate-float-shadow" />
    </div>
  );
}

export default FloatingLogo;
