# AGENTS.md

## Scope

These instructions apply to the entire `financehub-frontend` repository, which is a FinanceHub desktop application built with Electron. They do not automatically apply to the backend, sibling repositories, or other FinanceHub applications. More specific `AGENTS.md` files override this file within their directories.

Use this repository as the source of truth. When patterns conflict, inspect the nearest feature and one or two similar implementations; do not promote an ambiguous local pattern into a repository-wide convention.

## Toolchain

- Use npm and preserve `package-lock.json`. This repository does not currently pin exact Node or npm versions, so do not invent or document a version requirement without adding an explicit project-level constraint.
- Primary scripts are `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run start`, and the platform packaging scripts `npm run build:win`, `npm run build:mac`, and `npm run build:linux`.
- The application uses Electron 31, electron-vite, Vite 5, React 18, and TypeScript 5.
- TypeScript is strict and no-emit. Use the configured aliases (`@renderer/*`, `@components/*`, `@hooks/*`, `@utils/*`, and `@/*`) for cross-directory renderer imports; relative imports are acceptable for nearby modules.
- `npm run lint` currently includes `--fix` and can modify the entire repository. Prefer a targeted, non-fixing ESLint command while investigating or validating focused work.

## Structure and architecture

- `src/main/`: Electron main process. It owns application and window lifecycle, native Electron APIs, cookie integration, IPC handlers, external-link handling, logging, and auto-updates.
- `src/preload/`: the context bridge between the main process and renderer. Keep runtime APIs and their declarations in `src/preload/index.ts` and `src/preload/index.d.ts` aligned.
- `src/renderer/index.html`: the main renderer entry document.
- `src/renderer/splash/`: the splash-screen renderer.
- `src/renderer/src/main.tsx`: renderer providers for HeroUI, React Query, cookies, and Sonner.
- `src/renderer/src/App.tsx`: React Router route composition. The app uses `HashRouter` so packaged `file://` navigation works.
- `src/renderer/src/components/pages/`: route-level screens and nested domain pages.
- `src/renderer/src/components/layouts/`: authentication, protected-shell, and settings layouts.
- `src/renderer/src/components/modals/`: create, update, delete, and workflow dialogs; write mutations are commonly colocated here.
- `src/renderer/src/components/cashboxes/`: cashbox history and current-history views.
- `src/renderer/src/components/`: reusable renderer UI such as `Button`, `Table`, `Chip`, navigation, and domain-level composed views.
- `src/renderer/src/hooks/`: reusable hooks plus domain Zod schemas and Axios read functions. Despite the folder name, several files are data-access modules rather than React hooks.
- `src/renderer/src/utils/`: shared types, permission definitions, formatting, class composition, error helpers, and domain transformations.
- `src/renderer/src/assets/`: renderer styles and bundled images.
- `resources/` and `build/`: application icons and packaging resources.
- `electron.vite.config.ts`, `electron-builder.yml`, and the `build` section in `package.json`: build and packaging configuration. Packaging settings currently exist in more than one place; inspect all relevant configuration before changing identifiers, resources, targets, or publishing behavior.

Preserve the main/preload/renderer separation. Prefer extending an existing component, modal, data function, schema, provider, or utility over creating a parallel implementation. Do not introduce a new architectural layer without a concrete requirement.

## Electron boundaries and IPC

- Treat renderer code as an untrusted browser context. Privileged filesystem, process, session, updater, and native operations belong in the main process and must be exposed through a narrow preload API.
- Preserve context isolation and `webSecurity`. Never enable `nodeIntegration`, expose Node primitives, or expose the raw `ipcRenderer` to renderer code.
- Add explicit, narrowly scoped IPC channels. Validate and normalize every renderer-provided argument again in the main process before performing privileged work.
- Keep IPC channel names, handler signatures, preload wrappers, and `Window` typings synchronized.
- When exposing event subscriptions through preload, provide and use an unsubscribe mechanism so remounts do not accumulate listeners.
- Validate external URLs before passing them to `shell.openExternal`; allow only the schemes and destinations required by the feature.
- Preserve the development-versus-packaged loading paths and the production-only updater flow. Do not trigger publishing, installation, downgrade, or update behavior as part of unrelated work.
- Do not weaken the existing security boundary merely because nearby legacy code is permissive. If hardening would be behavior-changing, flag it and keep it scoped to a dedicated change.

## React and routing

