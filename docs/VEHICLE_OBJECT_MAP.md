# ModifyWrap 3D S4 Demo — Vehicle Object Map

## Source and purpose

This map is based on the verified exported Blender object-name list for the Audi S4 model.

Use exact mesh names. Do not rename GLTF objects.

Use explicit target arrays. Do not rely on broad matching such as `includes("WINDOW")`, `includes("TRIM")`, `includes("CHROME")`, or `includes("MIRROR")` for customer-facing services.

## Global exclusions

The following visible geometry is never customer-selectable or customizable:

- every mesh whose name begins with `tmp_`
- `tube01`

Every target resolver must exclude them before any other matching.

## Approved Full Body / exterior body targets

Full Body or Full Wrap may target only the approved exterior wrapable body meshes below unless a future task explicitly changes the list:

- `MW_PANEL_HOOD`
- `MW_PANEL_ROOF`
- `MW_PANEL_TRUNK`
- `MW_PANEL_FRONT_BUMPER`
- `MW_PANEL_REAR_BUMPER`
- `MW_PANEL_FENDER_FL`
- `MW_PANEL_FENDER_FR`
- `MW_PANEL_DOOR_FL`
- `MW_PANEL_DOOR_FR`
- `MW_PANEL_DOOR_RL`
- `MW_PANEL_DOOR_RR`
- `MW_PANEL_FUEL_DOOR_R`
- `MW_PANEL_SIDE_SKIRT_L`
- `MW_PANEL_SIDE_SKIRT_R`
- `MW_SHELL_BODY_SIDE_OUTER_L`
- `MW_SHELL_BODY_SIDE_OUTER_R`
- `MW_PANEL_MIRROR_CAP_L`
- `MW_PANEL_MIRROR_CAP_R`
- `MW_PART_DOOR_HANDLE_FL`
- `MW_PART_DOOR_HANDLE_FR`
- `MW_PART_DOOR_HANDLE_RL`
- `MW_PART_DOOR_HANDLE_RR`
- `MW_PART_SHARK_FIN_ANTENNA`

Mirror caps, door handles, and the shark-fin antenna are approved body-coloured parts. They must match the factory body paint on initial load and Reset, and they must follow a Full Body wrap selection.

## Mirror separation

### Mirror caps

- `MW_PANEL_MIRROR_CAP_L`
- `MW_PANEL_MIRROR_CAP_R`

### Mirror bases — black trim by default

- `MW_TRIM_MIRROR_BASE_L`
- `MW_TRIM_MIRROR_BASE_R`

### Mirror glass — never recolour with cap

- `MW_GLASS_SIDE_MIRROR_L`
- `MW_GLASS_SIDE_MIRROR_R`

### Mirror turn signals — never recolour with cap

- `MW_LIGHT_MIRROR_TURN_SIGNAL_L`
- `MW_LIGHT_MIRROR_TURN_SIGNAL_R`

A mirror-cap action must target only the corresponding cap mesh.

## True side-window chrome

These are the only true silver side-window chrome-strip meshes:

- `MW_TRIM_WINDOW_CHROME_L`
- `MW_TRIM_WINDOW_CHROME_R`

Approved targets:

```ts
windowChromeLeft: ["MW_TRIM_WINDOW_CHROME_L"]
windowChromeRight: ["MW_TRIM_WINDOW_CHROME_R"]
windowChromeBoth: [
  "MW_TRIM_WINDOW_CHROME_L",
  "MW_TRIM_WINDOW_CHROME_R",
]
```

Selecting `Window Chrome Right` must not affect the left side or any surrounding black trim.

## Black window and door trim

These meshes remain black by default and must never be grouped into side-window chrome.

### B-pillars

- `MW_TRIM_B_PILLAR_FL`
- `MW_TRIM_B_PILLAR_FR`
- `MW_TRIM_B_PILLAR_RL`
- `MW_TRIM_B_PILLAR_RR`

### Body-side window frames

- `MW_TRIM_BODY_SIDE_WINDOW_FRAME_FL`
- `MW_TRIM_BODY_SIDE_WINDOW_FRAME_FR`
- `MW_TRIM_BODY_SIDE_WINDOW_FRAME_RL`
- `MW_TRIM_BODY_SIDE_WINDOW_FRAME_RR`

### Door window frames

