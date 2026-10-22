const MESSAGE =
  'Do not hardcode a route path — import the matching constant from routesUtils.ts instead of retyping the path.';

const CHECKED_CALLEES = new Set(['navigate']);
const CHECKED_JSX_ATTRIBUTES = new Set(['to', 'href']);

export default {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'array',
        items: { type: 'string' },
      },
    ],
  },
  create(context) {
    const routePaths = [...(context.options[0] ?? [])];
    const routePathSet = new Set(routePaths);

    // '/items/:itemId' never matches a hand-written `/items/${id}`, so compare the part before the param.
    const staticPrefixes = routePaths
      .map((routePath) => (routePath.includes('/:') ? routePath.slice(0, routePath.indexOf('/:') + 1) : routePath))
      .filter((prefix) => prefix !== '/');

    const isHardcoded = (node) => {
      if (!node) return false;
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return routePathSet.has(node.value) || staticPrefixes.includes(node.value);
      }
      if (node.type === 'TemplateLiteral') {
        const head = node.quasis[0]?.value.cooked ?? '';
        if (!head.startsWith('/')) return false;
        return routePathSet.has(head) || staticPrefixes.some((prefix) => head.startsWith(prefix));
      }
      return false;
    };

    const report = (node) => context.report({ node, message: MESSAGE });

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || !CHECKED_CALLEES.has(node.callee.name)) return;
        for (const arg of node.arguments) if (isHardcoded(arg)) report(arg);
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || !CHECKED_JSX_ATTRIBUTES.has(node.name.name)) return;
        const { value } = node;
        if (!value) return;
        if (isHardcoded(value)) return report(value);
        if (value.type === 'JSXExpressionContainer' && isHardcoded(value.expression)) report(value.expression);
      },
    };
  },
};
