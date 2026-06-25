import type {
  PartGroup,
  ServiceId,
  SurfaceType,
  TintScope,
  TintScopeOption,
  VehiclePartDefinition,
} from '../types/configurator'

export const FULL_BODY_TARGET_ID = 'full-body'

export const LICENSE_PLATE_MESH_NAMES = [
  'MW_PART_LICENSE_PLATE_FRONT',
  'MW_PART_LICENSE_PLATE_REAR',
] as const

const PAINTED_BODY_SERVICES = [
  'wrap',
  'artwork',
  'ppf',
  'ceramic',
] as const satisfies readonly ServiceId[]

const CHROME_SERVICES = [
  'chrome-delete',
  'ppf',
  'ceramic',
] as const satisfies readonly ServiceId[]

const TRIM_SERVICES = [
  'wrap',
  'ppf',
  'ceramic',
] as const satisfies readonly ServiceId[]

const GLASS_SERVICES = ['tint', 'ceramic'] as const satisfies readonly ServiceId[]
const BADGE_SERVICES = ['wrap', 'remove'] as const satisfies readonly ServiceId[]
const GRILLE_SERVICES = ['wrap', 'ppf', 'ceramic'] as const satisfies readonly ServiceId[]
const WHEEL_SERVICES = ['powder-coat', 'ceramic'] as const satisfies readonly ServiceId[]
const CENTER_CAP_SERVICES = ['wrap'] as const satisfies readonly ServiceId[]
const CALIPER_SERVICES = ['caliper-paint'] as const satisfies readonly ServiceId[]
const BRAKE_DISC_SERVICES = ['performance'] as const satisfies readonly ServiceId[]
const LAMP_SERVICES = ['ppf', 'ceramic'] as const satisfies readonly ServiceId[]
const SIGNAL_SERVICES = ['ppf'] as const satisfies readonly ServiceId[]
const EXHAUST_SERVICES = ['powder-coat', 'ceramic'] as const satisfies readonly ServiceId[]
const WIPER_SERVICES = ['wrap'] as const satisfies readonly ServiceId[]

export const TINTABLE_GLASS_PART_IDS = [
  'windshield',
  'front-window-left',
  'front-window-right',
  'rear-window-left',
  'rear-window-right',
  'quarter-glass-left',
  'quarter-glass-right',
  'rear-glass',
] as const

const FRONT_SIDE_TINT_PART_IDS = [
  'front-window-left',
  'front-window-right',
] as const

const REAR_SIDE_TINT_PART_IDS = [
  'rear-window-left',
  'rear-window-right',
] as const

const QUARTER_TINT_PART_IDS = [
  'quarter-glass-left',
  'quarter-glass-right',
] as const

const REAR_TINT_PART_IDS = [
  ...REAR_SIDE_TINT_PART_IDS,
  ...QUARTER_TINT_PART_IDS,
  'rear-glass',
] as const

const tintScopeLabels = {
  this: 'This',
  pair: 'Pair',
  rear: 'Rear',
  all: 'All',
} as const satisfies Record<TintScope, string>

const tintScopesByPartId = {
  windshield: ['this', 'all'],
  'front-window-left': ['this', 'pair', 'all'],
  'front-window-right': ['this', 'pair', 'all'],
  'rear-window-left': ['this', 'pair', 'rear', 'all'],
  'rear-window-right': ['this', 'pair', 'rear', 'all'],
  'quarter-glass-left': ['this', 'pair', 'rear', 'all'],
  'quarter-glass-right': ['this', 'pair', 'rear', 'all'],
  'rear-glass': ['this', 'rear', 'all'],
} as const satisfies Record<
  (typeof TINTABLE_GLASS_PART_IDS)[number],
  readonly TintScope[]
>

const tintPairPartIdsByPartId = {
  'front-window-left': FRONT_SIDE_TINT_PART_IDS,
  'front-window-right': FRONT_SIDE_TINT_PART_IDS,
  'rear-window-left': REAR_SIDE_TINT_PART_IDS,
  'rear-window-right': REAR_SIDE_TINT_PART_IDS,
  'quarter-glass-left': QUARTER_TINT_PART_IDS,
  'quarter-glass-right': QUARTER_TINT_PART_IDS,
} as const satisfies Partial<
  Record<(typeof TINTABLE_GLASS_PART_IDS)[number], readonly string[]>