- `MW_TRIM_DOOR_WINDOW_FRAME_FL`
- `MW_TRIM_DOOR_WINDOW_FRAME_FR`
- `MW_TRIM_DOOR_WINDOW_FRAME_RL`
- `MW_TRIM_DOOR_WINDOW_FRAME_RR`

### Quarter window frames

- `MW_TRIM_QUARTER_WINDOW_FRAME_L`
- `MW_TRIM_QUARTER_WINDOW_FRAME_R`

### Rear door quarter appliques

- `MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RL`
- `MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RR`

### Sail panels

- `MW_TRIM_SAIL_PANEL_L`
- `MW_TRIM_SAIL_PANEL_R`

### Interior quarter-window trim

- `MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RL`
- `MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RR`

### Mirror bases

- `MW_TRIM_MIRROR_BASE_L`
- `MW_TRIM_MIRROR_BASE_R`

## Other trim groups — keep separate

These are not part of side-window chrome.

### Front lower grille chrome

- `MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_01`
- `MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_02`
- `MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_01`
- `MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_02`

### Front grille frame

- `MW_TRIM_GRILLE_FRAME_FRONT`

### Rear diffuser

- `MW_TRIM_REAR_DIFFUSER_CHROME`
- `MW_TRIM_REAR_DIFFUSER_PLASTIC`

### Windshield trim

- `MW_TRIM_WINDSHIELD_COWL`
- `MW_TRIM_WINDSHIELD_SIDE_MOLDING_L`
- `MW_TRIM_WINDSHIELD_SIDE_MOLDING_R`

These require their own explicit service targets if supported.

## Glass — not Full Body targets

- `MW_GLASS_QUARTER_L`
- `MW_GLASS_QUARTER_R`
- `MW_GLASS_REAR`
- `MW_GLASS_REAR_FRIT_BAND`
- `MW_GLASS_SIDE_MIRROR_L`
- `MW_GLASS_SIDE_MIRROR_R`
- `MW_GLASS_WINDOW_FL`
- `MW_GLASS_WINDOW_FR`
- `MW_GLASS_WINDOW_RL`
- `MW_GLASS_WINDOW_RR`
- `MW_GLASS_WINDSHIELD`
- `MW_GLASS_WINDSHIELD_FRIT_BAND`

Glass may be targeted only by an explicitly approved glass or tint service.

Frit bands must remain separate from tintable transparent glass.

## Lights — never Full Body targets

- `MW_LIGHT_FOG_L`
- `MW_LIGHT_FOG_R`
- `MW_LIGHT_HEADLIGHT_L`
- `MW_LIGHT_HEADLIGHT_R`
- `MW_LIGHT_MIRROR_TURN_SIGNAL_L`
- `MW_LIGHT_MIRROR_TURN_SIGNAL_R`
- `MW_LIGHT_TAILLIGHT_OUTER_L`
- `MW_LIGHT_TAILLIGHT_OUTER_R`
- `MW_LIGHT_TAILLIGHT_TRUNK_L`
- `MW_LIGHT_TAILLIGHT_TRUNK_R`

## Badges and emblems — preserve original appearance

- `MW_BADGE_S4_FRONT`
- `MW_BADGE_S4_FRONT_BACKING`
- `MW_BADGE_S4_REAR`
- `MW_BADGE_S4_REAR_BACKING`
- `MW_BADGE_V6T_L`
- `MW_BADGE_V6T_R`
- `MW_EMBLEM_AUDI_CENTER_CAP_FL`
- `MW_EMBLEM_AUDI_CENTER_CAP_FR`
- `MW_EMBLEM_AUDI_CENTER_CAP_RL`
- `MW_EMBLEM_AUDI_CENTER_CAP_RR`
- `MW_EMBLEM_FRONT_AUDI`
- `MW_EMBLEM_REAR_AUDI`

Do not recolour them through body, wrap, chrome-delete, or generic material matching.

## Wheels, tyres, brakes, and centre caps

### Wheels

- `MW_WHEEL_FL`
- `MW_WHEEL_FR`
- `MW_WHEEL_RL`
- `MW_WHEEL_RR`

### Tyres

- `MW_TIRE_FL`
- `MW_TIRE_FR`
- `MW_TIRE_RL`
- `MW_TIRE_RR`

### Brake discs

