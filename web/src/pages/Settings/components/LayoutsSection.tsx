import { Grid3x3, LayoutGrid, List, ListTree } from 'lucide-react';
import type { SegmentedOption } from '@components/SegmentedToggle';
import SegmentedToggle from '@components/SegmentedToggle';
import { useLayoutPreference } from '@hooks/useLayoutPreference';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { CollectionLayoutUtil, FunkoLayoutUtil, ImageViewUtil } from '@app-types/utility';
import {
  COLLECTION_LAYOUT_STORAGE_KEY,
  DEFAULT_IMAGE_VIEW,
  FUNKO_LAYOUT_STORAGE_KEY,
  IMAGE_VIEW_STORAGE_KEY,
} from '@utils/layoutUtils';
import SettingsSection from './SettingsSection';

type LayoutRowProps<Value extends string> = {
  label: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

const FUNKO_OPTIONS: SegmentedOption<FunkoLayoutUtil>[] = [
  { value: FunkoLayoutUtil.LARGE_GRID, label: 'Large grid', icon: LayoutGrid },
  { value: FunkoLayoutUtil.SMALL_GRID, label: 'Small grid', icon: Grid3x3 },
  { value: FunkoLayoutUtil.LIST, label: 'List', icon: List },
];

const COLLECTION_OPTIONS: SegmentedOption<CollectionLayoutUtil>[] = [
  { value: CollectionLayoutUtil.GRID, label: 'Grid', icon: LayoutGrid },
  { value: CollectionLayoutUtil.LIST, label: 'List', icon: List },
];

const IMAGE_OPTIONS: SegmentedOption<ImageViewUtil>[] = [
  { value: ImageViewUtil.FUNKOS, label: 'By funko', icon: ListTree },
  { value: ImageViewUtil.IMAGES, label: 'All images', icon: List },
];

function LayoutRow<Value extends string>({ label, options, value, onChange }: LayoutRowProps<Value>) {
  return (
    <div className="flex flex-col gap-2">
      {/* Visible title; the toggle group carries the same name for assistive tech. */}
      <p className="text-sm font-medium">{label}</p>
      <SegmentedToggle label={label} options={options} value={value} onChange={onChange} />
    </div>
  );
}

// How each list opens. It is the same saved choice as the layout menu on that page, so changing either changes both.
function LayoutsSection() {
  const { layout: funkoLayout, setLayout: setFunkoLayout } = useLayoutPreference(FUNKO_LAYOUT_STORAGE_KEY);
  const [collectionLayout, setCollectionLayout] = useLocalStorage<CollectionLayoutUtil>(
    COLLECTION_LAYOUT_STORAGE_KEY,
    CollectionLayoutUtil.GRID,
  );
  const [imageView, setImageView] = useLocalStorage<ImageViewUtil>(IMAGE_VIEW_STORAGE_KEY, DEFAULT_IMAGE_VIEW);

  return (
    <SettingsSection
      title="Layouts"
      description="How each list opens on this device. Changing it on the page changes it here too."
    >
      <LayoutRow label="Funkos" options={FUNKO_OPTIONS} value={funkoLayout} onChange={setFunkoLayout} />
      <LayoutRow
        label="Collections"
        options={COLLECTION_OPTIONS}
        value={collectionLayout}
        onChange={setCollectionLayout}
      />
      <LayoutRow label="Images" options={IMAGE_OPTIONS} value={imageView} onChange={setImageView} />
    </SettingsSection>
  );
}

export default LayoutsSection;