>

export const FULL_BODY_MESH_NAMES = [
  'MW_SHELL_BODY_SIDE_OUTER_L',
  'MW_SHELL_BODY_SIDE_OUTER_R',
  'MW_PANEL_FRONT_BUMPER',
  'MW_PANEL_REAR_BUMPER',
  'MW_PANEL_HOOD',
  'MW_PANEL_ROOF',
  'MW_PANEL_TRUNK',
  'MW_PANEL_DOOR_FL',
  'MW_PANEL_DOOR_FR',
  'MW_PANEL_DOOR_RL',
  'MW_PANEL_DOOR_RR',
  'MW_PANEL_FENDER_FL',
  'MW_PANEL_FENDER_FR',
  'MW_PANEL_SIDE_SKIRT_L',
  'MW_PANEL_SIDE_SKIRT_R',
  'MW_PANEL_FUEL_DOOR_R',
  'MW_PANEL_MIRROR_CAP_L',
  'MW_PANEL_MIRROR_CAP_R',
  'MW_PART_DOOR_HANDLE_FL',
  'MW_PART_DOOR_HANDLE_FR',
  'MW_PART_DOOR_HANDLE_RL',
  'MW_PART_DOOR_HANDLE_RR',
  'MW_PART_SHARK_FIN_ANTENNA',
] as const

const fullBodyMeshSet = new Set<string>(FULL_BODY_MESH_NAMES)

function vehiclePart(
  id: string,
  label: string,
  meshNames: readonly string[],
  surfaceType: SurfaceType,
  services: readonly ServiceId[],
  group: PartGroup,
  selectable = true,
): VehiclePartDefinition {
  return {
    id,
    label,
    meshNames,
    selectable,
    visualOnly: !selectable,
    fullBody: meshNames.some((meshName) => fullBodyMeshSet.has(meshName)),
    surfaceType,
    services,
    group,
  }
}

export const FULL_BODY_TARGET: VehiclePartDefinition = {
  id: FULL_BODY_TARGET_ID,
  label: 'Full Body',
  meshNames: FULL_BODY_MESH_NAMES,
  selectable: true,
  fullBody: true,
  surfaceType: 'painted-body',
  services: PAINTED_BODY_SERVICES,
  group: 'body',
}