- `MW_BRAKE_DISC_FL`
- `MW_BRAKE_DISC_FR`
- `MW_BRAKE_DISC_RL`
- `MW_BRAKE_DISC_RR`

### Calipers

- `MW_CALIPER_FL`
- `MW_CALIPER_FR`
- `MW_CALIPER_RL`
- `MW_CALIPER_RR`

### Centre caps

- `MW_PART_CENTER_CAP_FL`
- `MW_PART_CENTER_CAP_FR`
- `MW_PART_CENTER_CAP_RL`
- `MW_PART_CENTER_CAP_RR`

These groups must remain separate. Caliper paint must never affect discs, wheels, tyres, or centre caps.

## Grilles

- `MW_GRILLE_MAIN_FRONT`
- `MW_GRILLE_LOWER_L`
- `MW_GRILLE_LOWER_R`

Do not include them in Full Body.

## Exhaust

- `MW_PART_EXHAUST_TIP_L_INNER`
- `MW_PART_EXHAUST_TIP_L_OUTER`
- `MW_PART_EXHAUST_TIP_R_INNER`
- `MW_PART_EXHAUST_TIP_R_OUTER`

Do not include them in Full Body or chrome-delete unless explicitly targeted by a future approved service.

## Other exterior parts to keep separate

### Door handles

- `MW_PART_DOOR_HANDLE_FL`
- `MW_PART_DOOR_HANDLE_FR`
- `MW_PART_DOOR_HANDLE_RL`
- `MW_PART_DOOR_HANDLE_RR`

### License plates

- `MW_PART_LICENSE_PLATE_FRONT`
- `MW_PART_LICENSE_PLATE_REAR`

### Shark-fin antenna

- `MW_PART_SHARK_FIN_ANTENNA`

### Wipers

- `MW_PART_WIPER_ARM_FRONT_L`
- `MW_PART_WIPER_ARM_FRONT_R`
- `MW_PART_WIPER_BASE_FRONT_L`
- `MW_PART_WIPER_BASE_FRONT_R`
- `MW_PART_WIPER_BLADE_FRONT_L`
- `MW_PART_WIPER_BLADE_FRONT_R`

These are not default Full Body targets.

## Recommended explicit map

Use an exact configuration equivalent to:

```ts
export const VEHICLE_TARGETS = {
  fullBody: [
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

  mirrorCapLeft: ["MW_PANEL_MIRROR_CAP_L"],
  mirrorCapRight: ["MW_PANEL_MIRROR_CAP_R"],

  windowChromeLeft: ["MW_TRIM_WINDOW_CHROME_L"],
  windowChromeRight: ["MW_TRIM_WINDOW_CHROME_R"],

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
    "MW_TRIM_MIRROR_BASE_L",
    "MW_TRIM_MIRROR_BASE_R",
  ],
} as const;
```

Adapt the file location and exported names to the existing architecture, but do not change the exact mesh membership without explicit approval.

## Initial showroom appearance

The approved initial state must be explicit rather than accidental.

Initial load and Reset must match.

The approved factory-fresh initial state is:

- factory white automotive paint across every approved Full Body mesh
- white mirror caps matching the body
- white door handles matching the body
- a white shark-fin antenna matching the body
- black mirror bases
- silver true side-window chrome
- black surrounding window and door trim
- correct glass and frit-band separation
- OEM Audi rings in chrome/silver
- OEM S4 badges preserving their chrome/silver and red/black details
- OEM V6T badges in chrome/silver
- original lights, wheels, tyres, grille, exhaust, and diffuser
- visible unchanged protected geometry

The factory paint recipe is separate from customer-selected vinyl-wrap recipes. White paint must remain visibly white while preserving hood, roof, trunk, bumper, mirror-cap, handle, and shark-fin contours.

## Selection and validation rules

For every target action:

1. Resolve exact mesh names.
2. Exclude `tmp_*` and `tube01`.
3. Warn when an expected mesh is missing.
4. Warn when a target group resolves to zero meshes.
5. Warn when a target group resolves to a mesh outside its approved list.
6. Support both single materials and material arrays.
7. Prevent shared-material mutation from affecting unrelated meshes.

## Reset rules

Reset must restore the approved default state for every group, not whichever material was most recently active.

Repeated customize/reset cycles must match a fresh page load.

Verify at minimum:

- body
- mirror caps and bases
- left and right side-window chrome independently
- black window trim
- glass
- protected geometry