- Preserve `HashRouter` unless a coordinated Electron loading and routing change explicitly replaces it.
- Add and update routes in `src/renderer/src/App.tsx`, and keep authentication-sensitive screens under the appropriate `AuthLayout` or `ProtectedLayout` boundary.
- Prefer values derived during render or from query/form state over duplicated state.
- Do not use `useEffect` to synchronize values that can be derived directly. Effects are appropriate for external systems such as Electron subscriptions, cookies, or imperative browser APIs.
- Avoid many independent `useState` values when they form one logical state or transition; keep state cohesive without overengineering it.
- Use React Hook Form with a Zod resolver for forms when adjacent code follows that pattern.
- Keep API/server state in React Query v3 (`react-query`). Do not copy query results into local state unless the user is editing a deliberate local draft or another concrete requirement exists.
- Reuse existing query keys, request functions, loading states, and invalidation paths where applicable.
- When a query key changes, inspect every reader, cache update, removal, and invalidation that depends on it. Query-key naming and React Query v3 calling styles are not globally consistent.
- Avoid premature `useMemo`, `useCallback`, `memo`, custom hooks, and generic components. Add them only for a demonstrated performance, identity, reuse, or clarity need.
- Prefer simple component composition over complex abstractions. Do not perform broad component splitting or refactoring unless the task requires it.

## TypeScript and validation

- Preserve strict typing and fix the cause of type errors.
- Avoid new `any`, `@ts-ignore`, and unsafe assertions used only to silence TypeScript, even where legacy examples exist.
- Infer domain types from existing Zod schemas where available and reuse existing domain types instead of creating duplicate shapes.
- Preserve backend payload and response field names, which commonly use Spanish terms and `snake_case`. Renderer-only form state may use `camelCase`; map it explicitly at the request boundary.
- Treat API data, IPC payloads, cookies, route parameters, and environment values as untrusted. Continue using Zod parsing where established, and validate inputs again at privileged or authorization-sensitive boundaries.

## Comments and user-facing language

- Add a brief comment in English when a function, method, component, IPC flow, or piece of logic is complex or not evident at first glance.
- Comments should explain why the implementation exists, including important reasoning, constraints, tradeoffs, or invariants. Do not narrate the code line by line.
- Do not add comments for code whose behavior is already obvious.
- The application UI is primarily Spanish. Match the wording, terminology, accents, and tone of nearby user-facing text unless the task explicitly changes the product language.

## API and data access

- This frontend has no database, ORM, or repository layer. Do not describe or design it as if it does.
- Backend requests use the Axios factory in `src/renderer/src/hooks/axios.ts`, normally with `withCredentials: true`, and the renderer API base URL comes from `import.meta.env.VITE_API_BACKEND_URL`.
- Domain read functions and their Zod response schemas generally belong in the relevant `src/renderer/src/hooks/` module.
- Write mutations are currently colocated with the relevant page or modal. Follow the nearby feature unless a requested refactor establishes a different boundary.
- Use React Query for request state and invalidate all affected existing keys after successful writes.
- Do not invent a global query-key factory, API service layer, or error envelope without explicit instruction.
- Client validation is not authorization. The backend must validate authorization-sensitive identifiers, including organization IDs, user IDs, role IDs, permission values, and financial record IDs.

## Authentication, authorization, and security

- Reuse the existing session flow in `AuthLayout`, `ProtectedLayout`, `useAuthToken`, and the Electron cookie bridge. Preserve cookie-based requests and the distinction between development/browser behavior and packaged Electron behavior.
- Authentication and authorization are separate. Hiding a route, navigation item, or control in the renderer is not sufficient authorization for a sensitive action.
- Preserve existing permission, session, cookie, and organization-scoping checks. Never trust renderer-provided identity, permission, organization, cashbox, client, seller, operation, or loan data without backend or privileged-boundary validation.
- If nearby authorization behavior is incomplete or contradictory, flag it instead of silently selecting the least restrictive behavior.
- Never expose API keys, credentials, signing data, tokens, cookie values, or secrets to the renderer. Anything under `import.meta.env.VITE_*` or passed through `contextBridge.exposeInMainWorld` is available to renderer code.
- The current preload exposes an environment object containing a `SECRET_KEY`-named value. Treat this as legacy security debt: do not reuse, expand, or place new secrets in that bridge. Secret-dependent work belongs in the main process or backend.
- Avoid `dangerouslySetInnerHTML`. Introduce it only for a clear, reviewed requirement with appropriate sanitization.
- Validate untrusted URLs, redirects, route parameters, search values, filenames, and request values before using them where injection, traversal, or open-redirect behavior is possible.
- Do not copy an insecure implementation merely because nearby code contains it.

## Environment variables

- Renderer-side API access currently uses `VITE_API_BACKEND_URL`. Add renderer variables to the Vite typings when useful, and remember that every `VITE_*` value is public to the renderer bundle.
- Main and preload code may use `process.env` for Electron/electron-vite runtime values. Keep renderer, preload, and main environment access appropriate to their execution context.
- Never expose a secret through Vite variables or the preload bridge for convenience.
- `.env` files are local configuration and must not be committed. Do not print their values in logs, validation output, documentation, or final responses.
- There is no checked-in `.env.example`; do not guess required variables or defaults. Infer usage from source and ask for deployment-specific values only when necessary.

