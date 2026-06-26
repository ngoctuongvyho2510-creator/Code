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

export type WrapFinish = 'gloss' | 'satin' | 'matte'

export type WrapConfig = {
  color: string
  finish: WrapFinish
}

export type TintScope = 'this' | 'pair' | 'rear' | 'all'

export type TintScopeOption = {
  id: TintScope
  label: string
}

export type TintConfig = {
  vlt: number
}

export type ChromeDeleteFinish = 'gloss' | 'satin' | 'matte'

export type ChromeDeleteScope = 'this' | 'both' | 'all-chrome'

export type ChromeDeleteScopeOption = {
  id: ChromeDeleteScope
  label: string
}

export type ChromeDeleteConfig = {
  color: string
  finish: ChromeDeleteFinish
}

export type CaliperPaintFinish = 'gloss' | 'satin' | 'matte'

export type CaliperPaintScope = 'this' | 'front' | 'rear' | 'all'

export type CaliperPaintScopeOption = {
  id: CaliperPaintScope
  label: string
}

export type CaliperPaintConfig = {
  color: string
  finish: CaliperPaintFinish
}

export type AppliedServiceState = {
  serviceId: ServiceId
}

export type LayeredSurfaceState = {
  wrap: WrapConfig | null
  tint: TintConfig | null
  chromeDelete: ChromeDeleteConfig | null
  caliperPaint: CaliperPaintConfig | null
  artwork: AppliedServiceState | null
  ppf: AppliedServiceState | null
  ceramic: AppliedServiceState | null
  services: Partial<Record<ServiceId, AppliedServiceState>>
}

export type AppliedDesignState = {
  fullBody: LayeredSurfaceState
  parts: Record<string, LayeredSurfaceState>
}

export type DraftSelectionState = {
  targetId: SelectionTargetId
  serviceId: ServiceId | null
  wrapConfig: WrapConfig | null
  tintConfig: TintConfig | null
  tintScope: TintScope | null
  chromeDeleteConfig: ChromeDeleteConfig | null
  chromeDeleteScope: ChromeDeleteScope | null
  caliperPaintConfig: CaliperPaintConfig | null
  caliperPaintScope: CaliperPaintScope | null
}

export type WrapPreviewState = {
  targetId: SelectionTargetId
  wrap: WrapConfig
}

export type TintPreviewState = {
  targetIds: readonly SelectionTargetId[]
  tint: TintConfig
}

export type ChromeDeletePreviewState = {
  targetIds: readonly SelectionTargetId[]
  chromeDelete: ChromeDeleteConfig
}

export type CaliperPaintPreviewState = {
  targetIds: readonly SelectionTargetId[]
  caliperPaint: CaliperPaintConfig
}
