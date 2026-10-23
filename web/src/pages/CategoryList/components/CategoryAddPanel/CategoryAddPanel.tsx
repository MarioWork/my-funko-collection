import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';
import ManageAddPanel from '@components/ManageAddPanel';

// Routed under categorys/add: the form, posting to the list's own action.
function CategoryAddPanel() {
  return (
    <ManageAddPanel
      noun="category"
      description="Funko's own line, as printed on the box"
      hasNotes={false}
      addPath={CATEGORY_ROUTES_PATHS.BASE}
    />
  );
}

export default CategoryAddPanel;