## Error handling

- Reuse `ServerError`, `getErrorMessage`, `errorsResponse`, `ErrorMessage`/form error UI, and the surrounding feature's existing behavior.
- Use Sonner toasts where adjacent mutations use them rather than adding another notification system.
- Do not silently swallow errors. Preserve useful backend messages while avoiding disclosure of secrets, tokens, cookies, or sensitive internals.
- Existing API error shapes and mutation behaviors vary; do not impose a new global envelope as part of an unrelated change.
- Use `electron-log` for updater or main-process diagnostics where that subsystem already relies on it. Avoid noisy production console logging and never log credentials or financial secrets.
- There is no current Sentry integration. If a task adds or exposes an existing deployment integration, use it consistently, but do not introduce Sentry solely to satisfy this document.

## Tailwind and UI

- Reuse HeroUI components, local `Button`, `Table`, `Chip`, modal/form patterns, and nearby UI before creating new primitives with raw HTML.
- The design stack is HeroUI, Tailwind CSS, `@table-library/react-table-library`, Lucide icons, Sonner, Framer Motion/Motion, and ApexCharts where applicable.
- Use Tailwind's standard spacing, sizing, color, and theme tokens. Avoid arbitrary values and one-off colors unless a real design or Electron layout constraint requires them.
- Match spacing, responsive behavior, and desktop-window layout patterns in nearby components.
- Use Lucide icons where the surrounding UI does.
- Compose conditional classes with the existing `cn` helper.
- Follow the configured Prettier Tailwind class ordering.
- Preserve accessibility semantics, keyboard behavior, focus handling, labels, and disabled/loading states. Do not rely only on color to communicate financial or workflow status.

## Simplicity and scope control

- Prefer the smallest maintainable change that solves the request; follow YAGNI.
- Do not add utilities, hooks, services, components, IPC channels, or abstractions for hypothetical future use.
- Avoid excessive indirection and large refactors unless explicitly requested.
- Do not modify unrelated files or fix unrelated existing warnings.
- Do not perform repository-wide formatting or cleanup during a focused task.
- Preserve existing misspelled filenames, route parameter casing such as `percentageID`, query-key spellings, and public identifiers unless the task explicitly includes a coordinated rename and all consumers are updated.

## Generated files, packaging, and documentation

- Never edit `out/`, `release/`, or generated timestamped electron-vite configuration files directly. Rebuild them from source.
- Treat `package-lock.json` as generated by npm, but commit it whenever an authorized dependency change updates it.
- Do not run `npm run release` or publish an installer/update without explicit user authorization. A release changes external state and may publish to the configured provider.
- When changing packaging, application identity, icons, or updates, inspect both `package.json` and `electron-builder.yml`; their current values are not fully aligned.
- The README is minimal scaffold documentation. Verify behavior from configuration and source code rather than relying on it alone.

## Before implementing

For non-trivial work:

1. Inspect the relevant files and search the project for one or two implementations that solve a similar problem.
2. Prefer reusing existing components, functions, hooks, schemas, query keys, error patterns, IPC APIs, and conventions before creating a new solution.
3. If an existing similar pattern is not appropriate, identify the concrete reason for using a different approach.
4. Check main/preload/renderer boundaries, routing, state management, data validation, authentication, authorization, and security implications.
5. Implement the smallest change that fully satisfies the task.

Investigation, diagnosis, and review requests are read-only unless the user explicitly requests changes.

## Validation

Run checks from the repository root. For code changes, run the relevant subset and normally finish with:

```text
npx prettier --check <changed-files>
git diff --check
npm run typecheck
npx eslint <changed-js-ts-files>
npm run build
```

Run `npm run build` when the change affects runtime behavior, routing, IPC, main/preload code, bundling, environment handling, or production compilation. Run an unpacked or platform build only when packaging behavior changes or the task explicitly requires an installer.

The repository currently has no automated test suite or test script; state what behavior still needs manual verification. `npm run lint` runs ESLint with `--fix` over the entire repository, so do not use it casually in a dirty worktree. The ESLint configuration also contains a legacy `next/core-web-vitals` extension even though this is not a Next.js application; if that causes a baseline failure, report it rather than installing Next.js or changing lint configuration as part of unrelated work.

The repository may have pre-existing warnings, type errors, lint configuration issues, formatting differences, or line-ending changes. Do not fix them incidentally. Compare failures with the baseline, distinguish new failures from existing ones, and never claim a check passed when it failed or did not run.

## Final response

After implementation, briefly report:

- what changed and any important decision;
- any intentional deviation from a similar existing pattern and why a different approach was necessary;
- files modified;
- validation commands run and their outcomes;
- unresolved issues or required manual verification.

Keep the handoff concise and do not include unrelated explanation.
