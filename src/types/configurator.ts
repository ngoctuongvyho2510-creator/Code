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

export type LightTintScope = 'this' | 'both'

export type LightTintScopeOption = {
  id: LightTintScope
  label: string
}

export type LightTintConfig = {
  darkness: number
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

export type PowderCoatFinish = 'gloss' | 'satin' | 'matte'

export type PowderCoatScope = 'this' | 'front' | 'rear' | 'all'

export type PowderCoatScopeOption = {
  id: PowderCoatScope
  label: string
}

export type PowderCoatConfig = {
  color: string
  finish: PowderCoatFinish
}

export type ArtworkMode = 'place' | 'fill'

export type ArtworkVector3 = readonly [number, number, number]

export type ArtworkPlacement = {
  id: string
  targetPartId: SelectionTargetId
  mode: ArtworkMode
  imageSource: string
  fileName: string
  imageWidth: number
  imageHeight: number
  aspectRatio: number
  position?: ArtworkVector3
  orientation?: ArtworkVector3
  size?: ArtworkVector3
  scale: number
  rotation: number
  offsetX?: number
  offsetY?: number
}

export type ArtworkDraftState = {
  id: string
  targetPartId: SelectionTargetId
  mode: ArtworkMode
  imageSource: string | null
  fileName: string
  imageWidth: number
  imageHeight: number
  aspectRatio: number
  lowResolution: boolean
  error: string | null
  selectedArtworkId: string | null
  position?: ArtworkVector3
  orientation?: ArtworkVector3
  size?: ArtworkVector3
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

export type AppliedServiceState = {
  serviceId: ServiceId
}

export type LayeredSurfaceState = {
  wrap: WrapConfig | null
  tint: TintConfig | null
  lightTint: LightTintConfig | null
  chromeDelete: ChromeDeleteConfig | null
  caliperPaint: CaliperPaintConfig | null
  powderCoat: PowderCoatConfig | null
  artwork: readonly ArtworkPlacement[]
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
  lightTintConfig: LightTintConfig | null
  lightTintScope: LightTintScope | null
  chromeDeleteConfig: ChromeDeleteConfig | null
  chromeDeleteScope: ChromeDeleteScope | null
  caliperPaintConfig: CaliperPaintConfig | null
  caliperPaintScope: CaliperPaintScope | null
  powderCoatConfig: PowderCoatConfig | null
  powderCoatScope: PowderCoatScope | null
  artworkConfig: ArtworkDraftState | null
}

export type WrapPreviewState = {
  targetId: SelectionTargetId
  wrap: WrapConfig
}

export type TintPreviewState = {
  targetIds: readonly SelectionTargetId[]
  tint: TintConfig
}

export type LightTintPreviewState = {
  targetIds: readonly SelectionTargetId[]
  lightTint: LightTintConfig
}

export type ChromeDeletePreviewState = {
  targetIds: readonly SelectionTargetId[]
  chromeDelete: ChromeDeleteConfig
}

export type CaliperPaintPreviewState = {
  targetIds: readonly SelectionTargetId[]
  caliperPaint: CaliperPaintConfig
}

export type PowderCoatPreviewState = {
  targetIds: readonly SelectionTargetId[]
  powderCoat: PowderCoatConfig
}

export type ArtworkPreviewState = {
  targetId: SelectionTargetId
  artwork: ArtworkPlacement
}
