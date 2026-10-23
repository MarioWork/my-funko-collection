import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import ManageAddPanel from '@components/ManageAddPanel';

// Routed under series/add: the form, posting to the list's own action.
function SeriesAddPanel() {
  return (
    <ManageAddPanel
      noun="series"
      description="The series a funko belongs to: Daredevil: Born Again, The Mandalorian…"
      hasNotes={false}
      addPath={SERIES_ROUTES_PATHS.BASE}
    />
  );
}

export default SeriesAddPanel;
