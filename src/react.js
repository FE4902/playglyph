// React adapter template (filled style). The build appends one `export const X = createReactIcon(...)` per icon.
import { createElement, forwardRef } from 'react';

const camel = (k) => (k.startsWith('data-') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
const toProps = (attrs) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [camel(k), v]));

export function createReactIcon(displayName, kebabName, iconNode) {
  const children = iconNode.map(([tag, attrs]) => [tag, toProps(attrs)]);
  const Component = forwardRef(function PlayglyphIcon({ size = 24, color = 'currentColor', className, children: extra, ...rest }, ref) {
    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'currentColor',
        color,
        className: ['pg', `pg-${kebabName}`, className].filter(Boolean).join(' '),
        ...rest,
      },
      ...children.map(([tag, props], i) => createElement(tag, { key: i, ...props })),
      ...(Array.isArray(extra) ? extra : extra != null ? [extra] : []),
    );
  });
  Component.displayName = displayName;
  return Component;
}
