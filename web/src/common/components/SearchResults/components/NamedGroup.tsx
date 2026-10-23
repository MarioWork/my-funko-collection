import { Link } from 'react-router';
import { RESULT_LINK_CLASS, type SearchGroup } from '../searchResultsUtils';

type Props = {
  group: SearchGroup;
  onPick?: () => void;
};

function NamedGroup({ group, onPick }: Props) {
  if (group.entries.length === 0) return null;

  return (
    <section aria-label={group.heading} className="flex flex-col gap-1">
      <h2 className="px-2 text-xs font-medium text-muted-foreground uppercase">{group.heading}</h2>
      <ul className="flex flex-col">
        {group.entries.map((entry) => (
          <li key={entry.id}>
            <Link viewTransition to={group.toPath(entry)} onClick={onPick} className={RESULT_LINK_CLASS}>
              {entry.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NamedGroup;
