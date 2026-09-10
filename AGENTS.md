# Repository Guidelines

## Project Structure & Module Organization

This is an Electron application built with Vue 3, Vite, and TypeScript. Runtime code is organized by process:

- `src/main/` contains the Electron main process, windows, clipboard integration, shortcuts, configuration, and proxy services.
- `src/preload/` and `src/ipc/` expose the secure renderer bridge and IPC types.
- `src/renderer/` contains `App.vue`, styles, API/market logic, item analysis, and UI components.
- `src/lib/` contains shared API and type definitions; `src/test/` contains Vitest tests and fixtures.
- `src/assets/` contains application assets. `demo/` contains screenshots and demonstration media.
- Build configuration lives in `electron.vite.config.ts`, `electron-builder.json`, and the TypeScript config files.

Keep new code in the process or feature directory it belongs to, and add tests beside the existing `src/test` organization rather than committing generated `dist/` or `release/` output.

## Build, Test, and Development Commands

Use pnpm and the committed `pnpm-lock.yaml`.

- `pnpm install` — install dependencies.
- `pnpm dev` — start Electron Vite in watch/development mode.
- `pnpm test` — run Vitest in interactive mode; use `pnpm exec vitest run` for a one-shot run.
- `pnpm type-check` — run `vue-tsc` without emitting files.
- `pnpm ipc-type` — regenerate IPC declarations after changing `src/ipc/index.ts`.
- `pnpm build` — type-check, build the Electron bundles, and package the app with electron-builder.
- `pnpm preview` — preview the built Vite output.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, omitted semicolons, and single quotes. Use `PascalCase` for Vue components, `camelCase` for functions and variables, and descriptive feature-oriented filenames. Keep renderer-only code in `src/renderer`; cross-process communication should go through preload/IPC.

## Testing Guidelines

Tests use Vitest with a Node environment and the `@` alias mapped to `src`. Name files `*.test.ts` and keep fixtures in `src/test/data`. Add focused tests for parsing, market logic, and other deterministic behavior; run `pnpm exec vitest run` and `pnpm type-check` before submitting changes.

## Commit & Pull Request Guidelines

Recent commits are short, single-purpose descriptions, commonly written in Chinese (for example, `修正部分多行詞綴判斷。`). Follow that established style or use an equally concise imperative summary. Pull requests should explain what changed and why, select the applicable checkbox in `.github/PULL_REQUEST_TEMPLATE.md`, describe testing, and include screenshots or demo evidence for UI changes. Avoid modifying `pnpm-lock.yaml`; repository CI explicitly rejects lockfile changes.

## Security & Configuration Tips

Keep API URLs, tokens, and other local values in ignored `.env`/`.env.local` files. Never commit secrets or generated release artifacts. Release builds run from version tags and require the configured GitHub and market API secrets.
