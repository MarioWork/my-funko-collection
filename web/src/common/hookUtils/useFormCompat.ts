import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form';

// react-hook-form drives uncontrolled inputs through the ref callback it returns on every render; once the React
// Compiler memoizes that, `reset()`, `watch()` and `isDirty` go stale. Every form calls this instead of `useForm`.
export function useFormCompat<Values extends FieldValues>(props?: UseFormProps<Values>): UseFormReturn<Values> {
  'use no memo';

  return useForm<Values>(props);
}
