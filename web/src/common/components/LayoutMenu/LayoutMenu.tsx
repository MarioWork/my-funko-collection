import { Grid3x3, LayoutGrid, List } from 'lucide-react';
import ViewMenu, { type ViewOption } from '@components/ViewMenu';
import { FunkoLayoutUtil } from '@utils/layoutUtils';

type Props = {
  value: FunkoLayoutUtil;
  onChange: (layout: FunkoLayoutUtil) => void;
};

const LAYOUT_OPTIONS: ViewOption<FunkoLayoutUtil>[] = [
  {
    value: FunkoLayoutUtil.LARGE_GRID,
    label: 'Large grid',
    description: 'Big photos, a few per row',
    icon: LayoutGrid,
  },
  { value: FunkoLayoutUtil.SMALL_GRID, label: 'Small grid', description: 'More on screen at once', icon: Grid3x3 },
  { value: FunkoLayoutUtil.LIST, label: 'List', description: 'A table with every detail', icon: List },
];

// Large grid, small grid or list, picked from one menu.
function LayoutMenu({ value, onChange }: Props) {
  return <ViewMenu label="Layout" options={LAYOUT_OPTIONS} value={value} onChange={onChange} />;
}

export default LayoutMenu;
