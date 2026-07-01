import {
  FULL_BODY_PART_IDS,
  FULL_BODY_TARGET_ID,
  getDefaultCaliperPaintScope,
  getDefaultChromeDeleteScope,
  getDefaultLightTintScope,
  getDefaultPpfScope,
  getDefaultPowderCoatScope,
  getDefaultTintScope,
  getSelectionTarget,
  isArtworkTarget,
  isPpfTarget,
  resolveCaliperPaintScopeTargetIds,
  resolveChromeDeleteScopeTargetIds,
  resolveLightTintScopeTargetIds,
  resolvePpfScopeTargetIds,
  resolvePowderCoatScopeTargetIds,
  resolveTintScopeTargetIds,
} from '../config/vehicleParts'
import type {
  AppliedDesignState,
  ArtworkDraftState,
  ArtworkMode,
  ArtworkPlacement,
  ArtworkVector3,
  ArtworkVector4,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintScope,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  DraftSelectionState,
  FreeArtworkDraftState,
  FreeArtworkItem,
  LayeredSurfaceState,
  LightTintConfig,
  LightTintScope,
  PpfConfig,
  PpfFinish,
  PpfScope,
  PowderCoatConfig,
  PowderCoatFinish,
  PowderCoatScope,
  SelectionTargetId,
  ServiceId,
  TintConfig,
  TintScope,
  WrapConfig,
  WrapFinish,
} from '../types/configurator'

const DEFAULT_WRAP_CONFIG: WrapConfig = {
  color: '#c49d59',
  finish: 'gloss',
}

const DEFAULT_TINT_CONFIG: TintConfig = {
  vlt: 35,
}

const DEFAULT_LIGHT_TINT_CONFIG: LightTintConfig = {
  darkness: 25,
}

const DEFAULT_CHROME_DELETE_CONFIG: ChromeDeleteConfig = {
  color: '#050505',
  finish: 'gloss',
}

const DEFAULT_CALIPER_PAINT_CONFIG: CaliperPaintConfig = {
  color: '#d51f28',
  finish: 'gloss',
}

const DEFAULT_POWDER_COAT_CONFIG: PowderCoatConfig = {
  color: '#2d3135',
  finish: 'satin',
}

const DEFAULT_PPF_CONFIG: PpfConfig = {
  finish: 'gloss',
}

const DEFAULT_ARTWORK_PLACE_SIZE = 0.68
const DEFAULT_ARTWORK_FILL_SCALE = 1
const DEFAULT_ARTWORK_ASPECT_RATIO = 1
const DEFAULT_FREE_ARTWORK_SCALE = 1.05
const DEFAULT_FREE_ARTWORK_POSITION: ArtworkVector3 = [0, 0, 0]
const DEFAULT_FREE_ARTWORK_QUATERNION: ArtworkVector4 = [0, 0, 0, 1]
let artworkIdCounter = 0
let freeArtworkIdCounter = 0

export type ConfiguratorState = {
  appliedDesign: AppliedDesignState
  draftSelection: DraftSelectionState | null
}

export type ConfiguratorAction =
  | {
      type: 'select-target'
      targetId: SelectionTargetId
    }
  | {
      type: 'select-service'
      serviceId: ServiceId
    }
  | {
      type: 'update-wrap-draft'
      patch: Partial<WrapConfig>
    }
  | {
      type: 'update-tint-draft'
      patch: Partial<TintConfig>
    }
  | {
      type: 'update-tint-scope'
      scope: TintScope
    }
  | {
      type: 'update-light-tint-draft'
      patch: Partial<LightTintConfig>
    }
  | {
      type: 'update-light-tint-scope'
      scope: LightTintScope
    }
  | {
      type: 'update-chrome-delete-draft'
      patch: Partial<ChromeDeleteConfig>
    }
  | {
      type: 'update-chrome-delete-scope'
      scope: ChromeDeleteScope
    }
  | {
      type: 'update-caliper-paint-draft'
      patch: Partial<CaliperPaintConfig>
    }
  | {
      type: 'update-caliper-paint-scope'
      scope: CaliperPaintScope
    }
  | {
      type: 'update-powder-coat-draft'
      patch: Partial<PowderCoatConfig>
    }
  | {
      type: 'update-powder-coat-scope'
      scope: PowderCoatScope
    }
  | {
      type: 'update-ppf-draft'
      patch: Partial<PpfConfig>
    }
  | {
      type: 'update-ppf-scope'
      scope: PpfScope
    }
  | {
      type: 'update-artwork-draft'
      patch: Partial<ArtworkDraftState>
    }
  | {
      type: 'update-free-artwork-upload'
      patch: Partial<FreeArtworkDraftState>
    }
  | {
      type: 'add-free-artwork'
    }
  | {
      type: 'select-free-artwork'
      artworkId: string
    }
  | {
      type: 'update-free-artwork-item'
      artworkId: string
      patch: Partial<FreeArtworkItem>
    }
  | {
      type: 'duplicate-free-artwork'
      artworkId: string
    }
  | {
      type: 'delete-free-artwork'
      artworkId: string
    }
  | {
      type: 'delete-all-free-artwork'
    }
  | {
      type: 'clear-service'
    }
  | {
      type: 'cancel-draft'
    }
  | {
      type: 'apply-draft'
    }
  | {
      type: 'apply-wrap-all'
    }
  | {
      type: 'apply-ppf-all'
    }
  | {
      type: 'reset-wrap'
      targetId: SelectionTargetId
    }
  | {
      type: 'reset-tint'
      targetId: SelectionTargetId
      scope: TintScope
    }
  | {
      type: 'reset-light-tint'
      targetId: SelectionTargetId
      scope: LightTintScope
    }
  | {
      type: 'reset-chrome-delete'
      targetId: SelectionTargetId
      scope: ChromeDeleteScope
    }
  | {
      type: 'reset-caliper-paint'
      targetId: SelectionTargetId
      scope: CaliperPaintScope
    }
  | {
      type: 'reset-powder-coat'
      targetId: SelectionTargetId
      scope: PowderCoatScope
    }
  | {
      type: 'reset-ppf'
      targetId: SelectionTargetId
    }
  | {
      type: 'remove-artwork'
      targetId: SelectionTargetId
      artworkId: string
    }
  | {
      type: 'remove-all-artwork'
      targetId: SelectionTargetId
    }
  | {
      type: 'reset-all-wraps'
    }
  | {
      type: 'reset-all-ppf'
    }

