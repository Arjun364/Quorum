# Frontend Feature Pattern

Source: the team's feature pattern (written with a jobs application as the example). Quorum follows it exactly; the examples below use Quorum names. Read this before scaffolding or making a substantial feature-level change, and inspect the most similar existing feature first.

## Folder layout

```
src/
├── main.tsx
├── app/            router, shell, route guards, query client (no feature logic)
├── config/         app-wide constants (API base URL, ...)
├── design/         tokens.css
├── shared/         code used by more than one feature, SAME structure as a feature:
│   ├── api/  components/  constants/  hooks/  types/  utils/   (+ index.ts in each)
└── features/<name>/
    ├── api/            <name>Api.ts
    ├── components/     reusable UI; group several related components in a subfolder (e.g. components/applyJob/)
    ├── constants/      <name>.constants.ts
    ├── hooks/          use<Name><Page>.ts
    ├── pages/          <Name>Page.tsx
    ├── types/          <name>.types.ts, <name>.props.ts
    ├── utils/          <name>.utils.ts
    └── index.ts
```

Imports use the `@/` alias (`@/shared/components`, `@/features/auth`).

## Types, folders and barrels
- Domain types, API payloads, component props and shared feature state types live in `types/`. Do not repeat reusable types inline across pages, hooks and components.
- Every directory that contains modules has an `index.ts` barrel, including newly created nested directories. Import across folders **through the barrel**; never reach into another folder's implementation file.
- Group related components by page or responsibility when there are several (a multi-component flow lives in its own subfolder with its own `index.ts`). Keep a small number of components directly in `components/`.
- Each component has one UI responsibility. Components receive typed values and callbacks; they do not own page orchestration.

## File responsibility

| File | Owns | Must not own |
| --- | --- | --- |
| `pages/<Name>Page.tsx` | Route parameter reading, page shell, breadcrumbs, layout composition, presentation-local UI state | HTTP calls, query definitions, page behaviour handlers, reusable block implementation |
| `hooks/use<Name><Page>.ts` | Query/mutation definitions, API calls through the API module, page state, derived data, navigation, filters, pagination, handlers | JSX rendering |
| `api/<name>Api.ts` | Typed endpoint functions, request payloads, query-string construction | React, state, navigation, JSX |
| `components/*.tsx` | Reusable UI and typed callback events | Direct endpoint calls or duplicated page logic |
| `types/<name>.types.ts` | Domain, API, props, filters, shared state types | React behaviour or endpoint implementation |
| `constants/<name>.constants.ts` | Stable defaults, options, labels, mappings | Dynamic business behaviour |
| `utils/<name>.utils.ts` | Pure transformations and calculations | State changes, network calls, JSX |

## Page and hook pairing
One orchestration hook per non-static page. The page is thin: it calls its hook, prepares only page composition, and passes the returned typed props and callbacks to components. A page must not define page-specific functions (submit, filter, navigation, file, query or mutation handlers); it invokes the hook's action instead. **Only a page hook may call the feature API module.**

```
<Name>ListPage.tsx    -> use<Name>List.ts
<Name>DetailPage.tsx  -> use<Name>Details.ts
<Name>FormPage.tsx    -> use<Name>Form.ts
```

## Hook order
Keep related code together in this exact order:

```tsx
/** Owns the list screen data, filters, and navigation actions. */
export function useThingList() {
  // Route and translation dependencies.
  // All related list/filter state.
  // List query and mutations that use that state.
  // Derived table/filter configuration.

  /** Updates a filter and resets pagination before the query refreshes. */
  const updateFilter = () => { /* ... */ };

  return { /* page data first, then state, then actions */ };
}
```
A handler that updates a state variable is defined immediately after the state, query or derived value it affects. No unrelated handler groups in between.

## Comment standard
A useful JSDoc comment immediately before every component and function: the responsibility, plus the meaningful input, output or side effect when relevant. No comments that only repeat a name (`/** Gets jobs */`, `/** Handle click */`).

## Examples

```ts
export const meetingsApi = {
  /** Fetches meetings using the supplied filters and returns the paginated payload. */
  async list(filters: MeetingsListFilters) {
    const response = await apiClient.get<ApiResponse<PaginatedMeetings>>(createMeetingsListUrl(filters));
    return response.data.data;
  },
};
```

```tsx
/** Renders the meetings table and delegates user actions to the list-page hook. */
export function MeetingsList({ data, isLoading, onPageChange }: MeetingsListProps) {
  return <BaseTable isLoading={isLoading} onPageChange={onPageChange} rows={data.items} />;
}
```

## Backend folder pattern
The API follows the layered structure agreed from the team's reference: `config/ constants/ controllers/ helpers/ middlewares/ prisma/ repositories/ routes/ services/ types/ utils/ validators/`, plus `app.ts` and `server.ts`. See CLAUDE.md for the data-access rules (repositories talk to Prisma, services hold business rules, controllers stay thin).
