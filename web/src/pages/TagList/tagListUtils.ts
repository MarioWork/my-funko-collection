import type { ManageEntityFormData } from '@components/ManageForm';

// The form's fields as the tag API takes them: an empty note is sent as null. Shared by create and rename.
export function toTagPayload({ entity }: ManageEntityFormData) {
  return {
    name: entity.name,
    notes: entity.notes ? entity.notes : null,
  };
}
