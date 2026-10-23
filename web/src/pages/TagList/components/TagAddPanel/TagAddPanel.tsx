import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import ManageAddPanel from '@components/ManageAddPanel';

// Routed under tags/add: the form, posting to the list's own action.
function TagAddPanel() {
  return (
    <ManageAddPanel
      noun="tag"
      description="Labels on your items, like the box or shelf they sit in."
      hasNotes
      addPath={TAG_ROUTES_PATHS.BASE}
    />
  );
}

export default TagAddPanel;
