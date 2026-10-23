import { cn } from '@utils/classNameUtils';

// "waiting": no photo yet, nothing here yet. "searching": holds a magnifying glass, as the logo's figure does.
// "notFound": the glass, a frown and a question mark — a search that came back empty.
export type FunkoFigurePose = 'waiting' | 'searching' | 'notFound';

type Props = {
  pose?: FunkoFigurePose;
  className?: string;
};

const SMILE_PATH = 'M35 37q5 4 10 0';
const FROWN_PATH = 'M35 40q5 -4 10 0';

function MagnifyingGlass() {
  return (
    <g strokeLinecap="round" className="stroke-primary">
      <path d="M55 68 66 56" strokeWidth="4" />
      <circle cx="74" cy="47" r="11" strokeWidth="3" className="fill-card" />
      <path d="M68 44a6 6 0 0 1 5-4" strokeWidth="2" />
    </g>
  );
}

function QuestionMark() {
  return (
    <g strokeWidth="3" strokeLinecap="round">
      <path d="M79 9a6 6 0 1 1 7 6q-2.5 1-2.5 4.5" />
      <circle cx="83.5" cy="25" r="1.8" className="fill-current stroke-none" />
    </g>
  );
}

// The logo's Pop! figure as a dashed outline, in the theme's muted colour so it follows light and dark mode, with
// the magnifying glass in the primary colour. Decorative: the surrounding tile or message carries the meaning.
function FunkoFigureArt({ pose = 'waiting', className }: Props) {
  const hasGlass = pose !== 'waiting';
  const isNotFound = pose === 'notFound';

  return (
    <svg
      viewBox={hasGlass ? '0 0 96 96' : '0 0 80 96'}
      fill="none"
      aria-hidden="true"
      className={cn('stroke-current', className)}
    >
      <g strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round">
        <rect x="14" y="8" width="52" height="42" rx="15" />
        <rect x="26" y="54" width="28" height="30" rx="9" />
      </g>
      <g strokeWidth="3" strokeLinecap="round">
        <path d="M14 23a6 6 0 0 0 0 12" />
        <path d="M66 23a6 6 0 0 1 0 12" />
        <path d={isNotFound ? FROWN_PATH : SMILE_PATH} />
      </g>
      <circle cx="30" cy="29" r="4" className="fill-current stroke-none" />
      <circle cx="50" cy="29" r="4" className="fill-current stroke-none" />
      {hasGlass ? <MagnifyingGlass /> : null}
      {isNotFound ? <QuestionMark /> : null}
    </svg>
  );
}

export default FunkoFigureArt;