export const VEHICLE_PARTS = [
  vehiclePart('body-side-left', 'Body Side L', ['MW_SHELL_BODY_SIDE_OUTER_L'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('body-side-right', 'Body Side R', ['MW_SHELL_BODY_SIDE_OUTER_R'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('front-bumper', 'Front Bumper', ['MW_PANEL_FRONT_BUMPER'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('rear-bumper', 'Rear Bumper', ['MW_PANEL_REAR_BUMPER'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('hood', 'Hood', ['MW_PANEL_HOOD'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('roof', 'Roof', ['MW_PANEL_ROOF'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('trunk', 'Trunk', ['MW_PANEL_TRUNK'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-front-left', 'Door FL', ['MW_PANEL_DOOR_FL'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-front-right', 'Door FR', ['MW_PANEL_DOOR_FR'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-rear-left', 'Door RL', ['MW_PANEL_DOOR_RL'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-rear-right', 'Door RR', ['MW_PANEL_DOOR_RR'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('fender-front-left', 'Fender FL', ['MW_PANEL_FENDER_FL'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('fender-front-right', 'Fender FR', ['MW_PANEL_FENDER_FR'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('side-skirt-left', 'Side Skirt L', ['MW_PANEL_SIDE_SKIRT_L'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('side-skirt-right', 'Side Skirt R', ['MW_PANEL_SIDE_SKIRT_R'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('fuel-door', 'Fuel Door', ['MW_PANEL_FUEL_DOOR_R'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('mirror-cap-left', 'Mirror Cap L', ['MW_PANEL_MIRROR_CAP_L'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('mirror-cap-right', 'Mirror Cap R', ['MW_PANEL_MIRROR_CAP_R'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-handle-front-left', 'Handle FL', ['MW_PART_DOOR_HANDLE_FL'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-handle-front-right', 'Handle FR', ['MW_PART_DOOR_HANDLE_FR'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-handle-rear-left', 'Handle RL', ['MW_PART_DOOR_HANDLE_RL'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('door-handle-rear-right', 'Handle RR', ['MW_PART_DOOR_HANDLE_RR'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),
  vehiclePart('shark-fin', 'Shark Fin', ['MW_PART_SHARK_FIN_ANTENNA'], 'painted-body', PAINTED_BODY_SERVICES, 'body'),

  vehiclePart('window-chrome-left', 'Chrome L', ['MW_TRIM_WINDOW_CHROME_L'], 'chrome', CHROME_SERVICES, 'chrome'),
  vehiclePart('window-chrome-right', 'Chrome R', ['MW_TRIM_WINDOW_CHROME_R'], 'chrome', CHROME_SERVICES, 'chrome'),
  vehiclePart('grille-frame', 'Grille Trim', ['MW_TRIM_GRILLE_FRAME_FRONT'], 'chrome', CHROME_SERVICES, 'chrome'),
  vehiclePart('lower-chrome-left', 'Lower Chrome L', ['MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_01', 'MW_TRIM_FRONT_LOWER_GRILLE_CHROME_L_02'], 'chrome', CHROME_SERVICES, 'chrome'),
  vehiclePart('lower-chrome-right', 'Lower Chrome R', ['MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_01', 'MW_TRIM_FRONT_LOWER_GRILLE_CHROME_R_02'], 'chrome', CHROME_SERVICES, 'chrome'),
  vehiclePart('rear-diffuser-chrome', 'Diffuser Chrome', ['MW_TRIM_REAR_DIFFUSER_CHROME'], 'chrome', CHROME_SERVICES, 'chrome'),

  vehiclePart('b-pillars-left', 'B Pillar L', ['MW_TRIM_B_PILLAR_FL', 'MW_TRIM_B_PILLAR_RL'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('b-pillars-right', 'B Pillar R', ['MW_TRIM_B_PILLAR_FR', 'MW_TRIM_B_PILLAR_RR'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('body-window-frame-left', 'Window Frame L', ['MW_TRIM_BODY_SIDE_WINDOW_FRAME_FL', 'MW_TRIM_BODY_SIDE_WINDOW_FRAME_RL'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('body-window-frame-right', 'Window Frame R', ['MW_TRIM_BODY_SIDE_WINDOW_FRAME_FR', 'MW_TRIM_BODY_SIDE_WINDOW_FRAME_RR'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('door-window-frame-left', 'Door Frame L', ['MW_TRIM_DOOR_WINDOW_FRAME_FL', 'MW_TRIM_DOOR_WINDOW_FRAME_RL'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('door-window-frame-right', 'Door Frame R', ['MW_TRIM_DOOR_WINDOW_FRAME_FR', 'MW_TRIM_DOOR_WINDOW_FRAME_RR'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('mirror-base-left', 'Mirror Base L', ['MW_TRIM_MIRROR_BASE_L'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('mirror-base-right', 'Mirror Base R', ['MW_TRIM_MIRROR_BASE_R'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('quarter-frame-left', 'Quarter Frame L', ['MW_TRIM_QUARTER_WINDOW_FRAME_L'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('quarter-frame-right', 'Quarter Frame R', ['MW_TRIM_QUARTER_WINDOW_FRAME_R'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('rear-diffuser', 'Diffuser', ['MW_TRIM_REAR_DIFFUSER_PLASTIC'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('rear-applique-left', 'Applique L', ['MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RL'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('rear-applique-right', 'Applique R', ['MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RR'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('sail-panel-left', 'Sail Panel L', ['MW_TRIM_SAIL_PANEL_L'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('sail-panel-right', 'Sail Panel R', ['MW_TRIM_SAIL_PANEL_R'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('cowl', 'Cowl', ['MW_TRIM_WINDSHIELD_COWL'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('windshield-molding-left', 'Molding L', ['MW_TRIM_WINDSHIELD_SIDE_MOLDING_L'], 'black-trim', TRIM_SERVICES, 'trim'),
  vehiclePart('windshield-molding-right', 'Molding R', ['MW_TRIM_WINDSHIELD_SIDE_MOLDING_R'], 'black-trim', TRIM_SERVICES, 'trim'),

  vehiclePart('windshield', 'Windshield', ['MW_GLASS_WINDSHIELD'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('rear-glass', 'Rear Glass', ['MW_GLASS_REAR'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('front-window-left', 'Window FL', ['MW_GLASS_WINDOW_FL'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('front-window-right', 'Window FR', ['MW_GLASS_WINDOW_FR'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('rear-window-left', 'Window RL', ['MW_GLASS_WINDOW_RL'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('rear-window-right', 'Window RR', ['MW_GLASS_WINDOW_RR'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('quarter-glass-left', 'Quarter Glass L', ['MW_GLASS_QUARTER_L'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('quarter-glass-right', 'Quarter Glass R', ['MW_GLASS_QUARTER_R'], 'glass', GLASS_SERVICES, 'glass'),
  vehiclePart('mirror-glass-left', 'Mirror Glass L', ['MW_GLASS_SIDE_MIRROR_L'], 'mirror-glass', ['ceramic'], 'glass'),
  vehiclePart('mirror-glass-right', 'Mirror Glass R', ['MW_GLASS_SIDE_MIRROR_R'], 'mirror-glass', ['ceramic'], 'glass'),

  vehiclePart('s4-badge-front', 'S4 Front', ['MW_BADGE_S4_FRONT', 'MW_BADGE_S4_FRONT_BACKING'], 'badge', BADGE_SERVICES, 'badge'),
  vehiclePart('s4-badge-rear', 'S4 Rear', ['MW_BADGE_S4_REAR', 'MW_BADGE_S4_REAR_BACKING'], 'badge', BADGE_SERVICES, 'badge'),
  vehiclePart('v6t-badge-left', 'V6T L', ['MW_BADGE_V6T_L'], 'badge', BADGE_SERVICES, 'badge'),
  vehiclePart('v6t-badge-right', 'V6T R', ['MW_BADGE_V6T_R'], 'badge', BADGE_SERVICES, 'badge'),
  vehiclePart('audi-emblem-front', 'Audi Front', ['MW_EMBLEM_FRONT_AUDI'], 'badge', BADGE_SERVICES, 'badge'),
  vehiclePart('audi-emblem-rear', 'Audi Rear', ['MW_EMBLEM_REAR_AUDI'], 'badge', BADGE_SERVICES, 'badge'),

  vehiclePart('main-grille', 'Main Grille', ['MW_GRILLE_MAIN_FRONT'], 'grille', GRILLE_SERVICES, 'grille'),
  vehiclePart('lower-grille-left', 'Lower Grille L', ['MW_GRILLE_LOWER_L'], 'grille', GRILLE_SERVICES, 'grille'),
  vehiclePart('lower-grille-right', 'Lower Grille R', ['MW_GRILLE_LOWER_R'], 'grille', GRILLE_SERVICES, 'grille'),

  vehiclePart('wheel-front-left', 'Wheel FL', ['MW_WHEEL_FL'], 'wheel', WHEEL_SERVICES, 'wheel'),
  vehiclePart('wheel-front-right', 'Wheel FR', ['MW_WHEEL_FR'], 'wheel', WHEEL_SERVICES, 'wheel'),
  vehiclePart('wheel-rear-left', 'Wheel RL', ['MW_WHEEL_RL'], 'wheel', WHEEL_SERVICES, 'wheel'),
  vehiclePart('wheel-rear-right', 'Wheel RR', ['MW_WHEEL_RR'], 'wheel', WHEEL_SERVICES, 'wheel'),
  vehiclePart('center-cap-front-left', 'Center Cap FL', ['MW_PART_CENTER_CAP_FL', 'MW_EMBLEM_AUDI_CENTER_CAP_FL'], 'center-cap', CENTER_CAP_SERVICES, 'wheel'),
  vehiclePart('center-cap-front-right', 'Center Cap FR', ['MW_PART_CENTER_CAP_FR', 'MW_EMBLEM_AUDI_CENTER_CAP_FR'], 'center-cap', CENTER_CAP_SERVICES, 'wheel'),
  vehiclePart('center-cap-rear-left', 'Center Cap RL', ['MW_PART_CENTER_CAP_RL', 'MW_EMBLEM_AUDI_CENTER_CAP_RL'], 'center-cap', CENTER_CAP_SERVICES, 'wheel'),
  vehiclePart('center-cap-rear-right', 'Center Cap RR', ['MW_PART_CENTER_CAP_RR', 'MW_EMBLEM_AUDI_CENTER_CAP_RR'], 'center-cap', CENTER_CAP_SERVICES, 'wheel'),

  vehiclePart('caliper-front-left', 'Caliper FL', ['MW_CALIPER_FL'], 'caliper', CALIPER_SERVICES, 'brake'),
  vehiclePart('caliper-front-right', 'Caliper FR', ['MW_CALIPER_FR'], 'caliper', CALIPER_SERVICES, 'brake'),
  vehiclePart('caliper-rear-left', 'Caliper RL', ['MW_CALIPER_RL'], 'caliper', CALIPER_SERVICES, 'brake'),
  vehiclePart('caliper-rear-right', 'Caliper RR', ['MW_CALIPER_RR'], 'caliper', CALIPER_SERVICES, 'brake'),
  vehiclePart('brake-disc-front-left', 'Disc FL', ['MW_BRAKE_DISC_FL'], 'brake-disc', BRAKE_DISC_SERVICES, 'brake'),
  vehiclePart('brake-disc-front-right', 'Disc FR', ['MW_BRAKE_DISC_FR'], 'brake-disc', BRAKE_DISC_SERVICES, 'brake'),
  vehiclePart('brake-disc-rear-left', 'Disc RL', ['MW_BRAKE_DISC_RL'], 'brake-disc', BRAKE_DISC_SERVICES, 'brake'),
  vehiclePart('brake-disc-rear-right', 'Disc RR', ['MW_BRAKE_DISC_RR'], 'brake-disc', BRAKE_DISC_SERVICES, 'brake'),

  vehiclePart('headlight-left', 'Headlight L', ['MW_LIGHT_HEADLIGHT_L'], 'light', LAMP_SERVICES, 'light'),
  vehiclePart('headlight-right', 'Headlight R', ['MW_LIGHT_HEADLIGHT_R'], 'light', LAMP_SERVICES, 'light'),
  vehiclePart('taillight-left', 'Taillight L', ['MW_LIGHT_TAILLIGHT_OUTER_L', 'MW_LIGHT_TAILLIGHT_TRUNK_L'], 'light', LAMP_SERVICES, 'light'),
  vehiclePart('taillight-right', 'Taillight R', ['MW_LIGHT_TAILLIGHT_OUTER_R', 'MW_LIGHT_TAILLIGHT_TRUNK_R'], 'light', LAMP_SERVICES, 'light'),
  vehiclePart('fog-light-left', 'Fog L', ['MW_LIGHT_FOG_L'], 'light', SIGNAL_SERVICES, 'light'),
  vehiclePart('fog-light-right', 'Fog R', ['MW_LIGHT_FOG_R'], 'light', SIGNAL_SERVICES, 'light'),
  vehiclePart('mirror-signal-left', 'Signal L', ['MW_LIGHT_MIRROR_TURN_SIGNAL_L'], 'light', SIGNAL_SERVICES, 'light'),
  vehiclePart('mirror-signal-right', 'Signal R', ['MW_LIGHT_MIRROR_TURN_SIGNAL_R'], 'light', SIGNAL_SERVICES, 'light'),

  vehiclePart('exhaust-left', 'Exhaust L', ['MW_PART_EXHAUST_TIP_L_INNER', 'MW_PART_EXHAUST_TIP_L_OUTER'], 'exhaust', EXHAUST_SERVICES, 'exhaust'),
  vehiclePart('exhaust-right', 'Exhaust R', ['MW_PART_EXHAUST_TIP_R_INNER', 'MW_PART_EXHAUST_TIP_R_OUTER'], 'exhaust', EXHAUST_SERVICES, 'exhaust'),

  vehiclePart('wiper-arm-left', 'Wiper Arm L', ['MW_PART_WIPER_ARM_FRONT_L', 'MW_PART_WIPER_BASE_FRONT_L'], 'wiper', WIPER_SERVICES, 'wiper'),
  vehiclePart('wiper-arm-right', 'Wiper Arm R', ['MW_PART_WIPER_ARM_FRONT_R', 'MW_PART_WIPER_BASE_FRONT_R'], 'wiper', WIPER_SERVICES, 'wiper'),

  vehiclePart('windshield-frit', 'Windshield Frit', ['MW_GLASS_WINDSHIELD_FRIT_BAND'], 'visual-only', [], 'visual-only', false),
  vehiclePart('rear-frit', 'Rear Frit', ['MW_GLASS_REAR_FRIT_BAND'], 'visual-only', [], 'visual-only', false),
  vehiclePart('plates', 'Plates', LICENSE_PLATE_MESH_NAMES, 'visual-only', [], 'visual-only', false),
  vehiclePart('tires', 'Tires', ['MW_TIRE_FL', 'MW_TIRE_FR', 'MW_TIRE_RL', 'MW_TIRE_RR'], 'visual-only', [], 'visual-only', false),
  vehiclePart('wiper-blades', 'Wiper Blades', ['MW_PART_WIPER_BLADE_FRONT_L', 'MW_PART_WIPER_BLADE_FRONT_R'], 'visual-only', [], 'visual-only', false),
  vehiclePart('interior-quarter-trim', 'Interior Trim', ['MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RL', 'MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RR'], 'visual-only', [], 'visual-only', false),
] as const satisfies readonly VehiclePartDefinition[]

const partById = new Map<string, VehiclePartDefinition>(
  VEHICLE_PARTS.map((part) => [part.id, part]),
)

const partByMeshName = new Map<string, VehiclePartDefinition>()

for (const part of VEHICLE_PARTS) {
  for (const meshName of part.meshNames) {
    partByMeshName.set(meshName, part)
  }
}

export const FULL_BODY_PART_IDS = VEHICLE_PARTS.filter(
  (part) => part.fullBody && part.selectable && part.services.includes('wrap'),
).map((part) => part.id)

export const WRAP_CAPABLE_MESH_NAMES = VEHICLE_PARTS.filter(
  (part) => part.selectable && !part.visualOnly && part.services.includes('wrap'),
).flatMap((part) => part.meshNames)

export const TINTABLE_GLASS_MESH_NAMES = TINTABLE_GLASS_PART_IDS.flatMap(
  (partId) => partById.get(partId)?.meshNames ?? [],
)

export function isTintableGlassTarget(targetId: string): boolean {
  return TINTABLE_GLASS_PART_IDS.includes(
    targetId as (typeof TINTABLE_GLASS_PART_IDS)[number],
  )
}

export function getDefaultTintScope(targetId: string): TintScope | null {
  return getTintScopeOptions(targetId)[0]?.id ?? null
}

export function getTintScopeOptions(targetId: string): readonly TintScopeOption[] {
  if (!isTintableGlassTarget(targetId)) {
    return []
  }

  const partId = targetId as (typeof TINTABLE_GLASS_PART_IDS)[number]

  return tintScopesByPartId[partId].map((scope) => ({
    id: scope,
    label: tintScopeLabels[scope],
  }))
}

export function resolveTintScopeTargetIds(
  targetId: string,
  scope: TintScope,
): readonly string[] {
  if (!isTintableGlassTarget(targetId)) {
    return []
  }

  const validScopes = tintScopesByPartId[
    targetId as (typeof TINTABLE_GLASS_PART_IDS)[number]
  ]

  if (!(validScopes as readonly TintScope[]).includes(scope)) {
    return []
  }

  if (scope === 'this') {
    return [targetId]
  }

  if (scope === 'all') {
    return TINTABLE_GLASS_PART_IDS
  }

  if (scope === 'rear') {
    return REAR_TINT_PART_IDS
  }

  const pairIds =
    tintPairPartIdsByPartId[
      targetId as keyof typeof tintPairPartIdsByPartId
    ]

  return pairIds ?? []
}

export function isVisualOnlyMeshName(meshName: string): boolean {
  return meshName.startsWith('tmp_') || meshName === 'tube01'
}

export function getSelectionTarget(targetId: string): VehiclePartDefinition | null {
  if (targetId === FULL_BODY_TARGET_ID) {
    return FULL_BODY_TARGET
  }

  return partById.get(targetId) ?? null
}

export function getSelectablePartByMeshName(
  meshName: string,
): VehiclePartDefinition | null {
  if (isVisualOnlyMeshName(meshName)) {
    return null
  }

  const part = partByMeshName.get(meshName)

  if (!part?.selectable || part.visualOnly) {
    return null
  }

  return part
}
