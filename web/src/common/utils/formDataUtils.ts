export const createFormData = <Key extends string>(data: Record<Key, unknown>) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key as Key];

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      formData.append(key, String(value));
      return;
    }
  });

  return formData;
};

export const parseFormData = <ParsedFormData>(data: FormData) => {
  const result: Record<string, unknown> = {};

  data.forEach((value, key) => {
    if (value instanceof File) {
      result[key] = value;
      return;
    }

    try {
      result[key] = JSON.parse(value);
    } catch {
      result[key] = value;
    }
  });

  return { ...result } as ParsedFormData;
};

// Whether an edit form would send exactly what is already saved: both sides go through the same payload builder, so
// comparing their JSON is enough. Used to close an untouched edit without a request.
export const isSamePayload = (saved: unknown, edited: unknown): boolean =>
  JSON.stringify(saved) === JSON.stringify(edited);
