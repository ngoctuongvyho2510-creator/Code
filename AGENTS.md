# ModifyWrap 3D S4 Demo — Codex Instructions

## Purpose

This repository contains the customer-facing ModifyWrap 3D Audi S4 configurator.

The current completion order is:

1. Repair and validate the complete vehicle material system
2. Complete Save My Design
3. Refine the final website appearance
4. Perform final responsive and production checks
5. Freeze the 3D website
6. Move to the separate Quote Web project

Print-ready production export is postponed. Do not implement it unless the user explicitly requests it in a future task.

Do not begin Quote Web work inside this repository unless explicitly instructed.

## Required project documents

Read this file before every task.

For any task involving the 3D vehicle, materials, colours, textures, lighting, mesh targets, selection, Full Body, or Reset, also read:

- `docs/MATERIAL_SYSTEM.md`
- `docs/VEHICLE_OBJECT_MAP.md`

The current user task defines the scope of work. These files define persistent project constraints.

## Technology

Use the existing stack and currently installed packages, including:

- Vite
- React
- TypeScript
- Three.js
- ESLint
- CSS

Do not replace the existing 3D rendering stack.

Do not install packages unless the user explicitly approves them.

Before proposing a package, inspect the installed dependencies and confirm the task cannot reasonably be completed with the existing stack.

## Repository safety

1. Modify only files required for the current task.
2. Do not rename, move, or delete existing files or folders unless explicitly instructed.
3. Do not reorganize the repository for stylistic preference.
4. Do not replace the overall application architecture.
5. A focused internal refactor is allowed only when required to remove duplicated or conflicting logic for the current task.
6. Inspect the existing implementation before creating new files or systems.
7. Reuse existing working utilities and components where appropriate.
8. Do not create a second implementation for a responsibility that already exists.
9. Do not redesign unrelated UI while fixing 3D behaviour.
10. Keep every task reviewable and reversible.
11. Do not add a backend, database, authentication, payment system, email provider, or external API unless explicitly requested.
12. Stop after completing the requested task.

## Protected names and assets

Preserve the exact existing names, paths, casing, and imports for:

- `ModifyWrap 3D S4 Demo`
- `Assets`
- `Code`
- `S4 UV`
- `Mahir S4`
- `Logo`
- `Favicon 40`
- `Favicon 48`
- `Favicon 64`
- `Favicon 180`
- `Favicon 512`

Files inside `S4 UV` must retain their original names.

Do not rename GLTF mesh objects.

## Branding and fonts

Use the Super Sliced font only for the approved `MODIFYWRAP 3D STUDIO` branding/title.

Preserve the exact existing font file names.

Use:

- `Super Sliced.woff2` as the primary web font
- `Super Sliced.woff` as the fallback

Do not use Super Sliced for general UI text, buttons, forms, material names, or descriptions.

## Protected visible geometry

Meshes whose names begin with `tmp_` and the mesh named `tube01` must remain visible but are visual-only.

They must never be:

- selectable
- raycast targets
- highlighted
- shown in service panels
- modified by Full Body or Full Wrap
- modified by any material, colour, texture, chrome, tint, PPF, ceramic, decal, or customization action
- included in saved customer selections

Do not hide, delete, rename, recolour, replace, or reassign materials on them.

Every customer-facing target resolver must explicitly exclude:

```ts
meshName.startsWith("tmp_") || meshName === "tube01"
```

## Material and mesh rules

Use one centralized vehicle-material pipeline and explicit service-to-mesh target maps.

Do not use broad substring matching when it can include unrelated meshes.

Do not mutate shared imported GLTF materials in a way that changes unrelated meshes.

Initial load and Reset must produce the same approved factory-white showroom appearance. Mirror caps, door handles, and the shark-fin antenna are body-coloured and follow Full Body wrap; OEM badges remain excluded.

Detailed rules are in:

- `docs/MATERIAL_SYSTEM.md`
- `docs/VEHICLE_OBJECT_MAP.md`

## Current scope restrictions

Until explicitly changed by the user:

- do not implement Print-ready
- do not begin Quote Web work
- do not add Supabase
- do not add authentication
- do not add email delivery
- do not add payment processing
- do not add customer or admin accounts
- do not add supplier APIs
- do not start Save My Design during a material or default-appearance task unless the current prompt explicitly includes it

## Code quality

- Use TypeScript.
- Keep TypeScript strict.
- Avoid `any`.
- Use clear names.
- Keep components focused.
- Avoid duplicated logic.
- Avoid unnecessary abstraction.
- Preserve responsive behaviour.
- Use accessible semantic HTML for customer-facing UI.
- Do not suppress TypeScript or ESLint errors without explaining why.
- Do not hide runtime warnings that indicate real material, texture, asset, mesh, or renderer problems.
- Do not leave unused experimental files or duplicate active implementations.

## Verification

After every implementation task, run:

```bash
npm run build
npm run lint
```

Run any relevant existing tests.

For tasks involving the 3D vehicle, also verify the result in the running application and inspect the browser console for:

- failed asset or texture requests
- shader or WebGL errors
- duplicate React keys
- invalid material IDs or colour values
- missing mesh names
- target groups resolving to zero or unintended meshes
- unexpected fallback materials
- repeated renderer, texture, material, or event-listener creation

Compilation alone is not sufficient for a visual 3D task.

## Required completion report

At the end of every task, report:

1. Root cause found
2. What changed
3. Every file created
4. Every file modified
5. Every file deleted
6. Every package installed
7. Commands executed
8. Build result
9. Lint result
10. Tests performed
11. Visual states verified
12. Exact target mappings created or changed
13. Assumptions
14. Remaining limitations or unresolved issues

If no files were created, deleted, or packages installed, state that explicitly.

Do not claim success for anything that was not tested.
