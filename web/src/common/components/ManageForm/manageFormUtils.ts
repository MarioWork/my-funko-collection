import { object, type InferType } from 'yup';
import { tagNameSchema, tagNotesSchema } from '@utils/tagUtils';

// The form's own check; the route action validates again against the service's schema. Categories, series and tags
// share one name rule (the three @utils name schemas are identical), and only tags have notes, so the tag schemas
// serve all three.
export const manageFormSchema = object({
  name: tagNameSchema,
  notes: tagNotesSchema,
});

export type ManageFormValues = InferType<typeof manageFormSchema>;

export type ManageEntityFormData = { entity: ManageFormValues };

export const EMPTY_MANAGE_VALUES: ManageFormValues = { name: '', notes: '' };
