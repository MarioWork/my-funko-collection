// A type folder's barrel is exempt: the conventions require it to be `index.ts`.
// `enum` is not listed: erasableSyntaxOnly bans it, and the `as const` value sets that replace it are runtime
// exports, which the conventions allow inside a `.type.ts` (react-ts-types).
const TYPE_ONLY_DECLARATIONS = new Set(['TSTypeAliasDeclaration', 'TSInterfaceDeclaration']);

function isTypeOnlyExport(node) {
  if (node.type === 'ExportNamedDeclaration') {
    if (node.exportKind === 'type') return true;
    if (node.declaration) return TYPE_ONLY_DECLARATIONS.has(node.declaration.type);
    return false;
  }
  if (node.type === 'ExportAllDeclaration') {
    return node.exportKind === 'type';
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename ?? context.getFilename();
        if (filename.endsWith('.type.ts') || filename.endsWith('.d.ts')) return;
        if (/[\\/]index\.ts$/.test(filename)) return;

        const exportNodes = node.body.filter(
          (statement) => statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportAllDeclaration',
        );
        if (exportNodes.length === 0) return;

        const isTypeOnlyFile = exportNodes.every(isTypeOnlyExport);
        if (!isTypeOnlyFile) return;

        context.report({
          node,
          message: 'This file only exports types/interfaces — rename it to end in `.type.ts`.',
        });
      },
    };
  },
};
