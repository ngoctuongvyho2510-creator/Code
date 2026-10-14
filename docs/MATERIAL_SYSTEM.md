# ModifyWrap 3D S4 Demo — Material System Specification

## Purpose

This document defines the persistent architecture and visual rules for all customer-selectable vehicle materials.

The goal is not to patch individual colours. The goal is one predictable system that can render solid, metallic, pearl, chrome, texture, carbon, brushed, rugged, patterned, diamond, and colour-shift materials without conflicting code paths.

## Core model

The real material catalog separates three independent concepts:

1. Material identity and supplier data
2. Surface finish
3. Visual effect and per-SKU visual data

Do not collapse these into one ambiguous `finish` field.

Use types equivalent to:

```ts
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
  recipeOverrides?: Partial<VehicleMaterialRecipe>;
}
```

Adapt names to the existing codebase, but preserve the separation of responsibilities.

## Stable IDs

Never use `displayName` as the unique identifier. Display names can repeat across brands.

Use a stable ID based on brand and manufacturer code, equivalent to:

```ts
`${normalizeBrand(brand)}:${manufacturerCode}`
```

Use this ID for:

- React keys
- selection state
- visual-profile lookup
- material lookup
- texture caching
- saved designs
- future database references
- validation and diagnostic logs

## Visual data policy

Do not infer an exact product colour or effect only from its marketing name.

Supplier/pricing data may identify a material without containing enough information to render it accurately.

When required visual data is missing:

- do not silently fall back to white
- do not invent an exact colour from the display name
- use an obvious development diagnostic material such as magenta
- log the stable material ID, brand, manufacturer code, display name, and affected mesh
- mark the SKU as visually incomplete
- include it in the completion report

## One centralized pipeline

There must be one centralized system containing responsibilities equivalent to:

- material types and catalog model
- surface recipes
- effect recipes
- per-SKU visual profiles
- material factory
- texture manager/cache
- target resolver
- material application function
- default/original material state
- validation

UI components may request a material change but must not independently mutate:

- colour
- roughness
- metalness
- clearcoat
- clearcoat roughness
- maps
- iridescence
- anisotropy
- normal or bump scale
- emissive properties

Full Body and selected-part customization must use the same material factory.

## Factory paint and vinyl wrap are different material classes

The vehicle's initial and Reset state uses a dedicated factory automotive-paint recipe, not a customer vinyl-wrap recipe.

The approved factory baseline is neutral white paint. It must provide:

- realistic automotive clearcoat depth
- controlled sharp reflections
- visible panel curvature and shut lines
- no chalky, hazy, or flat-plastic appearance

Customer-applied wrap materials use separate vinyl recipes for gloss, satin, matte, metallic, chrome, texture, and special effects.

A Full Body wrap applies to approved body panels, mirror caps, all four door handles, and the shark-fin antenna. It must not recolour OEM badges, black trim, true window chrome, glass, lights, wheels, tyres, grilles, brakes, exhaust, or protected geometry.

Do not tune factory paint and vinyl wrap through one shared set of roughness and clearcoat values merely for convenience.

## Composition order

Compose each material in this order:

```text
base vehicle recipe
+ surface recipe
+ effect recipe
+ per-SKU visual profile and approved overrides
```

Equivalent flow:

```ts
const recipe = composeVehicleMaterialRecipe({
  base: BASE_VEHICLE_RECIPE,
  surface: SURFACE_RECIPES[item.surfaceFinish],
  effect: EFFECT_RECIPES[item.effectType],
  sku: visualProfile.recipeOverrides,
});
```

The `other` surface value must not map directly to a generic renderer recipe. Resolve it through the effect type and approved per-SKU profile.

## Starting surface recipes

These are calibration starting points, not immutable values. Keep them centralized and adjust only after verifying the renderer and lighting.

```ts
const SURFACE_RECIPES = {
  high_gloss: {
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
  },
  gloss: {
    roughness: 0.20,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  },
  satin: {
    roughness: 0.40,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
  },
  matte: {
    roughness: 0.66,
    clearcoat: 0.10,
    clearcoatRoughness: 0.50,
  },
  textured: {
    roughness: 0.36,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
  },
} as const;
```

Do not duplicate these values in UI components.

## Effect rules

### Solid

- Preserve the approved base colour.
- Use the selected surface recipe.
- Clear stale flake, texture, iridescence, anisotropy, emissive, and special maps.

### Metallic

Metallic vinyl is not full mirror metal.

- Preserve the selected base hue.
- Combine with high-gloss, gloss, satin, or matte surface response.
- Use a subtle shared cached flake normal or bump texture.
- Avoid visible tiling and excessive glitter.
- Remain visually different from gloss and chrome.
- Do not implement all metallic wraps as `metalness: 1`.

A reasonable starting point for the effect layer is low-to-moderate metalness, approximately `0.15–0.25`, subject to visual calibration.

### Pearl

- Preserve the approved base colour.
- Add a subtle approved pearl tint or response.
- Remain distinct from metallic and colour shift.
- Do not treat pearl as chrome or full metal.

### Chrome

- Use an approved chrome tint.
- Use full metallic environmental reflection.
- Use very low but non-zero roughness.
- Require a valid PMREM environment.
- Do not use emissive colour to make chrome visible.
- Chrome must not appear flat grey, pure white, pure black, or ordinary gloss paint.

