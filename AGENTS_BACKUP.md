# ModifyWrap 3D S4 Demo — Codex Instructions

## Project identity

This repository is the frontend for the ModifyWrap 3D S4 Demo.

It contains the interactive 3D Audi S4 configurator and its related customer-facing interface.

The current project completion order is:

1. Repair and validate the complete vehicle material system
2. Complete Save My Design
3. Refine the final website appearance
4. Perform final responsive and production checks
5. Freeze the 3D website
6. Move to the separate Quote Web project

Print-ready production export is postponed.

Do not implement Print-ready unless the user explicitly requests it in a future task.

Do not begin Quote Web work inside this repository unless explicitly instructed.

Build the project incrementally.

Do not attempt unrelated product features in one task.

---

## Current technology

Use the technology and packages already installed in this repository, including the existing 3D rendering stack.

The project currently uses technologies including:

- Vite
- React
- TypeScript
- Three.js
- ESLint
- CSS

Do not replace the existing 3D rendering stack.

Do not install additional packages unless the user explicitly approves them.

Before proposing a new package:

1. Inspect the currently installed dependencies
2. Determine whether the task can be completed using the existing stack
3. Explain why the new package would be necessary

---

## Repository rules

1. Only modify files required for the current task.
2. Do not rename existing files or folders unless explicitly instructed.
3. Do not delete files unless explicitly instructed.
4. Do not move files unless explicitly instructed.
5. Do not replace the overall application architecture.
6. A focused internal refactor is allowed only when the current task explicitly requires it, such as centralizing duplicated material logic.
7. Do not add a backend, database, authentication system, payment system, email provider, or external API unless explicitly requested.
8. Do not add placeholder business features that were not requested.
9. Do not replace working code merely for stylistic preference.
10. Keep every task reviewable and reversible.
11. Do not redesign unrelated interface areas while fixing 3D behavior.
12. Do not silently alter approved customer-facing behavior.
13. Inspect existing implementation before creating new files or systems.
14. Reuse existing working utilities and components when appropriate.
15. Do not create duplicate systems that perform the same responsibility.
16. Do not begin unrelated work after completing the requested task.

---

## Protected user asset names

The following names were selected by the user and must not be changed:

- ModifyWrap 3D S4 Demo
- Assets
- Code
- S4 UV
- Mahir S4
- Logo
- Favicon 40
- Favicon 48
- Favicon 64
- Favicon 180
- Favicon 512

Files inside the `S4 UV` folder must retain their original names.

Preserve all existing:

- folder names
- file names
- asset names
- mesh names
- imports
- public paths
- capitalization
- extension casing

Do not reorganize assets merely for preference.

Do not change any existing path unless the current path is confirmed to be broken and the change is required to repair it.

---

## Branding and fonts

Use the Super Sliced font only for the:

- `MODIFYWRAP 3D STUDIO` branding
- main studio title where already approved

Preserve the exact existing font file names.

Use:

- `Super Sliced.woff2` as the primary web font
- `Super Sliced.woff` as the fallback

Do not apply Super Sliced to:

- general interface text
- buttons
- descriptions
- service panels
- forms
- material names
- customer instructions

Do not replace the approved brand logo or favicon assets.

---

## Protected GLTF geometry

Objects whose names begin with `tmp_` and the object named `tube01` are visible visual-only geometry.

They must remain visible in the rendered vehicle.

They must never be:

- customer-selectable
- included in customer raycast selection
- highlighted
- shown in service panels
- modified by Full Body
- modified by Full Wrap
- modified by partial wrap
- modified by chrome delete
- modified by metallic finishes
- modified by texture finishes
- modified by special finishes
- modified by paint protection film
- modified by ceramic coating
- modified by window tint
- modified by decals
- included in saved customer customization selections
- included in customer-facing part lists
- included through broad mesh-name matching

Do not:

- hide them
- delete them
- rename them
- recolour them
- replace their geometry
- replace their materials
- include them in customizable target groups