function createLayeredSurfaceState(): LayeredSurfaceState {
  return {
    wrap: null,
    tint: null,
    lightTint: null,
    chromeDelete: null,
    caliperPaint: null,
    powderCoat: null,
    artwork: [],
    ppf: null,
    ceramic: null,
    services: {},
  }
}

function applyServiceToSurface(
  surfaceState: LayeredSurfaceState,
  serviceId: ServiceId,
): LayeredSurfaceState {
  const appliedService = { serviceId }

  if (serviceId === 'wrap') {
    return {
      ...surfaceState,
      wrap: DEFAULT_WRAP_CONFIG,
    }
  }

  if (serviceId === 'tint') {
    return {
      ...surfaceState,
      tint: DEFAULT_TINT_CONFIG,
    }
  }

  if (serviceId === 'chrome-delete') {
    return {
      ...surfaceState,
      chromeDelete: DEFAULT_CHROME_DELETE_CONFIG,
    }
  }

  if (serviceId === 'caliper-paint') {
    return {
      ...surfaceState,
      caliperPaint: DEFAULT_CALIPER_PAINT_CONFIG,
    }
  }

  if (serviceId === 'powder-coat') {
    return {
      ...surfaceState,
      powderCoat: DEFAULT_POWDER_COAT_CONFIG,
    }
  }

  if (serviceId === 'ppf') {
    return {
      ...surfaceState,
      ppf: DEFAULT_PPF_CONFIG,
    }
  }

  if (serviceId === 'ceramic') {
    return {
      ...surfaceState,
      ceramic: appliedService,
    }
  }

  return {
    ...surfaceState,
    services: {
      ...surfaceState.services,
      [serviceId]: appliedService,
    },
  }
}

function setWrapOnSurface(
  surfaceState: LayeredSurfaceState,
  wrapConfig: WrapConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: wrapConfig,
  }
}

function clearWrapFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: null,
  }
}

function setTintOnSurface(
  surfaceState: LayeredSurfaceState,
  tintConfig: TintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: tintConfig,
  }
}

function clearTintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: null,
  }
}

function setLightTintOnSurface(
  surfaceState: LayeredSurfaceState,
  lightTintConfig: LightTintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    lightTint: lightTintConfig,
  }
}

function clearLightTintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    lightTint: null,
  }
}

function setChromeDeleteOnSurface(
  surfaceState: LayeredSurfaceState,
  chromeDeleteConfig: ChromeDeleteConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: chromeDeleteConfig,
  }
}

function clearChromeDeleteFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: null,
  }
}

function setCaliperPaintOnSurface(
  surfaceState: LayeredSurfaceState,
  caliperPaintConfig: CaliperPaintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    caliperPaint: caliperPaintConfig,
  }
}

function clearCaliperPaintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    caliperPaint: null,
  }
}

function setPowderCoatOnSurface(
  surfaceState: LayeredSurfaceState,
  powderCoatConfig: PowderCoatConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    powderCoat: powderCoatConfig,
  }
}

function clearPowderCoatFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    powderCoat: null,
  }
}

function setPpfOnSurface(
  surfaceState: LayeredSurfaceState,
  ppfConfig: PpfConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    ppf: ppfConfig,
  }
}

function clearPpfFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    ppf: null,
  }
}

function appendArtworkToSurface(
  surfaceState: LayeredSurfaceState,
  artwork: ArtworkPlacement,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    artwork: [...surfaceState.artwork, artwork],
  }
}

function removeArtworkFromSurface(
  surfaceState: LayeredSurfaceState,
  artworkId: string,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    artwork: surfaceState.artwork.filter((artwork) => artwork.id !== artworkId),
  }
}

function clearArtworkFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    artwork: [],
  }
}

function getAppliedWrapForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig | null {
  if (targetId === FULL_BODY_TARGET_ID) {
    return appliedDesign.fullBody.wrap
  }

  const target = getSelectionTarget(targetId)
  const partWrap = appliedDesign.parts[targetId]?.wrap ?? null

  if (partWrap) {
    return partWrap
  }

  if (target?.fullBody) {
    return appliedDesign.fullBody.wrap
  }

  return null
}

function createWrapDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig {
  return getAppliedWrapForTarget(appliedDesign, targetId) ?? DEFAULT_WRAP_CONFIG
}

function getAppliedTintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig | null {
  return appliedDesign.parts[targetId]?.tint ?? null
}

function createTintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig {
  return getAppliedTintForTarget(appliedDesign, targetId) ?? DEFAULT_TINT_CONFIG
}

function getAppliedLightTintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): LightTintConfig | null {
  return appliedDesign.parts[targetId]?.lightTint ?? null
}

function createLightTintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): LightTintConfig {
  return (
    getAppliedLightTintForTarget(appliedDesign, targetId) ??
    DEFAULT_LIGHT_TINT_CONFIG
  )
}

function getAppliedChromeDeleteForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig | null {
  return appliedDesign.parts[targetId]?.chromeDelete ?? null
}

function createChromeDeleteDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig {
  return (
    getAppliedChromeDeleteForTarget(appliedDesign, targetId) ??
    DEFAULT_CHROME_DELETE_CONFIG
  )
}

function getAppliedCaliperPaintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): CaliperPaintConfig | null {
  return appliedDesign.parts[targetId]?.caliperPaint ?? null
}

function createCaliperPaintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): CaliperPaintConfig {
  return (
    getAppliedCaliperPaintForTarget(appliedDesign, targetId) ??
    DEFAULT_CALIPER_PAINT_CONFIG
  )
}

function getAppliedPowderCoatForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PowderCoatConfig | null {
  return appliedDesign.parts[targetId]?.powderCoat ?? null
}

function createPowderCoatDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PowderCoatConfig {
  return (
    getAppliedPowderCoatForTarget(appliedDesign, targetId) ??
    DEFAULT_POWDER_COAT_CONFIG
  )
}

function getAppliedPpfForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PpfConfig | null {
  if (targetId === FULL_BODY_TARGET_ID) {
    return appliedDesign.fullBody.ppf
  }

  const target = getSelectionTarget(targetId)
  const partPpf = appliedDesign.parts[targetId]?.ppf ?? null

  if (partPpf) {
    return partPpf
  }

  if (target?.fullBody) {
    return appliedDesign.fullBody.ppf
  }

  return null
}

function createPpfDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PpfConfig | null {
  if (!isPpfTarget(targetId)) {
    return null
  }

  return getAppliedPpfForTarget(appliedDesign, targetId) ?? DEFAULT_PPF_CONFIG
}

function createArtworkId(): string {
  artworkIdCounter += 1
  return `artwork-${Date.now()}-${artworkIdCounter}`
}

function createFreeArtworkId(): string {
  freeArtworkIdCounter += 1
  return `free-art-${Date.now()}-${freeArtworkIdCounter}`
}

function createArtworkDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ArtworkDraftState | null {
  if (!isArtworkTarget(targetId)) {
    return null
  }

  const appliedArtwork = appliedDesign.parts[targetId]?.artwork ?? []
  const selectedArtwork = appliedArtwork.at(-1) ?? null

  return {
    id: createArtworkId(),
    targetPartId: targetId,
    mode: 'place',
    imageSource: null,
    fileName: '',
    imageWidth: 0,
    imageHeight: 0,
    aspectRatio: DEFAULT_ARTWORK_ASPECT_RATIO,
    lowResolution: false,
    error: null,
    selectedArtworkId: selectedArtwork?.id ?? null,
    scale: DEFAULT_ARTWORK_PLACE_SIZE,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  }
}

function updateWrapDraft(
  currentWrap: WrapConfig,
  patch: Partial<WrapConfig>,
): WrapConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentWrap.color,
    finish: isWrapFinish(finish) ? finish : currentWrap.finish,
  }
}

function updateTintDraft(
  currentTint: TintConfig,
  patch: Partial<TintConfig>,
): TintConfig {
  const patchedVlt = patch.vlt ?? currentTint.vlt

  return {
    vlt: clampTintVlt(patchedVlt),
  }
}

function updateLightTintDraft(
  currentLightTint: LightTintConfig,
  patch: Partial<LightTintConfig>,
): LightTintConfig {
  const patchedDarkness = patch.darkness ?? currentLightTint.darkness

  return {
    darkness: clampLightTintDarkness(patchedDarkness),
  }
}

function updateChromeDeleteDraft(
  currentChromeDelete: ChromeDeleteConfig,
  patch: Partial<ChromeDeleteConfig>,
): ChromeDeleteConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentChromeDelete.color,
    finish: isChromeDeleteFinish(finish)
      ? finish
      : currentChromeDelete.finish,
  }
}

function updateCaliperPaintDraft(
  currentCaliperPaint: CaliperPaintConfig,
  patch: Partial<CaliperPaintConfig>,
): CaliperPaintConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentCaliperPaint.color,
    finish: isCaliperPaintFinish(finish)
      ? finish
      : currentCaliperPaint.finish,
  }
}

function updatePowderCoatDraft(
  currentPowderCoat: PowderCoatConfig,
  patch: Partial<PowderCoatConfig>,
): PowderCoatConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentPowderCoat.color,
    finish: isPowderCoatFinish(finish)
      ? finish
      : currentPowderCoat.finish,
  }
}

function updatePpfDraft(
  currentPpf: PpfConfig,
  patch: Partial<PpfConfig>,
): PpfConfig {
  const finish = patch.finish

  return {
    finish: isPpfFinish(finish) ? finish : currentPpf.finish,
  }
}

function updateArtworkDraft(
  currentArtwork: ArtworkDraftState,
  patch: Partial<ArtworkDraftState>,
): ArtworkDraftState {
  const mode = isArtworkMode(patch.mode) ? patch.mode : currentArtwork.mode
  const imageWidth = clampArtworkImageDimension(
    patch.imageWidth ?? currentArtwork.imageWidth,
  )
  const imageHeight = clampArtworkImageDimension(
    patch.imageHeight ?? currentArtwork.imageHeight,
  )
  const aspectRatio = clampArtworkAspectRatio(
    patch.aspectRatio ?? currentArtwork.aspectRatio,
    imageWidth,
    imageHeight,
  )
  const nextScale = clampArtworkScale(patch.scale ?? currentArtwork.scale, mode)

  return {
    ...currentArtwork,
    imageSource:
      patch.imageSource === undefined
        ? currentArtwork.imageSource
        : patch.imageSource,
    fileName: patch.fileName ?? currentArtwork.fileName,
    imageWidth,
    imageHeight,
    aspectRatio,
    lowResolution: patch.lowResolution ?? currentArtwork.lowResolution,
    error: patch.error === undefined ? currentArtwork.error : patch.error,
    selectedArtworkId:
      patch.selectedArtworkId === undefined
        ? currentArtwork.selectedArtworkId
        : patch.selectedArtworkId,
    mode,
    position: patch.position ?? currentArtwork.position,
    orientation: patch.orientation ?? currentArtwork.orientation,
    size:
      patch.size ??
      (mode === 'place'
        ? getArtworkSizeVector(nextScale, aspectRatio)
        : currentArtwork.size),
    scale: nextScale,
    rotation: clampArtworkRotation(
      patch.rotation ?? currentArtwork.rotation,
    ),
    offsetX: clampArtworkOffset(patch.offsetX ?? currentArtwork.offsetX),
    offsetY: clampArtworkOffset(patch.offsetY ?? currentArtwork.offsetY),
  }
}