### Colour shift

- Require approved primary and secondary colours; use a tertiary colour only where approved.
- Use supported Three.js iridescence properties when available in the installed version.
- Provide a controlled fallback if not supported.
- Do not animate React colour state every frame.
- Avoid uncontrolled rainbow rendering.

### Brushed

- Require an approved directional texture or supported anisotropy implementation.
- Preserve grain direction and SKU tint.
- Do not simulate brushed metal with colour and roughness alone.

### Carbon fiber

- Use one approved reusable weave texture or normal map where possible.
- Preserve correct weave scale.
- Avoid stretching and unintended tinting.
- Remain distinct from rugged and ordinary patterned wrap.

### Rugged

- Use a stronger normal or bump response than standard texture wrap.
- Preserve the SKU tint.
- Avoid displacement strong enough to distort vehicle geometry.

### Patterned

- Require the approved artwork asset.
- Preserve repeat, scale, rotation, and aspect ratio.
- Do not inherit a previous solid colour tint unless explicitly configured.

### Diamond

- Use an approved sparkle/flake profile.
- Remain distinct from standard metallic and pearl.
- Avoid excessive glitter and flicker.

### Special effect

`special_effect` is a catalog classification, not one universal shader.

Each SKU must have an explicit visual profile or a more specific approved internal subtype.

## Texture management

Centralize texture loading and caching.

For albedo/colour/printed textures:

- use the correct sRGB colour space
- use neutral white material colour when original artwork colours must be preserved
- configure wrapping, repeat, centre, rotation, anisotropy, aspect ratio, UV orientation, and `flipY` centrally

For data textures such as normal, roughness, metalness, and bump maps:

- do not treat them as sRGB colour textures
- use the correct channel expectations for the installed Three.js version

When switching categories, explicitly clear stale properties and maps, including as applicable:

- `map`
- `normalMap`
- `bumpMap`
- `roughnessMap`
- `metalnessMap`
- `clearcoatMap`
- `clearcoatNormalMap`
- `emissiveMap`
- `alphaMap`
- `iridescenceMap`
- `anisotropyMap`

Do not recreate the same texture on every render or animation frame.

Dispose generated resources safely without disposing shared cached resources still in use.

## Shared GLTF material safety

Do not mutate an imported material shared by unrelated meshes.

Before customization, clone or create safe materials for intended target meshes.

Support both:

- single materials
- material arrays

Preserve an immutable approved default/original state for Reset.

## Renderer and lighting

Fix colour management and lighting before adjusting individual palette colours.

Inspect:

- output colour space
- tone mapping
- exposure
- environment map and PMREM
- ambient, hemisphere, directional, and spot lights
- background intensity
- bloom and post-processing

Requirements:

- use sRGB output
- use a supported colour-preserving tone-mapping approach for the installed Three.js version
- use a valid PMREM-processed environment
- keep ambient contribution restrained
- use controlled key and fill lighting
- do not use emissive vehicle paint
- do not compensate for scene overexposure by darkening each colour manually

White must remain white while retaining hood curvature, roof curvature, panel lines, reflections, and body definition.

Black must remain black while retaining readable contours and controlled reflections.

Chrome and metallic must be evaluated only with a valid environment.

## Initial appearance and Reset

Initial load and Reset must produce the same approved default showroom state.

Reset must:

- clear Full Body and partial overrides
- clear maps and special-effect properties
- restore approved body, mirror, chrome, black trim, glass, wheel, badge, light, grille, exhaust, and diffuser appearance
- preserve protected `tmp_*` and `tube01` geometry
- not progressively degrade after repeated customize/reset cycles

Do not restore whichever customer material happened to be active immediately before Reset.

## Validation

Validate all selectable material data before application.

Detect:

- missing or duplicate stable IDs
- duplicate React keys
- missing manufacturer codes
- malformed colours
- unsupported surface or effect values
- missing visual profiles
- missing or broken texture paths
- missing colour-shift pairs
- unsupported recipe values
- unintended white fallback

A valid colour should resolve to a six-digit `#RRGGBB` value.

Invalid data must produce a diagnostic fallback and a clear warning; it must never silently become white.

## Development Material Lab

A development-only Material Lab may be added when the current task requests it.

It must use the same material factory, renderer, lighting, environment, recipes, target application code, and texture manager as the real vehicle.

It should test representative cases such as:

- white gloss
- black gloss
- red satin
- silver metallic
- coloured metallic
- silver chrome
- coloured chrome
- pearl
- carbon fiber
- brushed
- patterned texture
- colour shift

Do not create a separate demo shader that can pass while the vehicle remains broken.

## Required visual QA

For a material-system task, test in the actual vehicle UI:

- light, dark, saturated, and neutral colours
- Full Body
- at least one individual panel
- switching repeatedly between solid, metallic, chrome, texture, and colour shift
- Reset
- protected geometry
- browser console and network errors

Do not claim a category works unless it was tested on the actual vehicle.

## Scope

This document governs material rendering only.

During material-system work:

- do not implement Print-ready
- do not start Save My Design unless explicitly included
- do not redesign unrelated UI
- do not begin Quote Web work
