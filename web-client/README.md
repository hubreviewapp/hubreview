# HubReview | web-client

## Development

### Conventions

#### Styling

- Avoid raw CSS, use [MUI's own theming options](https://mui.com/material-ui/customization/how-to-customize/)

#### Syntax

- Use `function` syntax instead of arrow functions for React components.
  Arrow functions have some pitfalls, albeit small, and [react.dev](https://react.dev) also uses `function` syntax.

#### Symbol Naming

- Components that form a page should preferably be suffixed with `Page`.
  Example: `HomePage` instead of `Home`

#### File Naming

- If a file/directory exports a particular function/component/etc., then name the file exactly the same.
  Example: `MyComponent` in `MyComponent.tsx`, or `dateUtils` in `dateUtils.ts`
- If something does not fit the rule above, e.g., exports a category of things, then name the file/directory
  in kebab-case.
  Example: `foo` and `bar` in `foo-bar-thing` (surely, better examples than this exist)

