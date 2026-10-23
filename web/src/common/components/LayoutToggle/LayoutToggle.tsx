import { Grid3x3, LayoutGrid, List } from 'lucide-react';
import SegmentedToggle, { type SegmentedOption } from '@components/SegmentedToggle';
import { FunkoLayoutUtil } from '@utils/layoutUtils';

type Props = {
  value: FunkoLayoutUtil;
  onChange: (layout: FunkoLayoutUtil) => void;
};

const LAYOUT_OPTIONS: SegmentedOption<FunkoLayoutUtil>[] = [
  { value: FunkoLayoutUtil.LARGE_GRID, label: 'Large grid', icon: LayoutGrid },
  { value: FunkoLayoutUtil.SMALL_GRID, label: 'Small grid', icon: Grid3x3 },
  { value: FunkoLayoutUtil.LIST, label: 'List', icon: List },
];

// Large grid, small grid or list: icons only, each named in its tooltip.
function LayoutToggle({ value, onChange }: Props) {
  return (
    <SegmentedToggle label="Layout" options={LAYOUT_OPTIONS} value={value} onChange={onChange} labelDisplay="never" />
  );
}

export default LayoutToggle;
