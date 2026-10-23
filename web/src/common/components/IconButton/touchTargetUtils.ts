// Grows an icon control's hit area to 44 px on touch screens (WCAG 2.2 target size, Apple's minimum) without
// changing how it looks. Shared by IconButton and icon-only links.
export const TOUCH_TARGET_CLASS = 'pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-2';
