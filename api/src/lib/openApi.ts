import { jsonSchemaTransformObject } from '@fastify/type-provider-zod';

type SchemaMap = Record<string, unknown>;
type OpenApiDocument = { components?: { schemas?: SchemaMap } } & Record<string, unknown>;

const SCHEMA_REF = /"#\/components\/schemas\/([^"]+)"/g;

function referencedNames(value: unknown): Set<string> {
  return new Set([...JSON.stringify(value).matchAll(SCHEMA_REF)].map((match) => match[1] ?? ''));
}

// Keeps only the component schemas reachable from the paths (directly or through another kept schema).
function dropUnreferencedSchemas(document: OpenApiDocument): OpenApiDocument {
  const schemas = document.components?.schemas ?? {};
  const { components, ...rest } = document;
  const kept = new Set<string>();
  const pending = [...referencedNames(rest)];

  while (pending.length > 0) {
    const name = pending.pop();

    if (!name || kept.has(name) || !(name in schemas)) continue;

    kept.add(name);
    pending.push(...referencedNames(schemas[name]));
  }

  const keptSchemas = Object.fromEntries(Object.entries(schemas).filter(([name]) => kept.has(name)));

  return { ...rest, components: { ...components, schemas: keptSchemas } };
}

type TransformObject = typeof jsonSchemaTransformObject;

// The zod transform emits an `XInput` twin for every named schema; responses only use `X`, so the twins go.
export const openApiTransformObject: TransformObject = (document) => {
  const transformed = jsonSchemaTransformObject(document) as OpenApiDocument;

  return dropUnreferencedSchemas(transformed) as ReturnType<TransformObject>;
};