function isWrapFinish(finish: WrapFinish | undefined): finish is WrapFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isArtworkMode(mode: ArtworkMode | undefined): mode is ArtworkMode {
  return mode === 'place' || mode === 'fill'
}

function isChromeDeleteFinish(
  finish: ChromeDeleteFinish | undefined,
): finish is ChromeDeleteFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isCaliperPaintFinish(
  finish: CaliperPaintFinish | undefined,
): finish is CaliperPaintFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isPowderCoatFinish(
  finish: PowderCoatFinish | undefined,
): finish is PowderCoatFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isPpfFinish(finish: PpfFinish | undefined): finish is PpfFinish {
  return finish === 'gloss' || finish === 'matte'
}

function clampTintVlt(vlt: number): number {
  if (!Number.isFinite(vlt)) {
    return DEFAULT_TINT_CONFIG.vlt
  }

  return Math.min(100, Math.max(5, Math.round(vlt)))
}

function clampLightTintDarkness(darkness: number): number {
  if (!Number.isFinite(darkness)) {
    return DEFAULT_LIGHT_TINT_CONFIG.darkness
  }

  return Math.min(100, Math.max(0, Math.round(darkness)))
}

function clampArtworkImageDimension(dimension: number): number {
  if (!Number.isFinite(dimension)) {
    return 0
  }

  return Math.max(0, Math.round(dimension))
}

function clampArtworkAspectRatio(
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (imageWidth > 0 && imageHeight > 0) {
    return imageWidth / imageHeight
  }

  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return DEFAULT_ARTWORK_ASPECT_RATIO
  }

  return Math.min(20, Math.max(0.05, aspectRatio))
}

function clampArtworkScale(scale: number, mode: ArtworkMode): number {
  const defaultScale =
    mode === 'fill' ? DEFAULT_ARTWORK_FILL_SCALE : DEFAULT_ARTWORK_PLACE_SIZE

  if (!Number.isFinite(scale)) {
    return defaultScale
  }

  if (mode === 'fill') {
    return Math.min(4, Math.max(1, scale))
  }

  return Math.min(2.2, Math.max(0.12, scale))
}

function clampArtworkRotation(rotation: number): number {
  if (!Number.isFinite(rotation)) {
    return 0
  }

  return Math.min(180, Math.max(-180, rotation))
}

function clampArtworkOffset(offset: number): number {
  if (!Number.isFinite(offset)) {
    return 0
  }

  return Math.min(1, Math.max(-1, offset))
}

function getArtworkSizeVector(
  scale: number,
  aspectRatio: number,
): ArtworkVector3 {
  const safeAspectRatio = clampArtworkAspectRatio(aspectRatio, 0, 0)
  const width =
    safeAspectRatio >= 1 ? scale : Math.max(0.01, scale * safeAspectRatio)
  const height =
    safeAspectRatio >= 1 ? Math.max(0.01, scale / safeAspectRatio) : scale
  const depth = Math.max(0.08, Math.max(width, height) * 0.45)

  return [width, height, depth] as const
}

function buildArtworkPlacement(
  artworkDraft: ArtworkDraftState,
): ArtworkPlacement | null {
  if (!artworkDraft.imageSource) {
    return null
  }

  const size: ArtworkVector3 = getArtworkSizeVector(
    artworkDraft.scale,
    artworkDraft.aspectRatio,
  )

  return {
    id: artworkDraft.id,
    targetPartId: artworkDraft.targetPartId,
    mode: artworkDraft.mode,
    imageSource: artworkDraft.imageSource,
    fileName: artworkDraft.fileName,
    imageWidth: artworkDraft.imageWidth,
    imageHeight: artworkDraft.imageHeight,
    aspectRatio: clampArtworkAspectRatio(
      artworkDraft.aspectRatio,
      artworkDraft.imageWidth,
      artworkDraft.imageHeight,
    ),
    position: artworkDraft.position,
    orientation: artworkDraft.orientation,
    size,
    scale: artworkDraft.scale,
    rotation: artworkDraft.rotation,
    offsetX: artworkDraft.offsetX,
    offsetY: artworkDraft.offsetY,
  }
}

function createFreeArtworkDraft(
  appliedDesign: AppliedDesignState,
): FreeArtworkDraftState {
  const appliedItems = [...appliedDesign.freeArtwork].sort(
    (first, second) => first.layerOrder - second.layerOrder,
  )
  const selectedItem = appliedItems.at(-1) ?? null

  return {
    items: appliedItems,
    selectedItemId: selectedItem?.id ?? null,
    pendingImageSource: null,
    pendingFileName: '',
    pendingImageWidth: 0,
    pendingImageHeight: 0,
    pendingAspectRatio: DEFAULT_ARTWORK_ASPECT_RATIO,
    lowResolution: false,
    error: null,
  }
}

function updateFreeArtworkUpload(
  draft: FreeArtworkDraftState,
  patch: Partial<FreeArtworkDraftState>,
): FreeArtworkDraftState {
  const imageWidth = clampArtworkImageDimension(
    patch.pendingImageWidth ?? draft.pendingImageWidth,
  )
  const imageHeight = clampArtworkImageDimension(
    patch.pendingImageHeight ?? draft.pendingImageHeight,
  )
  const aspectRatio = clampArtworkAspectRatio(
    patch.pendingAspectRatio ?? draft.pendingAspectRatio,
    imageWidth,
    imageHeight,
  )

  return {
    ...draft,
    pendingImageSource:
      patch.pendingImageSource === undefined
        ? draft.pendingImageSource
        : patch.pendingImageSource,
    pendingFileName: patch.pendingFileName ?? draft.pendingFileName,
    pendingImageWidth: imageWidth,
    pendingImageHeight: imageHeight,
    pendingAspectRatio: aspectRatio,
    lowResolution: patch.lowResolution ?? draft.lowResolution,
    error: patch.error === undefined ? draft.error : patch.error,
  }
}

