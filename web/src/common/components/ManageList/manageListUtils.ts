import { object, string, type InferType } from 'yup';

export type ManageRow = {
  id: number;
  name: string;
  notes: string | null;
  // "12 funkos", "3 items": what the row is attached to.
  meta: string;
  isDeletable: boolean;
  deleteDescription: string;
};

const NAME_MAX_LENGTH = 100;
const NOTES_MAX_LENGTH = 500;

// The form's own check; the route action validates again against the service's schema.
export const manageFormSchema = object({
  name: string().trim().required('Name is required').max(NAME_MAX_LENGTH, `At most ${NAME_MAX_LENGTH} characters`),
  notes: string().trim().max(NOTES_MAX_LENGTH, `At most ${NOTES_MAX_LENGTH} characters`).nullable().notRequired(),
});

export type ManageFormValues = InferType<typeof manageFormSchema>;

export type ManageEntityFormData = { entity: ManageFormValues };

export const EMPTY_MANAGE_VALUES: ManageFormValues = { name: '', notes: '' };
