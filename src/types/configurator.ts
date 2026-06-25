export type ServiceId =
  | 'wrap'
  | 'artwork'
  | 'ppf'
  | 'ceramic'
  | 'chrome-delete'
  | 'tint'
  | 'remove'
  | 'powder-coat'
  | 'caliper-paint'
  | 'performance'

export type SurfaceType =
  | 'painted-body'
  | 'chrome'
  | 'black-trim'
  | 'glass'
  | 'mirror-glass'
  | 'badge'
  | 'grille'
  | 'wheel'
  | 'center-cap'
  | 'caliper'
  | 'brake-disc'
  | 'light'
  | 'exhaust'
  | 'wiper'
  | 'visual-only'

export type PartGroup =
  | 'body'
  | 'chrome'
  | 'trim'
  | 'glass'
  | 'badge'
  | 'grille'
  | 'wheel'
  | 'brake'
  | 'light'
  | 'exhaust'
  | 'wiper'
  | 'visual-only'

export type VehiclePartDefinition = {
  id: string
  label: string
  meshNames: readonly string[]
  selectable: boolean
  visualOnly?: boolean
  fullBody?: boolean
  surfaceType: SurfaceType
  services: readonly ServiceId[]
  group?: PartGroup
}

export type ServiceDefinition = {
  id: ServiceId
  label: string
}

export type SelectionTargetId = string

export type AppliedServiceState = {
  serviceId: ServiceId
}

export type LayeredSurfaceState = {
  wrap?: AppliedServiceState
  artwork?: AppliedServiceState
  ppf?: AppliedServiceState
  ceramic?: AppliedServiceState
  services: Partial<Record<ServiceId, AppliedServiceState>>
}

export type AppliedDesignState = {
  fullBody: LayeredSurfaceState
  parts: Record<string, LayeredSurfaceState>
}

export type DraftSelectionState = {
  targetId: SelectionTargetId
  serviceId: ServiceId | null
}