function getNextFreeArtworkLayerOrder(
  items: readonly FreeArtworkItem[],
): number {
  return (
    items.reduce(
      (highestLayerOrder, item) =>
        Math.max(highestLayerOrder, item.layerOrder),
      -1,
    ) + 1
  )
}

function clampFreeArtworkScale(scale: number): number {
  if (!Number.isFinite(scale)) {
    return DEFAULT_FREE_ARTWORK_SCALE
  }

  return Math.min(5, Math.max(0.16, scale))
}

function normalizeFreeArtworkItem(item: FreeArtworkItem): FreeArtworkItem {
  return {
    ...item,
    imageWidth: clampArtworkImageDimension(item.imageWidth),
    imageHeight: clampArtworkImageDimension(item.imageHeight),
    aspectRatio: clampArtworkAspectRatio(
      item.aspectRatio,
      item.imageWidth,
      item.imageHeight,
    ),
    uniformScale: clampFreeArtworkScale(item.uniformScale),
    rotation: clampArtworkRotation(item.rotation),
    visible: item.visible,
    locked: item.locked,
    layerOrder: Number.isFinite(item.layerOrder)
      ? Math.max(0, Math.round(item.layerOrder))
      : 0,
  }
}

function addPendingFreeArtwork(
  draft: FreeArtworkDraftState,
): FreeArtworkDraftState {
  if (!draft.pendingImageSource) {
    return draft
  }

  const item: FreeArtworkItem = normalizeFreeArtworkItem({
    id: createFreeArtworkId(),
    imageSource: draft.pendingImageSource,
    fileName: draft.pendingFileName,
    imageWidth: draft.pendingImageWidth,
    imageHeight: draft.pendingImageHeight,
    aspectRatio: draft.pendingAspectRatio,
    projectorPosition: DEFAULT_FREE_ARTWORK_POSITION,
    projectorQuaternion: DEFAULT_FREE_ARTWORK_QUATERNION,
    uniformScale: DEFAULT_FREE_ARTWORK_SCALE,
    rotation: 0,
    visible: true,
    locked: false,
    layerOrder: getNextFreeArtworkLayerOrder(draft.items),
  })

  return {
    ...draft,
    items: [...draft.items, item],
    selectedItemId: item.id,
    pendingImageSource: null,
    pendingFileName: '',
    pendingImageWidth: 0,
    pendingImageHeight: 0,
    pendingAspectRatio: DEFAULT_ARTWORK_ASPECT_RATIO,
    lowResolution: false,
    error: null,
  }
}

function selectFreeArtwork(
  draft: FreeArtworkDraftState,
  artworkId: string,
): FreeArtworkDraftState {
  if (!draft.items.some((item) => item.id === artworkId)) {
    return draft
  }

  return {
    ...draft,
    selectedItemId: artworkId,
  }
}

function updateFreeArtworkItem(
  draft: FreeArtworkDraftState,
  artworkId: string,
  patch: Partial<FreeArtworkItem>,
): FreeArtworkDraftState {
  return {
    ...draft,
    items: draft.items.map((item) =>
      item.id === artworkId
        ? normalizeFreeArtworkItem({
            ...item,
            ...patch,
          })
        : item,
    ),
    selectedItemId: artworkId,
  }
}

function duplicateFreeArtwork(
  draft: FreeArtworkDraftState,
  artworkId: string,
): FreeArtworkDraftState {
  const sourceItem = draft.items.find((item) => item.id === artworkId)

  if (!sourceItem) {
    return draft
  }

  const duplicatedItem = normalizeFreeArtworkItem({
    ...sourceItem,
    id: createFreeArtworkId(),
    projectorPosition: [
      sourceItem.projectorPosition[0] + 0.06,
      sourceItem.projectorPosition[1] + 0.04,
      sourceItem.projectorPosition[2],
    ],
    layerOrder: getNextFreeArtworkLayerOrder(draft.items),
  })

  return {
    ...draft,
    items: [...draft.items, duplicatedItem],
    selectedItemId: duplicatedItem.id,
  }
}

function deleteFreeArtwork(
  draft: FreeArtworkDraftState,
  artworkId: string,
): FreeArtworkDraftState {
  const items = draft.items.filter((item) => item.id !== artworkId)
  const selectedItemId =
    draft.selectedItemId === artworkId
      ? items.at(-1)?.id ?? null
      : draft.selectedItemId

  return {
    ...draft,
    items,
    selectedItemId,
  }
}

function deleteAllFreeArtwork(
  draft: FreeArtworkDraftState,
): FreeArtworkDraftState {
  return {
    ...draft,
    items: [],
    selectedItemId: null,
  }
}

function clearFullBodyPartWraps(
  parts: AppliedDesignState['parts'],
): AppliedDesignState['parts'] {
  const fullBodyPartIds = new Set(FULL_BODY_PART_IDS)
  const nextParts: AppliedDesignState['parts'] = {}

  for (const [partId, partState] of Object.entries(parts)) {
    nextParts[partId] = fullBodyPartIds.has(partId)
      ? clearWrapFromSurface(partState)
      : partState
  }

  return nextParts
}

function setTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  tintConfig: TintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setTintOnSurface(currentPartState, tintConfig)
  }

  return nextParts
}

function clearTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearTintFromSurface(currentPartState)
  }

  return nextParts
}

function setLightTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  lightTintConfig: LightTintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setLightTintOnSurface(
      currentPartState,
      lightTintConfig,
    )
  }

  return nextParts
}

function clearLightTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearLightTintFromSurface(currentPartState)
  }

  return nextParts
}

function setChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  chromeDeleteConfig: ChromeDeleteConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setChromeDeleteOnSurface(
      currentPartState,
      chromeDeleteConfig,
    )
  }

  return nextParts
}

function clearChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearChromeDeleteFromSurface(currentPartState)
  }

  return nextParts
}

function setCaliperPaintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  caliperPaintConfig: CaliperPaintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setCaliperPaintOnSurface(
      currentPartState,
      caliperPaintConfig,
    )
  }

  return nextParts
}

function clearCaliperPaintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearCaliperPaintFromSurface(currentPartState)
  }

  return nextParts
}

function setPowderCoatForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  powderCoatConfig: PowderCoatConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setPowderCoatOnSurface(
      currentPartState,
      powderCoatConfig,
    )
  }

  return nextParts
}

function clearPowderCoatForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearPowderCoatFromSurface(currentPartState)
  }

  return nextParts
}

function setPpfForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  ppfConfig: PpfConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setPpfOnSurface(currentPartState, ppfConfig)
  }

  return nextParts
}

function clearPpfForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearPpfFromSurface(currentPartState)
  }

  return nextParts
}

function clearFullBodyPartPpf(
  parts: AppliedDesignState['parts'],
): AppliedDesignState['parts'] {
  return clearPpfForTargetIds(parts, FULL_BODY_PART_IDS)
}

export const initialConfiguratorState: ConfiguratorState = {
  appliedDesign: {
    fullBody: createLayeredSurfaceState(),
    freeArtwork: [],
    parts: {},
  },
  draftSelection: null,
}