These objects belong to the non-service internal geometry group.

Any target resolver must explicitly exclude:

```ts
meshName.startsWith("tmp_")

and:

meshName === "tube01"
Verified mirror object separation

Mirror caps and mirror bases are separate targets.

Mirror cap meshes
MW_PANEL_MIRROR_CAP_L
MW_PANEL_MIRROR_CAP_R
Mirror base meshes
MW_TRIM_MIRROR_BASE_L
MW_TRIM_MIRROR_BASE_R

Do not merge mirror caps and mirror bases into one target.

A mirror-cap service may modify only the appropriate mirror-cap mesh.

A mirror-base mesh must retain its own default black trim appearance unless a future explicitly approved service targets it.

The mirror glass is also separate and must not be recoloured with the mirror cap:

MW_GLASS_SIDE_MIRROR_L
MW_GLASS_SIDE_MIRROR_R

Mirror turn signal lights must remain separate and unchanged:

MW_LIGHT_MIRROR_TURN_SIGNAL_L
MW_LIGHT_MIRROR_TURN_SIGNAL_R

Do not use broad matching such as:

meshName.includes("MIRROR")

for a mirror-cap service.

Use explicit target names.

Verified window chrome separation

The true silver window chrome strip consists only of:

MW_TRIM_WINDOW_CHROME_L
MW_TRIM_WINDOW_CHROME_R

A left window chrome target must contain only:

MW_TRIM_WINDOW_CHROME_L

A right window chrome target must contain only:

MW_TRIM_WINDOW_CHROME_R

Do not include any other mesh in the silver window chrome group.

Do not use broad substring matching such as:

meshName.includes("WINDOW")
meshName.includes("TRIM")
meshName.includes("FRAME")
meshName.includes("CHROME")

when resolving window chrome targets.

Use explicit target maps.

Selecting Window Chrome Right must affect only:

MW_TRIM_WINDOW_CHROME_R

Selecting Window Chrome Left must affect only:

MW_TRIM_WINDOW_CHROME_L
Black window and door trim

All surrounding non-chrome window and door trim must remain black by default.

These meshes must not be included in the silver window chrome group.

B-pillars
MW_TRIM_B_PILLAR_FL
MW_TRIM_B_PILLAR_FR
MW_TRIM_B_PILLAR_RL
MW_TRIM_B_PILLAR_RR
Body-side window frames
MW_TRIM_BODY_SIDE_WINDOW_FRAME_FL
MW_TRIM_BODY_SIDE_WINDOW_FRAME_FR
MW_TRIM_BODY_SIDE_WINDOW_FRAME_RL
MW_TRIM_BODY_SIDE_WINDOW_FRAME_RR
Door window frames
MW_TRIM_DOOR_WINDOW_FRAME_FL
MW_TRIM_DOOR_WINDOW_FRAME_FR
MW_TRIM_DOOR_WINDOW_FRAME_RL
MW_TRIM_DOOR_WINDOW_FRAME_RR
Quarter window frames
MW_TRIM_QUARTER_WINDOW_FRAME_L
MW_TRIM_QUARTER_WINDOW_FRAME_R
Rear door quarter appliques
MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RL
MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RR
Sail panels
MW_TRIM_SAIL_PANEL_L
MW_TRIM_SAIL_PANEL_R
Mirror bases
MW_TRIM_MIRROR_BASE_L
MW_TRIM_MIRROR_BASE_R
Interior rear door quarter window trim
MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RL
MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RR

These black trim meshes must remain separate from the silver chrome meshes.

Do not merge all window-related meshes into one service target.

Other trim groups must remain separate

The following trim objects are not part of the side window chrome group and must not be affected by a window chrome service.

Front lower grille chrome
MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_01
MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_02
MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_01
MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_02
Front grille frame
MW_TRIM_GRILLE_FRAME_FRONT
Rear diffuser chrome
MW_TRIM_REAR_DIFFUSER_CHROME
Rear diffuser plastic
MW_TRIM_REAR_DIFFUSER_PLASTIC
Windshield trim
MW_TRIM_WINDSHIELD_COWL
MW_TRIM_WINDSHIELD_SIDE_MOLDING_L
MW_TRIM_WINDSHIELD_SIDE_MOLDING_R

These objects require their own explicit target groups if they are supported by a future service.

Do not include them through general chrome or trim matching.

Default showroom appearance

The vehicle must have one explicit, centralized default showroom appearance.

Do not rely only on accidental material states imported from the GLTF file.

Initial load and Reset must produce the same approved appearance.

The default appearance must explicitly preserve:

consistent body appearance
matching body panels
correct mirror-cap appearance
black mirror bases
silver true window chrome
black surrounding window and door trim
correct glass appearance
correct wheels and tyres
original badges and lights
protected visual-only geometry
correct grille appearance
correct exhaust appearance
correct diffuser appearance

The following body parts must have a visually consistent default body appearance:

MW_PANEL_HOOD
MW_PANEL_ROOF
MW_PANEL_TRUNK
MW_PANEL_FRONT_BUMPER
MW_PANEL_REAR_BUMPER
MW_PANEL_FENDER_FL
MW_PANEL_FENDER_FR
MW_PANEL_DOOR_FL
MW_PANEL_DOOR_FR
MW_PANEL_DOOR_RL
MW_PANEL_DOOR_RR
MW_PANEL_FUEL_DOOR_R
MW_PANEL_SIDE_SKIRT_L
MW_PANEL_SIDE_SKIRT_R
MW_SHELL_BODY_SIDE_OUTER_L
MW_SHELL_BODY_SIDE_OUTER_R

Mirror caps must use their approved default appearance:

MW_PANEL_MIRROR_CAP_L
MW_PANEL_MIRROR_CAP_R

The roof, hood, trunk, doors, fenders, bumpers, body shells, side skirts, and mirror caps must not become unintentionally washed out because of inconsistent material assignment.

Do not allow the roof or hood to appear white, faded, pale, or overexposed compared with the other body panels unless the selected customer design explicitly requires that result.

Reset must restore the approved default configuration rather than restoring whichever modified material happened to exist earlier in the session.

Default appearance configuration

Implement the approved initial showroom state through a centralized configuration.

The configuration must define explicit groups equivalent to:

const DEFAULT_SHOWROOM_TARGETS = {
  body: [
    "MW_PANEL_HOOD",
    "MW_PANEL_ROOF",
    "MW_PANEL_TRUNK",
    "MW_PANEL_FRONT_BUMPER",
    "MW_PANEL_REAR_BUMPER",
    "MW_PANEL_FENDER_FL",
    "MW_PANEL_FENDER_FR",
    "MW_PANEL_DOOR_FL",
    "MW_PANEL_DOOR_FR",
    "MW_PANEL_DOOR_RL",
    "MW_PANEL_DOOR_RR",
    "MW_PANEL_FUEL_DOOR_R",
    "MW_PANEL_SIDE_SKIRT_L",
    "MW_PANEL_SIDE_SKIRT_R",
    "MW_SHELL_BODY_SIDE_OUTER_L",
    "MW_SHELL_BODY_SIDE_OUTER_R",
  ],

  mirrorCaps: [
    "MW_PANEL_MIRROR_CAP_L",
    "MW_PANEL_MIRROR_CAP_R",
  ],

  mirrorBases: [
    "MW_TRIM_MIRROR_BASE_L",
    "MW_TRIM_MIRROR_BASE_R",
  ],

  windowChrome: [
    "MW_TRIM_WINDOW_CHROME_L",
    "MW_TRIM_WINDOW_CHROME_R",
  ],

  blackWindowTrim: [
    "MW_TRIM_B_PILLAR_FL",
    "MW_TRIM_B_PILLAR_FR",
    "MW_TRIM_B_PILLAR_RL",
    "MW_TRIM_B_PILLAR_RR",
    "MW_TRIM_BODY_SIDE_WINDOW_FRAME_FL",
    "MW_TRIM_BODY_SIDE_WINDOW_FRAME_FR",
    "MW_TRIM_BODY_SIDE_WINDOW_FRAME_RL",
    "MW_TRIM_BODY_SIDE_WINDOW_FRAME_RR",
    "MW_TRIM_DOOR_WINDOW_FRAME_FL",
    "MW_TRIM_DOOR_WINDOW_FRAME_FR",
    "MW_TRIM_DOOR_WINDOW_FRAME_RL",
    "MW_TRIM_DOOR_WINDOW_FRAME_RR",
    "MW_TRIM_QUARTER_WINDOW_FRAME_L",
    "MW_TRIM_QUARTER_WINDOW_FRAME_R",
    "MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RL",
    "MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RR",
    "MW_TRIM_SAIL_PANEL_L",
    "MW_TRIM_SAIL_PANEL_R",
  ],
} as const;

The implementation may use existing project naming and file structure, but the group separation must remain explicit.

Do not infer these groups from broad mesh-name patterns.

Material catalog architecture

The real ModifyWrap material catalog separates:

surface finish
effect type
per-SKU visual data

Do not collapse all three concepts into one finish field.

Supported catalog surface classifications include:

high_gloss
gloss
satin
matte
textured
other

Supported catalog effect classifications include:

solid
metallic
pearl
color_shift
special_effect
chrome
brushed
carbon_fiber
rugged
patterned
diamond

A rendered catalog material must be composed from:

a surface recipe
an effect recipe
a per-SKU visual profile

Example:

Matte Red Metallic

surface_finish = matte
effect_type = metallic

It must use both:

the matte surface response
the metallic effect response

Do not force it to be only matte or only metallic.

The other catalog value must not be used directly as a renderer finish.

Resolve other using:

the effect type
the approved per-SKU visual profile
Material catalog model

Use a typed model equivalent to:

type SurfaceFinish =
  | "high_gloss"
  | "gloss"
  | "satin"
  | "matte"
  | "textured"
  | "other";

type EffectType =
  | "solid"
  | "metallic"
  | "pearl"
  | "color_shift"
  | "special_effect"
  | "chrome"
  | "brushed"
  | "carbon_fiber"
  | "rugged"
  | "patterned"
  | "diamond";

interface MaterialCatalogItem {
  id: string;
  brand: string;
  series: string;
  manufacturerCode: string;
  displayName: string;
  surfaceFinish: SurfaceFinish;
  effectType: EffectType;
  widthInches?: number;
  supplierSku?: string;
}

interface MaterialVisualProfile {
  materialId: string;

  baseColorHex: string;
  secondaryColorHex?: string;
  tertiaryColorHex?: string;

  albedoMapUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  flakeMapUrl?: string;

  textureRepeat?: [number, number];
  textureRotation?: number;
  normalScale?: number;
  bumpScale?: number;
  flakeScale?: number;
  flakeStrength?: number;

  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];

  anisotropy?: number;
  anisotropyRotation?: number;

  recipeOverrides?: Record<string, unknown>;
}

Adapt the exact typing to the existing codebase while preserving this separation of responsibilities.

Do not use one ambiguous field for:

colour
surface finish
visual effect
texture
supplier identity
Material identity

Do not use displayName as the unique material identifier.

Display names may be duplicated across brands.

Use a stable ID based on brand and manufacturer code, equivalent to:

function createMaterialId(
  brand: string,
  manufacturerCode: string,
): string {
  return `${normalizeBrand(brand)}:${manufacturerCode}`;
}

Examples:

3m:G12
avery-dennison:SW900-190-O

Use the stable material ID for:

React keys
selected material state
material lookup
texture lookup
visual-profile lookup
saved designs
future database references
validation reports
diagnostic warnings

Do not use array indexes as permanent material identifiers.

Visual material data

Do not infer exact product colours only from product names.

A pricing or supplier catalog may identify a material without containing sufficient data to render it accurately.

Per-SKU visual profiles may contain:

base colour
secondary colour
tertiary colour
texture maps
normal maps
roughness maps
metalness maps
flake settings
texture scale
texture direction
iridescence settings
approved recipe overrides

When required visual data is missing:

do not silently render the material as white
do not invent an exact colour from its product name
use an obvious development diagnostic fallback such as magenta
log the stable material ID
log the brand
log the manufacturer code
log the display name
mark the material as visually incomplete
include the missing material in the final completion report

Do not claim that the complete catalog works while materials are silently using fallback data.

Palette validation

Validate selectable material data before applying it to the vehicle.

Validation must detect:

missing IDs
duplicate IDs
duplicate React keys
missing manufacturer codes
malformed hexadecimal colours
missing visual profiles
unsupported surface finishes
unsupported effect types
missing texture assets
invalid texture paths
missing color-shift secondary colours
unsupported recipe values
empty labels
accidental white fallbacks

A valid hexadecimal colour must resolve to a six-digit value equivalent to:

#RRGGBB

Do not silently convert invalid data to white.

During development, invalid visual data must produce:

an obvious diagnostic material
a clear console warning
the affected material ID
the affected mesh name where available
Centralized material pipeline

There must be one centralized vehicle-material pipeline.

Do not create independent material-changing logic inside multiple:

React components
click handlers
Full Body handlers
Full Wrap handlers
part-selection handlers
colour panels
finish panels
texture panels
reset handlers
animation loops

All supported vehicle finishes must use:

one typed material-selection model
one centralized material factory
one target-mesh resolver
one texture manager
one original-material/default-material system
one application function for assigning vehicle materials

UI components may request a material change but must not independently mutate:

roughness
metalness
clearcoat
clearcoat roughness
texture maps
iridescence
anisotropy
emissive properties
environment intensity
normal scale
bump scale

Do not duplicate finish recipes across UI components.

Material composition

Compose a material from:

base vehicle recipe
+
surface recipe
+
effect recipe
+
per-SKU visual profile

Use a composition flow equivalent to:

const recipe = composeVehicleMaterialRecipe({
  base: BASE_VEHICLE_RECIPE,
  surface: SURFACE_RECIPES[item.surfaceFinish],
  effect: EFFECT_RECIPES[item.effectType],
  sku: visualProfile.recipeOverrides,
});

Then apply:

base colour
secondary and tertiary colours where supported
maps
texture transforms
normal scales
bump scales
flake properties
iridescence properties
anisotropy properties

No UI component may separately modify the returned material after the centralized material factory creates it, except through an explicitly centralized update API.

Material assignment safety

Do not mutate an imported GLTF material that is shared by unrelated meshes.

Clone or create customer-facing materials safely for customizable meshes.

Support:

meshes with one material
meshes with material arrays

Preserve the approved original/default material state for Reset.

Do not allow Full Body and selected-part material logic to overwrite one another accidentally.

Do not create materials:

every React render
every animation frame
every camera movement
repeatedly for the same cached selection without reason

Dispose replaced generated resources safely.

Do not dispose shared cached assets while they are still in use.

Texture rules

Centralize texture loading and caching.

For colour or printed textures:

use the correct sRGB colour space
use neutral white material colour when original texture colours must be preserved
configure wrapping centrally
configure repeat centrally
configure rotation centrally
configure centre centrally
configure anisotropy centrally
verify UV orientation
verify flipY
preserve aspect ratio where required
do not recreate the same texture for every application

For data textures such as:

normal maps
roughness maps
metalness maps
bump maps

do not treat them as sRGB colour textures.

When changing material categories, explicitly clear stale maps and properties that do not belong to the new material.

Examples:

texture to solid must clear texture maps
carbon fiber to gloss must clear carbon weave maps
chrome to matte must clear chrome metallic properties
color shift to solid must clear iridescence
brushed to solid must clear directional maps or anisotropy
patterned to metallic must clear the previous pattern map
metallic to solid must clear metallic flake maps where applicable

Do not leave an old map attached after switching categories.

Do not use a previously selected solid colour to unintentionally tint a printed texture.

Surface recipes

Create centralized surface recipes for:

high_gloss
gloss
satin
matte
textured

Surface recipes primarily control:

roughness
clearcoat
clearcoat roughness
reflection sharpness
surface diffusion

A surface recipe must not independently decide whether a material is:

metallic
pearl
chrome
color shift
brushed
carbon fiber
patterned
diamond

high_gloss must have its own supported recipe.

It must not fall through to an unknown or default white material.

The other surface value must be resolved using effect type and SKU visual data.

Effect recipes

Create centralized effect recipes for:

solid
metallic
pearl
color_shift
chrome
brushed
carbon_fiber
rugged
patterned
diamond

The catalog value special_effect must not use one universal visual recipe.

Each special_effect material must have:

an explicit per-SKU mapping
or a more specific approved internal subtype

Do not apply one arbitrary rainbow or iridescent effect to all special materials.

Solid behavior

Solid materials must:

preserve the approved base colour
use the selected surface recipe
contain no metallic flake unless explicitly configured
contain no stale iridescence
contain no stale texture maps
contain no stale anisotropy
remain visually distinct across gloss, satin, matte, and high-gloss surfaces
Metallic behavior

Metallic wrap must not be implemented only as:

metalness: 1

Metallic wrap must:

retain its approved base colour
combine with its surface finish
use subtle reusable flake detail
remain visually distinct from gloss
remain visually distinct from chrome
avoid excessive glitter
avoid visible texture tiling
retain its colour under the approved lighting environment
remain readable in both light and dark colours

Gloss metallic, satin metallic, matte metallic, and high-gloss metallic must share the metallic effect system while preserving their different surface responses.

Use one cached metallic flake asset or procedural texture where appropriate.

Do not create a separate flake texture for every colour.

Do not use full mirror-like metalness for vinyl metallic unless a specific approved profile requires it.

Pearl behavior

Pearl materials must:

preserve the approved base colour
use a subtle pearlescent response
remain visually distinct from metallic
remain visually distinct from color shift
combine with the material’s surface recipe
avoid turning every highlight into a rainbow
use approved per-SKU pearl tint or intensity where required

Do not treat pearl as full chrome or full metal.

Chrome behavior

Chrome must:

use a valid environment reflection
use full metallic response
use very low but non-zero roughness
retain an approved chrome tint
reflect vehicle shape and studio surroundings
remain visually distinct from gloss
remain visually distinct from metallic
preserve panel contours

Do not use emissive colour to make chrome visible.

Chrome must not render as:

flat grey
pure white
pure black
ordinary gloss paint
transparent glass

Chrome depends on a valid environment and must not be evaluated without one.

Color-shift behavior

Color-shift materials must:

use approved primary and secondary colours
use a tertiary colour only where approved
preserve the selected surface recipe
visibly shift as camera or reflection angle changes
avoid changing React state every animation frame
avoid turning the entire vehicle into an uncontrolled rainbow
use supported Three.js iridescence properties where available
provide a controlled fallback if the installed Three.js version does not support the intended property

Do not infer exact shift colours only from the material name.

Brushed behavior

Brushed materials must:

use an approved directional texture or supported anisotropy implementation
preserve directional grain
use the approved SKU tint
maintain consistent direction where possible
avoid looking like flat solid paint
avoid excessive texture stretching

Do not simulate brushed material using only a colour and roughness value.

Carbon-fiber behavior

Carbon-fiber materials must:

use a reusable approved carbon weave texture or normal map
preserve appropriate weave scale
avoid excessive stretching
support approved black, anthracite, or white tints
remain distinct from ordinary patterned wrap
remain distinct from rugged texture

Do not create a different carbon weave asset for every colour unless explicitly required.

Rugged behavior

Rugged materials must:

use a stronger surface normal or bump response than standard texture materials
preserve the approved base tint
remain distinct from carbon fiber
remain distinct from brushed metal
avoid looking like ordinary matte paint
avoid excessive displacement that distorts body shape
Patterned behavior

Patterned materials must:

use the approved pattern asset
preserve pattern repeat and scale
preserve approved rotation
avoid inheriting an unintended previous colour tint
remain consistently scaled across appropriate panels
clear the pattern map when switching to a non-pattern material

Do not invent missing pattern artwork.

Diamond behavior

Diamond materials must:

use a specific approved sparkle or flake profile
remain distinct from standard metallic
remain distinct from pearl
use the approved SKU tint
avoid excessive glitter
avoid random flickering
not fall through from surface_finish = other to a white material
Rendering and colour management

Lighting, environment, exposure, output colour space, tone mapping, and post-processing must be calibrated before adjusting individual palette colours.

Do not compensate for an overexposed scene by manually darkening every palette colour.

White must remain white while retaining:

panel contours
shut lines
reflections
surface curvature
hood definition
roof definition
bumper definition

Black must remain black while retaining:

readable body shape
controlled reflections
panel separation
visible surface curvature

Do not use emissive vehicle paint to make colours visible.

Do not introduce duplicate or excessive lights.

Use renderer and environment APIs supported by the currently installed Three.js version.

Inspect the installed Three.js version before using version-dependent properties such as:

iridescence
anisotropy
environment intensity
NeutralToneMapping

Do not blindly copy APIs from a different Three.js version.

Lighting and environment

The 3D vehicle must use one predictable product-visualization lighting setup.

Inspect all existing:

ambient lights
hemisphere lights
directional lights
spotlights
environment maps
background intensity
tone mapping
exposure
bloom
post-processing

Remove duplicated or excessive lighting only when confirmed to be causing the rendering problem.

Use a valid PMREM-processed environment for physically based materials.

Use the existing HDR environment if it is valid.

If the existing environment is missing or invalid, use an approved built-in or project-supported studio environment without adding a new package.

Keep ambient contribution restrained.

Use controlled key and fill lighting.

Do not individually change each palette colour to compensate for lighting errors.

Selection and target resolution

Use explicit service-to-mesh target maps.

Do not select service groups solely through broad substring matching when object names have different meanings.

Selection logic must exclude:

protected tmp_* geometry
tube01
unintended glass
lights
badges
wheels
tyres
brake discs
interior geometry
mechanical geometry
unrelated trim
unrelated chrome parts

unless the current explicitly approved service targets those parts.

Full Body or Full Wrap must target only approved exterior wrapable body panels.

It must not recolour:

window chrome
black trim
glass
lights
badges
grille
tyres
wheels
exhaust
brake discs
protected geometry

unless explicitly approved.

Full Body and selected-part behavior

Full Body and selected-part customization must use the same centralized material factory.

They may use different target lists, but they must not use separate material-rendering implementations.

Full Body must not overwrite explicitly protected trim or non-body geometry.

A selected-part override must affect only its approved mesh target.

A later React effect must not silently overwrite the most recent valid material selection.

Prevent:

stale selections
competing effects
delayed material overwrite
Full Body and part selections fighting each other
old texture maps remaining after a solid selection
old special effects remaining after a normal selection
material flicker during selection
Reset behavior

Reset must restore the exact approved default showroom state.

Reset must:

clear customer wrap selections
clear texture maps
clear special-effect properties
clear Full Body state
clear partial-panel overrides
restore chrome and black trim separation
restore mirror cap and mirror base separation
restore approved body materials
restore approved glass materials
preserve protected geometry
not progressively degrade materials after repeated resets
return to the same appearance as a fresh initial load

Repeated customize/reset cycles must produce the same result as a fresh initial load.

Test repeated cycles involving:

solid gloss
metallic
chrome
texture
color shift
reset

Reset must not restore whichever customer material happened to be active immediately before the reset.

Material Lab

A development-only Material Lab may be added when explicitly requested by the current task.

It must not clutter the production customer interface.

The Material Lab must use the same:

material factory
surface recipes
effect recipes
renderer
lighting
environment
texture manager

as the real vehicle.

Do not create a separate demo shader that can pass while the actual vehicle remains broken.

When included, Material Lab should test representative materials such as:

white gloss
black gloss
red satin
silver metallic
coloured metallic
silver chrome
coloured chrome
carbon fiber
brushed
one patterned texture
one color-shift material
React lifecycle and resource management

Audit effects and dependencies carefully.

Prevent:

infinite effects
duplicate event listeners
duplicate renderers
duplicate canvases
material creation every render
material creation every animation frame
repeated texture loading
repeated environment generation
stale material selections
race conditions during GLTF loading
material updates before target meshes exist
material updates being overwritten by later effects

Use memoization and centralized resource lifetime management where appropriate.

Clean up:

event listeners
generated materials
generated textures
renderer resources
controls
animation frames

without disposing shared resources that are still in use.

Current scope restrictions

Until explicitly changed by the user:

do not implement Print-ready
do not begin Quote Web work
do not redesign unrelated UI
do not add backend services
do not add authentication
do not add email delivery
do not add Supabase
do not add payment processing
do not add customer accounts
do not add admin accounts
do not add supplier APIs

Complete the current requested task and stop.

Save My Design must not be started during a material or default-appearance repair task unless explicitly included in that task.

Code quality
Use TypeScript.
Keep TypeScript strict.
Avoid any.
Use clear and descriptive names.
Keep components focused.
Avoid duplicated logic.
Avoid unnecessary abstraction.
Use accessible semantic HTML.
Preserve responsive behavior.
Do not suppress TypeScript errors without explaining why.
Do not suppress ESLint errors without explaining why.
Do not hide runtime warnings that indicate real material, texture, asset, or renderer problems.
Do not leave commented-out replacement implementations unless required for a documented reason.
Do not leave unused experimental files.
Do not create temporary duplicate components and leave both active.
Verification

After every implementation task, run:

npm run build
npm run lint

Also run any relevant existing tests.

For changes involving:

the 3D vehicle
materials
target meshes
lighting
textures
Reset
initial appearance

also verify the result in the running application.

Inspect the browser console for:

failed asset requests
failed texture requests
shader errors
WebGL errors
duplicate React keys
invalid material IDs
invalid colour warnings
unexpected fallback materials
repeated resource creation
missing mesh names
target groups resolving to zero meshes
target groups resolving to unintended meshes

A task is not complete merely because compilation succeeds.

Required visual verification

For default-appearance and target-group tasks, verify:

The car loads with the approved default showroom appearance.
The hood does not appear abnormally white or washed out.
The roof does not appear abnormally white or washed out.
Body panels have a visually consistent appearance.
Mirror caps are separate from mirror bases.
Mirror glass is not recoloured with mirror caps.
Only the true window chrome strips are silver.
Black window and door trim remains black.
Window Chrome Left affects only MW_TRIM_WINDOW_CHROME_L.
Window Chrome Right affects only MW_TRIM_WINDOW_CHROME_R.
Reset returns to the same state as initial load.
Protected tmp_* and tube01 geometry remains visible and unchanged.

For material-system tasks, verify representative:

light colours
dark colours
saturated colours
neutral colours
solid finishes
metallic finishes
pearl finishes
chrome finishes
texture finishes
color-shift finishes
Reset behavior
Full Body behavior
individual-panel behavior

Do not claim that a material category works unless it was tested in the actual vehicle UI.

Required completion report

At the end of every task, report:

Root cause found
What was changed
Every file created
Every file modified
Every file deleted
Every package installed
Commands executed
Build result
Lint result
Tests performed
Visual states verified
Exact target-group mappings created or changed
Assumptions
Remaining limitations or unresolved issues

If no files were created, deleted, or packages installed, explicitly state that.

Do not claim success for anything that was not tested.

Do not begin unrelated work after completing the requested task.