export function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  if (action.type === 'select-target') {
    const target = getSelectionTarget(action.targetId)

    if (!target) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        targetId: target.id,
        serviceId: null,
        wrapConfig: null,
        tintConfig: null,
        tintScope: null,
        lightTintConfig: null,
        lightTintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
        caliperPaintConfig: null,
        caliperPaintScope: null,
        powderCoatConfig: null,
        powderCoatScope: null,
        ppfConfig: null,
        ppfScope: null,
        artworkConfig: null,
        freeArtworkConfig: null,
      },
    }
  }

  if (action.type === 'select-service') {
    if (!state.draftSelection) {
      return state
    }

    const wrapConfig =
      action.serviceId === 'wrap'
        ? createWrapDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const defaultTintScope =
      action.serviceId === 'tint'
        ? getDefaultTintScope(state.draftSelection.targetId)
        : null
    const tintConfig =
      action.serviceId === 'tint' && defaultTintScope
        ? createTintDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const defaultLightTintScope =
      action.serviceId === 'tint'
        ? getDefaultLightTintScope(state.draftSelection.targetId)
        : null
    const lightTintConfig =
      action.serviceId === 'tint' && defaultLightTintScope
        ? createLightTintDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultChromeDeleteScope =
      action.serviceId === 'chrome-delete'
        ? getDefaultChromeDeleteScope(state.draftSelection.targetId)
        : null
    const chromeDeleteConfig =
      action.serviceId === 'chrome-delete' && defaultChromeDeleteScope
        ? createChromeDeleteDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultCaliperPaintScope =
      action.serviceId === 'caliper-paint'
        ? getDefaultCaliperPaintScope(state.draftSelection.targetId)
        : null
    const caliperPaintConfig =
      action.serviceId === 'caliper-paint' && defaultCaliperPaintScope
        ? createCaliperPaintDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultPowderCoatScope =
      action.serviceId === 'powder-coat'
        ? getDefaultPowderCoatScope(state.draftSelection.targetId)
        : null
    const powderCoatConfig =
      action.serviceId === 'powder-coat' && defaultPowderCoatScope
        ? createPowderCoatDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultPpfScope =
      action.serviceId === 'ppf' &&
      state.draftSelection.targetId !== FULL_BODY_TARGET_ID
        ? getDefaultPpfScope(state.draftSelection.targetId)
        : null
    const ppfConfig =
      action.serviceId === 'ppf' &&
      (state.draftSelection.targetId === FULL_BODY_TARGET_ID || defaultPpfScope)
        ? createPpfDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const artworkConfig =
      action.serviceId === 'artwork'
        ? createArtworkDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const freeArtworkConfig =
      action.serviceId === 'free-art' &&
      state.draftSelection.targetId === FULL_BODY_TARGET_ID
        ? createFreeArtworkDraft(state.appliedDesign)
        : null

    if (action.serviceId === 'artwork' && !artworkConfig) {
      return state
    }

    if (action.serviceId === 'free-art' && !freeArtworkConfig) {
      return state
    }

    if (action.serviceId === 'ppf' && !ppfConfig) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: action.serviceId,
        wrapConfig,
        tintConfig,
        tintScope: defaultTintScope,
        lightTintConfig,
        lightTintScope: defaultLightTintScope,
        chromeDeleteConfig,
        chromeDeleteScope: defaultChromeDeleteScope,
        caliperPaintConfig,
        caliperPaintScope: defaultCaliperPaintScope,
        powderCoatConfig,
        powderCoatScope: defaultPowderCoatScope,
        ppfConfig,
        ppfScope: defaultPpfScope,
        artworkConfig,
        freeArtworkConfig,
      },
    }
  }

  if (action.type === 'update-wrap-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'wrap') {
      return state
    }

    const currentWrap =
      draftSelection.wrapConfig ??
      createWrapDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        wrapConfig: updateWrapDraft(currentWrap, action.patch),
      },
    }
  }

  if (action.type === 'update-tint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint' || !draftSelection.tintScope) {
      return state
    }

    const currentTint =
      draftSelection.tintConfig ??
      createTintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintConfig: updateTintDraft(currentTint, action.patch),
      },
    }
  }

  if (action.type === 'update-tint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint' || !draftSelection.tintConfig) {
      return state
    }

    if (
      resolveTintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-light-tint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint' || !draftSelection.lightTintScope) {
      return state
    }

    const currentLightTint =
      draftSelection.lightTintConfig ??
      createLightTintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        lightTintConfig: updateLightTintDraft(
          currentLightTint,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-light-tint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint' || !draftSelection.lightTintConfig) {
      return state
    }

    if (
      resolveLightTintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        lightTintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-chrome-delete-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    const currentChromeDelete =
      draftSelection.chromeDeleteConfig ??
      createChromeDeleteDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteConfig: updateChromeDeleteDraft(
          currentChromeDelete,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-chrome-delete-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    if (
      resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteScope: action.scope,
      },
    }
  }

  if (action.type === 'update-caliper-paint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'caliper-paint') {
      return state
    }

    const currentCaliperPaint =
      draftSelection.caliperPaintConfig ??
      createCaliperPaintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        caliperPaintConfig: updateCaliperPaintDraft(
          currentCaliperPaint,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-caliper-paint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'caliper-paint') {
      return state
    }

    if (
      resolveCaliperPaintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        caliperPaintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-powder-coat-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'powder-coat') {
      return state
    }

    const currentPowderCoat =
      draftSelection.powderCoatConfig ??
      createPowderCoatDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        powderCoatConfig: updatePowderCoatDraft(
          currentPowderCoat,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-powder-coat-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'powder-coat') {
      return state
    }

    if (
      resolvePowderCoatScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        powderCoatScope: action.scope,
      },
    }
  }

  if (action.type === 'update-ppf-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'ppf') {
      return state
    }

    const currentPpf =
      draftSelection.ppfConfig ??
      createPpfDraft(state.appliedDesign, draftSelection.targetId)

    if (!currentPpf) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        ppfConfig: updatePpfDraft(currentPpf, action.patch),
      },
    }
  }

  if (action.type === 'update-ppf-scope') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'ppf' ||
      draftSelection.targetId === FULL_BODY_TARGET_ID
    ) {
      return state
    }

    if (
      resolvePpfScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        ppfScope: action.scope,
      },
    }
  }

  if (action.type === 'update-artwork-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'artwork') {
      return state
    }

    const currentArtwork =
      draftSelection.artworkConfig ??
      createArtworkDraft(state.appliedDesign, draftSelection.targetId)

    if (!currentArtwork) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        artworkConfig: updateArtworkDraft(currentArtwork, action.patch),
      },
    }
  }

  if (action.type === 'update-free-artwork-upload') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: updateFreeArtworkUpload(
          draftSelection.freeArtworkConfig,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'add-free-artwork') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: addPendingFreeArtwork(
          draftSelection.freeArtworkConfig,
        ),
      },
    }
  }

  if (action.type === 'select-free-artwork') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: selectFreeArtwork(
          draftSelection.freeArtworkConfig,
          action.artworkId,
        ),
      },
    }
  }

  if (action.type === 'update-free-artwork-item') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: updateFreeArtworkItem(
          draftSelection.freeArtworkConfig,
          action.artworkId,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'duplicate-free-artwork') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: duplicateFreeArtwork(
          draftSelection.freeArtworkConfig,
          action.artworkId,
        ),
      },
    }
  }

  if (action.type === 'delete-free-artwork') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: deleteFreeArtwork(
          draftSelection.freeArtworkConfig,
          action.artworkId,
        ),
      },
    }
  }

  if (action.type === 'delete-all-free-artwork') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !draftSelection.freeArtworkConfig
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        freeArtworkConfig: deleteAllFreeArtwork(
          draftSelection.freeArtworkConfig,
        ),
      },
    }
  }

  if (action.type === 'clear-service') {
    if (!state.draftSelection) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: null,
        wrapConfig: null,
        tintConfig: null,
        tintScope: null,
        lightTintConfig: null,
        lightTintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
        caliperPaintConfig: null,
        caliperPaintScope: null,
        powderCoatConfig: null,
        powderCoatScope: null,
        ppfConfig: null,
        ppfScope: null,
        artworkConfig: null,
        freeArtworkConfig: null,
      },
    }
  }

  if (action.type === 'cancel-draft') {
    return {
      ...state,
      draftSelection: null,
    }
  }

  if (action.type === 'apply-draft') {
    const draftSelection = state.draftSelection

    if (!draftSelection?.serviceId) {
      return state
    }

    if (draftSelection.serviceId === 'wrap') {
      if (!draftSelection.wrapConfig) {
        return state
      }

      if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            fullBody: setWrapOnSurface(
              state.appliedDesign.fullBody,
              draftSelection.wrapConfig,
            ),
          },
          draftSelection: null,
        }
      }

      const currentPartState =
        state.appliedDesign.parts[draftSelection.targetId] ??
        createLayeredSurfaceState()

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: {
            ...state.appliedDesign.parts,
            [draftSelection.targetId]: setWrapOnSurface(
              currentPartState,
              draftSelection.wrapConfig,
            ),
          },
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'tint') {
      if (draftSelection.tintConfig && draftSelection.tintScope) {
        const tintTargetIds = resolveTintScopeTargetIds(
          draftSelection.targetId,
          draftSelection.tintScope,
        )

        if (tintTargetIds.length === 0) {
          return state
        }

        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            parts: setTintForTargetIds(
              state.appliedDesign.parts,
              tintTargetIds,
              draftSelection.tintConfig,
            ),
          },
          draftSelection: null,
        }
      }

      if (draftSelection.lightTintConfig && draftSelection.lightTintScope) {
        const lightTintTargetIds = resolveLightTintScopeTargetIds(
          draftSelection.targetId,
          draftSelection.lightTintScope,
        )

        if (lightTintTargetIds.length === 0) {
          return state
        }

        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            parts: setLightTintForTargetIds(
              state.appliedDesign.parts,
              lightTintTargetIds,
              draftSelection.lightTintConfig,
            ),
          },
          draftSelection: null,
        }
      }

      return state
    }

    if (draftSelection.serviceId === 'chrome-delete') {
      if (
        !draftSelection.chromeDeleteConfig ||
        !draftSelection.chromeDeleteScope
      ) {
        return state
      }

      const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        draftSelection.chromeDeleteScope,
      )

      if (chromeDeleteTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setChromeDeleteForTargetIds(
            state.appliedDesign.parts,
            chromeDeleteTargetIds,
            draftSelection.chromeDeleteConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'caliper-paint') {
      if (!draftSelection.caliperPaintConfig || !draftSelection.caliperPaintScope) {
        return state
      }

      const caliperPaintTargetIds = resolveCaliperPaintScopeTargetIds(
        draftSelection.targetId,
        draftSelection.caliperPaintScope,
      )

      if (caliperPaintTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setCaliperPaintForTargetIds(
            state.appliedDesign.parts,
            caliperPaintTargetIds,
            draftSelection.caliperPaintConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'powder-coat') {
      if (!draftSelection.powderCoatConfig || !draftSelection.powderCoatScope) {
        return state
      }

      const powderCoatTargetIds = resolvePowderCoatScopeTargetIds(
        draftSelection.targetId,
        draftSelection.powderCoatScope,
      )

      if (powderCoatTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setPowderCoatForTargetIds(
            state.appliedDesign.parts,
            powderCoatTargetIds,
            draftSelection.powderCoatConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'artwork') {
      if (!isArtworkTarget(draftSelection.targetId)) {
        return state
      }

      const artworkPlacement = draftSelection.artworkConfig
        ? buildArtworkPlacement(draftSelection.artworkConfig)
        : null

      if (!artworkPlacement) {
        return state
      }

      const currentPartState =
        state.appliedDesign.parts[draftSelection.targetId] ??
        createLayeredSurfaceState()

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: {
            ...state.appliedDesign.parts,
            [draftSelection.targetId]: appendArtworkToSurface(
              currentPartState,
              artworkPlacement,
            ),
          },
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'free-art') {
      if (
        draftSelection.targetId !== FULL_BODY_TARGET_ID ||
        !draftSelection.freeArtworkConfig
      ) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          freeArtwork: [...draftSelection.freeArtworkConfig.items].sort(
            (first, second) => first.layerOrder - second.layerOrder,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'ppf') {
      if (!draftSelection.ppfConfig || !isPpfTarget(draftSelection.targetId)) {
        return state
      }

      if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            fullBody: setPpfOnSurface(
              state.appliedDesign.fullBody,
              draftSelection.ppfConfig,
            ),
          },
          draftSelection: null,
        }
      }

      if (!draftSelection.ppfScope) {
        return state
      }

      const ppfTargetIds = resolvePpfScopeTargetIds(
        draftSelection.targetId,
        draftSelection.ppfScope,
      )

      if (ppfTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setPpfForTargetIds(
            state.appliedDesign.parts,
            ppfTargetIds,
            draftSelection.ppfConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: applyServiceToSurface(
            state.appliedDesign.fullBody,
            draftSelection.serviceId,
          ),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[draftSelection.targetId] ??
      createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [draftSelection.targetId]: applyServiceToSurface(
            currentPartState,
            draftSelection.serviceId,
          ),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'apply-wrap-all') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.targetId !== FULL_BODY_TARGET_ID ||
      draftSelection.serviceId !== 'wrap' ||
      !draftSelection.wrapConfig
    ) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: setWrapOnSurface(
          state.appliedDesign.fullBody,
          draftSelection.wrapConfig,
        ),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'apply-ppf-all') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.targetId !== FULL_BODY_TARGET_ID ||
      draftSelection.serviceId !== 'ppf' ||
      !draftSelection.ppfConfig
    ) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: setPpfOnSurface(
          state.appliedDesign.fullBody,
          draftSelection.ppfConfig,
        ),
        parts: clearFullBodyPartPpf(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-wrap') {
    if (action.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: clearWrapFromSurface(currentPartState),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-tint') {
    const tintTargetIds = resolveTintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (tintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearTintForTargetIds(state.appliedDesign.parts, tintTargetIds),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-light-tint') {
    const lightTintTargetIds = resolveLightTintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (lightTintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearLightTintForTargetIds(
          state.appliedDesign.parts,
          lightTintTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-chrome-delete') {
    const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (chromeDeleteTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearChromeDeleteForTargetIds(
          state.appliedDesign.parts,
          chromeDeleteTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-caliper-paint') {
    const caliperPaintTargetIds = resolveCaliperPaintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (caliperPaintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearCaliperPaintForTargetIds(
          state.appliedDesign.parts,
          caliperPaintTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-powder-coat') {
    const powderCoatTargetIds = resolvePowderCoatScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (powderCoatTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearPowderCoatForTargetIds(
          state.appliedDesign.parts,
          powderCoatTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-ppf') {
    if (!isPpfTarget(action.targetId)) {
      return state
    }

    if (action.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: clearPpfFromSurface(state.appliedDesign.fullBody),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: clearPpfFromSurface(currentPartState),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'remove-artwork') {
    if (!isArtworkTarget(action.targetId)) {
      return state
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: removeArtworkFromSurface(
            currentPartState,
            action.artworkId,
          ),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'remove-all-artwork') {
    if (!isArtworkTarget(action.targetId)) {
      return state
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: clearArtworkFromSurface(currentPartState),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-all-wraps') {
    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-all-ppf') {
    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: clearPpfFromSurface(state.appliedDesign.fullBody),
        parts: clearFullBodyPartPpf(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  return state
}
