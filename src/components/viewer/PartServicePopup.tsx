import { useState } from 'react'
import { getService } from '../../config/services'
import type {
  ArtworkDraftState,
  ArtworkMode,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintScope,
  CaliperPaintScopeOption,
  CeramicConfig,
  CeramicScope,
  CeramicScopeOption,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  ChromeDeleteScopeOption,
  FreeArtworkDraftState,
  FreeArtworkItem,
  LightTintConfig,
  LightTintScope,
  LightTintScopeOption,
  PpfConfig,
  PpfFinish,
  PpfScope,
  PpfScopeOption,
  PowderCoatConfig,
  PowderCoatFinish,
  PowderCoatScope,
  PowderCoatScopeOption,
  ServiceId,
  TintConfig,
  TintScope,
  TintScopeOption,
  VehiclePartDefinition,
  WrapConfig,
  WrapFinish,
} from '../../types/configurator'

const wrapFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: WrapFinish; label: string }[]

const chromeDeleteFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: ChromeDeleteFinish; label: string }[]

const caliperPaintFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: CaliperPaintFinish; label: string }[]

const powderCoatFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: PowderCoatFinish; label: string }[]

const ppfFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: PpfFinish; label: string }[]

const validHexColorPattern = /^#[0-9A-F]{6}$/
const partialHexColorPattern = /^#[0-9A-F]{0,6}$/
const tintShadeOptions = [70, 50, 35, 20, 5] as const
const tintShadeOptionSet = new Set<number>(tintShadeOptions)
const lightTintShadeOptions = [
  { label: 'Light', darkness: 25 },
  { label: 'Medium', darkness: 55 },
  { label: 'Dark', darkness: 82 },
] as const
const lightTintShadeDarknessSet = new Set<number>(
  lightTintShadeOptions.map((option) => option.darkness),
)
const artworkModeOptions = [
  { id: 'place', label: 'Place' },
  { id: 'fill', label: 'Fill Part' },
] as const satisfies readonly { id: ArtworkMode; label: string }[]
const supportedArtworkMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])
const artworkWorkingImageMaxDimension = 2048
const lowResolutionShortEdgeThreshold = 256
const lowResolutionLongEdgeThreshold = 600

type ArtworkFileLoadResult = {
  imageSource: string
  fileName: string
  imageWidth: number
  imageHeight: number
  originalImageWidth: number
  originalImageHeight: number
  aspectRatio: number
}

function getArtworkWorkingDimensions(
  width: number,
  height: number,
): { height: number; width: number } {
  const maxDimension = Math.max(width, height)

  if (maxDimension <= artworkWorkingImageMaxDimension) {
    return { width, height }
  }

  const scale = artworkWorkingImageMaxDimension / maxDimension

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function getArtworkWorkingMimeType(fileType: string): 'image/jpeg' | 'image/png' {
  return fileType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
}

function createArtworkWorkingImage(
  image: HTMLImageElement,
  fileType: string,
): Pick<ArtworkFileLoadResult, 'imageHeight' | 'imageSource' | 'imageWidth'> {
  const { width, height } = getArtworkWorkingDimensions(
    image.naturalWidth,
    image.naturalHeight,
  )
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Artwork canvas unavailable')
  }

  canvas.width = width
  canvas.height = height
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const mimeType = getArtworkWorkingMimeType(fileType)
  const imageSource =
    mimeType === 'image/jpeg'
      ? canvas.toDataURL(mimeType, 0.92)
      : canvas.toDataURL(mimeType)

  return {
    imageSource,
    imageWidth: width,
    imageHeight: height,
  }
}

type PartServicePopupProps = {
  target: VehiclePartDefinition
  selectedServiceId: ServiceId | null
  artworkConfig: ArtworkDraftState | null
  freeArtworkConfig: FreeArtworkDraftState | null
  selectedFreeArtworkItem: FreeArtworkItem | null
  caliperPaintConfig: CaliperPaintConfig | null
  caliperPaintScope: CaliperPaintScope | null
  caliperPaintScopeOptions: readonly CaliperPaintScopeOption[]
  powderCoatConfig: PowderCoatConfig | null
  powderCoatScope: PowderCoatScope | null
  powderCoatScopeOptions: readonly PowderCoatScopeOption[]
  ppfConfig: PpfConfig | null
  ppfScope: PpfScope | null
  ppfScopeOptions: readonly PpfScopeOption[]
  ceramicConfig: CeramicConfig | null
  ceramicScope: CeramicScope | null
  ceramicScopeOptions: readonly CeramicScopeOption[]
  lightTintConfig: LightTintConfig | null
  lightTintScope: LightTintScope | null
  lightTintScopeOptions: readonly LightTintScopeOption[]
  chromeDeleteConfig: ChromeDeleteConfig | null
  chromeDeleteScope: ChromeDeleteScope | null
  chromeDeleteScopeOptions: readonly ChromeDeleteScopeOption[]
  wrapConfig: WrapConfig | null
  tintConfig: TintConfig | null
  tintScope: TintScope | null
  tintScopeOptions: readonly TintScopeOption[]
  canApplyAllWraps: boolean
  canApplyAllPpf: boolean
  canApplyAllCeramic: boolean
  canResetAllWraps: boolean
  canResetAllPpf: boolean
  canResetAllCeramic: boolean
  canResetCaliperPaint: boolean
  canResetChromeDelete: boolean
  canResetLightTint: boolean
  canResetPowderCoat: boolean
  canResetPpf: boolean
  canResetCeramic: boolean
  canResetTint: boolean
  canResetWrap: boolean
  canRemoveArtwork: boolean
  canRemoveAllArtwork: boolean
  onApply: () => void
  onApplyAll: () => void
  onBack: () => void
  onCancel: () => void
  onClose: () => void
  onResetAllWraps: () => void
  onResetAllPpf: () => void
  onResetAllCeramic: () => void
  onResetCaliperPaint: () => void
  onResetChromeDelete: () => void
  onResetLightTint: () => void
  onResetPowderCoat: () => void
  onResetPpf: () => void
  onResetCeramic: () => void
  onResetTint: () => void
  onResetWrap: () => void
  onRemoveArtwork: () => void
  onRemoveAllArtwork: () => void
  onAddFreeArtwork: () => void
  onDeleteAllFreeArtwork: () => void
  onDeleteFreeArtwork: (artworkId: string) => void
  onDuplicateFreeArtwork: (artworkId: string) => void
  onSelectFreeArtwork: (artworkId: string) => void
  onSelectService: (serviceId: ServiceId) => void
  onUpdateArtworkDraft: (patch: Partial<ArtworkDraftState>) => void
  onUpdateFreeArtworkItem: (
    artworkId: string,
    patch: Partial<FreeArtworkItem>,
  ) => void
  onUpdateFreeArtworkUpload: (patch: Partial<FreeArtworkDraftState>) => void
  onUpdateCaliperPaintDraft: (patch: Partial<CaliperPaintConfig>) => void
  onUpdateCaliperPaintScope: (scope: CaliperPaintScope) => void
  onUpdatePowderCoatDraft: (patch: Partial<PowderCoatConfig>) => void
  onUpdatePowderCoatScope: (scope: PowderCoatScope) => void
  onUpdatePpfDraft: (patch: Partial<PpfConfig>) => void
  onUpdatePpfScope: (scope: PpfScope) => void
  onUpdateCeramicDraft: (patch: Partial<CeramicConfig>) => void
  onUpdateCeramicScope: (scope: CeramicScope) => void
  onUpdateLightTintDraft: (patch: Partial<LightTintConfig>) => void
  onUpdateLightTintScope: (scope: LightTintScope) => void
  onUpdateChromeDeleteDraft: (patch: Partial<ChromeDeleteConfig>) => void
  onUpdateChromeDeleteScope: (scope: ChromeDeleteScope) => void
  onUpdateTintDraft: (patch: Partial<TintConfig>) => void
  onUpdateTintScope: (scope: TintScope) => void
  onUpdateWrapDraft: (patch: Partial<WrapConfig>) => void
}

export function PartServicePopup({
  artworkConfig,
  freeArtworkConfig,
  ceramicConfig,
  ceramicScope,
  ceramicScopeOptions,
  canApplyAllCeramic,
  canApplyAllPpf,
  canApplyAllWraps,
  canRemoveAllArtwork,
  canRemoveArtwork,
  canResetAllCeramic,
  canResetAllPpf,
  canResetAllWraps,
  canResetCaliperPaint,
  canResetChromeDelete,
  canResetLightTint,
  canResetPowderCoat,
  canResetCeramic,
  canResetPpf,
  canResetTint,
  canResetWrap,
  caliperPaintConfig,
  caliperPaintScope,
  caliperPaintScopeOptions,
  powderCoatConfig,
  powderCoatScope,
  powderCoatScopeOptions,
  ppfConfig,
  ppfScope,
  ppfScopeOptions,
  lightTintConfig,
  lightTintScope,
  lightTintScopeOptions,
  chromeDeleteConfig,
  chromeDeleteScope,
  chromeDeleteScopeOptions,
  selectedFreeArtworkItem,
  target,
  selectedServiceId,
  tintConfig,
  tintScope,
  tintScopeOptions,
  wrapConfig,
  onApply,
  onApplyAll,
  onBack,
  onCancel,
  onClose,
  onResetAllCeramic,
  onResetAllPpf,
  onResetAllWraps,
  onResetCaliperPaint,
  onResetChromeDelete,
  onResetLightTint,
  onResetPowderCoat,
  onResetCeramic,
  onResetPpf,
  onResetTint,
  onResetWrap,
  onRemoveAllArtwork,
  onRemoveArtwork,
  onAddFreeArtwork,
  onDeleteAllFreeArtwork,
  onDeleteFreeArtwork,
  onDuplicateFreeArtwork,
  onSelectFreeArtwork,
  onSelectService,
  onUpdateArtworkDraft,
  onUpdateFreeArtworkItem,
  onUpdateFreeArtworkUpload,
  onUpdateCaliperPaintDraft,
  onUpdateCaliperPaintScope,
  onUpdatePowderCoatDraft,
  onUpdatePowderCoatScope,
  onUpdateCeramicDraft,
  onUpdateCeramicScope,
  onUpdatePpfDraft,
  onUpdatePpfScope,
  onUpdateLightTintDraft,
  onUpdateLightTintScope,
  onUpdateChromeDeleteDraft,
  onUpdateChromeDeleteScope,
  onUpdateTintDraft,
  onUpdateTintScope,
  onUpdateWrapDraft,
}: PartServicePopupProps) {
  const showWrapEditor = selectedServiceId === 'wrap' && wrapConfig !== null
  const showTintEditor =
    selectedServiceId === 'tint' && tintConfig !== null && tintScope !== null
  const showLightTintEditor =
    selectedServiceId === 'tint' &&
    lightTintConfig !== null &&
    lightTintScope !== null
  const showChromeDeleteEditor =
    selectedServiceId === 'chrome-delete' &&
    chromeDeleteConfig !== null &&
    chromeDeleteScope !== null
  const showCaliperPaintEditor =
    selectedServiceId === 'caliper-paint' &&
    caliperPaintConfig !== null &&
    caliperPaintScope !== null
  const showPowderCoatEditor =
    selectedServiceId === 'powder-coat' &&
    powderCoatConfig !== null &&
    powderCoatScope !== null
  const showPpfEditor =
    selectedServiceId === 'ppf' &&
    ppfConfig !== null &&
    (target.id === 'full-body' || ppfScope !== null)
  const showCeramicEditor =
    selectedServiceId === 'ceramic' &&
    ceramicConfig !== null &&
    (target.id === 'full-body' || ceramicScope !== null)
  const showArtworkEditor =
    selectedServiceId === 'artwork' && artworkConfig !== null
  const showFreeArtEditor =
    selectedServiceId === 'free-art' && freeArtworkConfig !== null
  const showServiceList =
    !showWrapEditor &&
    !showTintEditor &&
    !showLightTintEditor &&
    !showChromeDeleteEditor &&
    !showCaliperPaintEditor &&
    !showPowderCoatEditor &&
    !showPpfEditor &&
    !showCeramicEditor &&
    !showArtworkEditor &&
    !showFreeArtEditor
  const syncedHexValue = wrapConfig?.color.toUpperCase() ?? '#C49D59'
  const syncedChromeDeleteHexValue =
    chromeDeleteConfig?.color.toUpperCase() ?? '#050505'
  const syncedCaliperPaintHexValue =
    caliperPaintConfig?.color.toUpperCase() ?? '#D51F28'
  const syncedPowderCoatHexValue =
    powderCoatConfig?.color.toUpperCase() ?? '#2D3135'
  const [hexInput, setHexInput] = useState<{
    source: string
    value: string
  } | null>(null)
  const [chromeDeleteHexInput, setChromeDeleteHexInput] = useState<{
    source: string
    value: string
  } | null>(null)
  const [caliperPaintHexInput, setCaliperPaintHexInput] = useState<{
    source: string
    value: string
  } | null>(null)
  const [powderCoatHexInput, setPowderCoatHexInput] = useState<{
    source: string
    value: string
  } | null>(null)
  const hexValue =
    hexInput?.source === syncedHexValue ? hexInput.value : syncedHexValue
  const chromeDeleteHexValue =
    chromeDeleteHexInput?.source === syncedChromeDeleteHexValue
      ? chromeDeleteHexInput.value
      : syncedChromeDeleteHexValue
  const caliperPaintHexValue =
    caliperPaintHexInput?.source === syncedCaliperPaintHexValue
      ? caliperPaintHexInput.value
      : syncedCaliperPaintHexValue
  const powderCoatHexValue =
    powderCoatHexInput?.source === syncedPowderCoatHexValue
      ? powderCoatHexInput.value
      : syncedPowderCoatHexValue
  const [customTint, setCustomTint] = useState<{
    active: boolean
    source: number
  } | null>(null)
  const [customLightTint, setCustomLightTint] = useState<{
    active: boolean
    source: number
  } | null>(null)
  const customTintActive = tintConfig
    ? customTint?.source === tintConfig.vlt
      ? customTint.active
      : !tintShadeOptionSet.has(tintConfig.vlt)
    : false
  const customLightTintActive = lightTintConfig
    ? customLightTint?.source === lightTintConfig.darkness
      ? customLightTint.active
      : !lightTintShadeDarknessSet.has(lightTintConfig.darkness)
    : false

  function handleColorChange(color: string) {
    const normalizedColor = color.toUpperCase()

    setHexInput(null)
    onUpdateWrapDraft({ color: normalizedColor.toLowerCase() })
  }

  function handleHexChange(value: string) {
    const nextValue = value.trim().toUpperCase()
    const prefixedValue = nextValue.startsWith('#')
      ? nextValue
      : `#${nextValue}`

    if (!partialHexColorPattern.test(prefixedValue)) {
      return
    }

    setHexInput({ source: syncedHexValue, value: prefixedValue })

    if (validHexColorPattern.test(prefixedValue)) {
      onUpdateWrapDraft({ color: prefixedValue.toLowerCase() })
    }
  }

  function handleHexBlur() {
    setHexInput(null)
  }

  function handleChromeDeleteColorChange(color: string) {
    const normalizedColor = color.toUpperCase()

    setChromeDeleteHexInput(null)
    onUpdateChromeDeleteDraft({ color: normalizedColor.toLowerCase() })
  }

  function handleChromeDeleteHexChange(value: string) {
    const nextValue = value.trim().toUpperCase()
    const prefixedValue = nextValue.startsWith('#')
      ? nextValue
      : `#${nextValue}`

    if (!partialHexColorPattern.test(prefixedValue)) {
      return
    }

    setChromeDeleteHexInput({
      source: syncedChromeDeleteHexValue,
      value: prefixedValue,
    })

    if (validHexColorPattern.test(prefixedValue)) {
      onUpdateChromeDeleteDraft({ color: prefixedValue.toLowerCase() })
    }
  }

  function handleChromeDeleteHexBlur() {
    setChromeDeleteHexInput(null)
  }

  function handleCaliperPaintColorChange(color: string) {
    const normalizedColor = color.toUpperCase()

    setCaliperPaintHexInput(null)
    onUpdateCaliperPaintDraft({ color: normalizedColor.toLowerCase() })
  }

  function handleCaliperPaintHexChange(value: string) {
    const nextValue = value.trim().toUpperCase()
    const prefixedValue = nextValue.startsWith('#')
      ? nextValue
      : `#${nextValue}`

    if (!partialHexColorPattern.test(prefixedValue)) {
      return
    }

    setCaliperPaintHexInput({
      source: syncedCaliperPaintHexValue,
      value: prefixedValue,
    })

    if (validHexColorPattern.test(prefixedValue)) {
      onUpdateCaliperPaintDraft({ color: prefixedValue.toLowerCase() })
    }
  }

  function handleCaliperPaintHexBlur() {
    setCaliperPaintHexInput(null)
  }

  function handlePowderCoatColorChange(color: string) {
    const normalizedColor = color.toUpperCase()

    setPowderCoatHexInput(null)
    onUpdatePowderCoatDraft({ color: normalizedColor.toLowerCase() })
  }

  function handlePowderCoatHexChange(value: string) {
    const nextValue = value.trim().toUpperCase()
    const prefixedValue = nextValue.startsWith('#')
      ? nextValue
      : `#${nextValue}`

    if (!partialHexColorPattern.test(prefixedValue)) {
      return
    }

    setPowderCoatHexInput({
      source: syncedPowderCoatHexValue,
      value: prefixedValue,
    })

    if (validHexColorPattern.test(prefixedValue)) {
      onUpdatePowderCoatDraft({ color: prefixedValue.toLowerCase() })
    }
  }

  function handlePowderCoatHexBlur() {
    setPowderCoatHexInput(null)
  }

  function handleTintShadeSelect(vlt: number) {
    setCustomTint({ active: false, source: vlt })
    onUpdateTintDraft({ vlt })
  }

  function handleCustomTintSelect() {
    const nextVlt = tintConfig?.vlt ?? 35

    setCustomTint({ active: true, source: nextVlt })
  }

  function handleCustomTintChange(value: string) {
    if (value === '') {
      return
    }

    const nextVlt = Math.min(100, Math.max(5, Math.round(Number(value))))

    if (!Number.isFinite(nextVlt)) {
      return
    }

    setCustomTint({ active: true, source: nextVlt })
    onUpdateTintDraft({ vlt: nextVlt })
  }

  function handleLightTintShadeSelect(darkness: number) {
    setCustomLightTint({ active: false, source: darkness })
    onUpdateLightTintDraft({ darkness })
  }

  function handleCustomLightTintSelect() {
    const nextDarkness = lightTintConfig?.darkness ?? 25

    setCustomLightTint({ active: true, source: nextDarkness })
  }

  function handleCustomLightTintChange(value: string) {
    const nextDarkness = Math.min(100, Math.max(0, Math.round(Number(value))))

    if (!Number.isFinite(nextDarkness)) {
      return
    }

    setCustomLightTint({ active: true, source: nextDarkness })
    onUpdateLightTintDraft({ darkness: nextDarkness })
  }

  function isLowResolutionArtwork(width: number, height: number): boolean {
    const shortEdge = Math.min(width, height)
    const longEdge = Math.max(width, height)

    return (
      shortEdge < lowResolutionShortEdgeThreshold ||
      longEdge < lowResolutionLongEdgeThreshold
    )
  }

  function readArtworkFile(
    fileList: FileList | null,
    onLoad: (result: ArtworkFileLoadResult) => void,
    onError: (message: string) => void,
  ) {
    const file = fileList?.[0]

    if (!file) {
      return
    }

    if (!supportedArtworkMimeTypes.has(file.type)) {
      onError('Unsupported file type')
      return
    }

    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    function failUpload() {
      URL.revokeObjectURL(imageUrl)
      onError('Upload failed')
    }

    image.onerror = failUpload

    image.onload = () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        failUpload()
        return
      }

      let workingImage: Pick<
        ArtworkFileLoadResult,
        'imageHeight' | 'imageSource' | 'imageWidth'
      >

      try {
        workingImage = createArtworkWorkingImage(image, file.type)
      } catch {
        failUpload()
        return
      }

      URL.revokeObjectURL(imageUrl)
      onLoad({
        imageSource: workingImage.imageSource,
        fileName: file.name,
        imageWidth: workingImage.imageWidth,
        imageHeight: workingImage.imageHeight,
        originalImageWidth: image.naturalWidth,
        originalImageHeight: image.naturalHeight,
        aspectRatio: image.naturalWidth / image.naturalHeight,
      })
    }

    image.src = imageUrl
  }

  function handleArtworkUpload(fileList: FileList | null) {
    readArtworkFile(
      fileList,
      (result) => {
        onUpdateArtworkDraft({
          imageSource: result.imageSource,
          fileName: result.fileName,
          imageWidth: result.imageWidth,
          imageHeight: result.imageHeight,
          aspectRatio: result.aspectRatio,
          lowResolution: isLowResolutionArtwork(
            result.originalImageWidth,
            result.originalImageHeight,
          ),
          error: null,
        })
      },
      (message) => {
        onUpdateArtworkDraft({
          imageSource: null,
          fileName: '',
          imageWidth: 0,
          imageHeight: 0,
          aspectRatio: 1,
          lowResolution: false,
          error: message,
        })
      },
    )
  }

  function handleFreeArtworkUpload(fileList: FileList | null) {
    readArtworkFile(
      fileList,
      (result) => {
        onUpdateFreeArtworkUpload({
          pendingImageSource: result.imageSource,
          pendingFileName: result.fileName,
          pendingImageWidth: result.imageWidth,
          pendingImageHeight: result.imageHeight,
          pendingAspectRatio: result.aspectRatio,
          lowResolution: isLowResolutionArtwork(
            result.originalImageWidth,
            result.originalImageHeight,
          ),
          error: null,
        })
      },
      (message) => {
        onUpdateFreeArtworkUpload({
          pendingImageSource: null,
          pendingFileName: '',
          pendingImageWidth: 0,
          pendingImageHeight: 0,
          pendingAspectRatio: 1,
          lowResolution: false,
          error: message,
        })
      },
    )
  }

  function handleArtworkModeSelect(mode: ArtworkMode) {
    onUpdateArtworkDraft({
      mode,
      scale: mode === 'fill' ? 1 : 0.68,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    })
  }

  const selectedFreeArtworkIndex =
    freeArtworkConfig && selectedFreeArtworkItem
      ? freeArtworkConfig.items.findIndex(
          (item) => item.id === selectedFreeArtworkItem.id,
        )
      : -1

  return (
    <section
      className="part-popup"
      data-popup-root
      onPointerDownCapture={(event) => event.stopPropagation()}
      aria-label={`${target.label} services`}
    >
      <div className="part-popup-header">
        <h2>{target.label.toUpperCase()}</h2>
        <button type="button" className="part-popup-link" onClick={onClose}>
          Close
        </button>
      </div>

      {showWrapEditor && wrapConfig ? (
        <div className="part-popup-wrap" aria-label="Wrap options">
          <label className="part-popup-field">
            <span>Color</span>
            <div className="part-popup-color-row">
              <input
                type="color"
                className="part-popup-color-input"
                value={wrapConfig.color}
                onChange={(event) =>
                  handleColorChange(event.currentTarget.value)
                }
              />
              <input
                type="text"
                className="part-popup-hex-input"
                aria-label="Hex color"
                inputMode="text"
                maxLength={7}
                spellCheck={false}
                value={hexValue}
                onBlur={handleHexBlur}
                onChange={(event) => handleHexChange(event.currentTarget.value)}
              />
            </div>
          </label>

          <div>
            <p className="part-popup-finish-label">Finish</p>
            <div className="part-popup-finish-grid" aria-label="Finish">
              {wrapFinishOptions.map((finish) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={wrapConfig.finish === finish.id}
                  key={finish.id}
                  onClick={() => onUpdateWrapDraft({ finish: finish.id })}
                >
                  {finish.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showTintEditor && tintConfig && tintScope ? (
        <div className="part-popup-wrap" aria-label="Tint options">
          <div>
            <p className="part-popup-finish-label">Shade</p>
            <div className="part-popup-finish-grid" aria-label="Shade">
              {tintShadeOptions.map((vlt) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={!customTintActive && tintConfig.vlt === vlt}
                  key={vlt}
                  onClick={() => handleTintShadeSelect(vlt)}
                >
                  {vlt}%
                </button>
              ))}
              <button
                type="button"
                className="part-popup-finish"
                data-selected={customTintActive}
                onClick={handleCustomTintSelect}
              >
                Custom
              </button>
            </div>
          </div>

          {customTintActive ? (
            <label className="part-popup-field">
              <span>VLT</span>
              <div className="part-popup-tint-custom-row">
                <input
                  type="number"
                  className="part-popup-vlt-input"
                  aria-label="Custom VLT"
                  min={5}
                  max={100}
                  value={tintConfig.vlt}
                  onChange={(event) =>
                    handleCustomTintChange(event.currentTarget.value)
                  }
                />
                <span className="part-popup-color-value">
                  {tintConfig.vlt}% VLT
                </span>
              </div>
            </label>
          ) : null}

          <div>
            <p className="part-popup-finish-label">Apply To</p>
            <div className="part-popup-finish-grid" aria-label="Apply To">
              {tintScopeOptions.map((scope) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={tintScope === scope.id}
                  key={scope.id}
                  onClick={() => onUpdateTintScope(scope.id)}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showLightTintEditor && lightTintConfig && lightTintScope ? (
        <div className="part-popup-wrap" aria-label="Light Tint options">
          <div>
            <p className="part-popup-finish-label">Shade</p>
            <div className="part-popup-finish-grid" aria-label="Shade">
              {lightTintShadeOptions.map((shade) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={
                    !customLightTintActive &&
                    lightTintConfig.darkness === shade.darkness
                  }
                  key={shade.label}
                  onClick={() => handleLightTintShadeSelect(shade.darkness)}
                >
                  {shade.label}
                </button>
              ))}
              <button
                type="button"
                className="part-popup-finish"
                data-selected={customLightTintActive}
                onClick={handleCustomLightTintSelect}
              >
                Custom
              </button>
            </div>
          </div>

          {customLightTintActive ? (
            <label className="part-popup-field">
              <span>Darkness</span>
              <div className="part-popup-tint-custom-row">
                <input
                  type="range"
                  className="part-popup-vlt-input"
                  aria-label="Custom tint darkness"
                  min={0}
                  max={100}
                  value={lightTintConfig.darkness}
                  onChange={(event) =>
                    handleCustomLightTintChange(event.currentTarget.value)
                  }
                />
                <span className="part-popup-color-value">
                  {lightTintConfig.darkness}%
                </span>
              </div>
            </label>
          ) : null}

          <div>
            <p className="part-popup-finish-label">Apply To</p>
            <div className="part-popup-finish-grid" aria-label="Apply To">
              {lightTintScopeOptions.map((scope) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={lightTintScope === scope.id}
                  key={scope.id}
                  onClick={() => onUpdateLightTintScope(scope.id)}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showChromeDeleteEditor && chromeDeleteConfig && chromeDeleteScope ? (
        <div className="part-popup-wrap" aria-label="Chrome Delete options">
          <label className="part-popup-field">
            <span>Color</span>
            <div className="part-popup-color-row">
              <input
                type="color"
                className="part-popup-color-input"
                value={chromeDeleteConfig.color}
                onChange={(event) =>
                  handleChromeDeleteColorChange(event.currentTarget.value)
                }
              />
              <input
                type="text"
                className="part-popup-hex-input"
                aria-label="Hex color"
                inputMode="text"
                maxLength={7}
                spellCheck={false}
                value={chromeDeleteHexValue}
                onBlur={handleChromeDeleteHexBlur}
                onChange={(event) =>
                  handleChromeDeleteHexChange(event.currentTarget.value)
                }
              />
            </div>
          </label>

          <div>
            <p className="part-popup-finish-label">Finish</p>
            <div className="part-popup-finish-grid" aria-label="Finish">
              {chromeDeleteFinishOptions.map((finish) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={chromeDeleteConfig.finish === finish.id}
                  key={finish.id}
                  onClick={() =>
                    onUpdateChromeDeleteDraft({ finish: finish.id })
                  }
                >
                  {finish.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="part-popup-finish-label">Apply To</p>
            <div className="part-popup-finish-grid" aria-label="Apply To">
              {chromeDeleteScopeOptions.map((scope) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={chromeDeleteScope === scope.id}
                  key={scope.id}
                  onClick={() => onUpdateChromeDeleteScope(scope.id)}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showCaliperPaintEditor && caliperPaintConfig && caliperPaintScope ? (
        <div className="part-popup-wrap" aria-label="Caliper Paint options">
          <label className="part-popup-field">
            <span>Color</span>
            <div className="part-popup-color-row">
              <input
                type="color"
                className="part-popup-color-input"
                value={caliperPaintConfig.color}
                onChange={(event) =>
                  handleCaliperPaintColorChange(event.currentTarget.value)
                }
              />
              <input
                type="text"
                className="part-popup-hex-input"
                aria-label="Hex color"
                inputMode="text"
                maxLength={7}
                spellCheck={false}
                value={caliperPaintHexValue}
                onBlur={handleCaliperPaintHexBlur}
                onChange={(event) =>
                  handleCaliperPaintHexChange(event.currentTarget.value)
                }
              />
            </div>
          </label>

          <div>
            <p className="part-popup-finish-label">Finish</p>
            <div className="part-popup-finish-grid" aria-label="Finish">
              {caliperPaintFinishOptions.map((finish) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={caliperPaintConfig.finish === finish.id}
                  key={finish.id}
                  onClick={() =>
                    onUpdateCaliperPaintDraft({ finish: finish.id })
                  }
                >
                  {finish.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="part-popup-finish-label">Apply To</p>
            <div className="part-popup-finish-grid" aria-label="Apply To">
              {caliperPaintScopeOptions.map((scope) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={caliperPaintScope === scope.id}
                  key={scope.id}
                  onClick={() => onUpdateCaliperPaintScope(scope.id)}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showPowderCoatEditor && powderCoatConfig && powderCoatScope ? (
        <div className="part-popup-wrap" aria-label="Powder Coat options">
          <label className="part-popup-field">
            <span>Color</span>
            <div className="part-popup-color-row">
              <input
                type="color"
                className="part-popup-color-input"
                value={powderCoatConfig.color}
                onChange={(event) =>
                  handlePowderCoatColorChange(event.currentTarget.value)
                }
              />
              <input
                type="text"
                className="part-popup-hex-input"
                aria-label="Hex color"
                inputMode="text"
                maxLength={7}
                spellCheck={false}
                value={powderCoatHexValue}
                onBlur={handlePowderCoatHexBlur}
                onChange={(event) =>
                  handlePowderCoatHexChange(event.currentTarget.value)
                }
              />
            </div>
          </label>

          <div>
            <p className="part-popup-finish-label">Finish</p>
            <div className="part-popup-finish-grid" aria-label="Finish">
              {powderCoatFinishOptions.map((finish) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={powderCoatConfig.finish === finish.id}
                  key={finish.id}
                  onClick={() =>
                    onUpdatePowderCoatDraft({ finish: finish.id })
                  }
                >
                  {finish.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="part-popup-finish-label">Apply To</p>
            <div className="part-popup-finish-grid" aria-label="Apply To">
              {powderCoatScopeOptions.map((scope) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={powderCoatScope === scope.id}
                  key={scope.id}
                  onClick={() => onUpdatePowderCoatScope(scope.id)}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showPpfEditor && ppfConfig ? (
        <div className="part-popup-wrap" aria-label="PPF options">
          <div>
            <p className="part-popup-finish-label">Finish</p>
            <div className="part-popup-finish-grid" aria-label="Finish">
              {ppfFinishOptions.map((finish) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={ppfConfig.finish === finish.id}
                  key={finish.id}
                  onClick={() => onUpdatePpfDraft({ finish: finish.id })}
                >
                  {finish.label}
                </button>
              ))}
            </div>
          </div>

          {ppfScope && ppfScopeOptions.length > 0 ? (
            <div>
              <p className="part-popup-finish-label">Apply To</p>
              <div className="part-popup-finish-grid" aria-label="Apply To">
                {ppfScopeOptions.map((scope) => (
                  <button
                    type="button"
                    className="part-popup-finish"
                    data-selected={ppfScope === scope.id}
                    key={scope.id}
                    onClick={() => onUpdatePpfScope(scope.id)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showCeramicEditor && ceramicConfig ? (
        <div className="part-popup-wrap" aria-label="Ceramic options">
          <div>
            <p className="part-popup-finish-label">State</p>
            <div className="part-popup-finish-grid" aria-label="State">
              <button
                type="button"
                className="part-popup-finish"
                data-selected={ceramicConfig.enabled}
                onClick={() => onUpdateCeramicDraft({ enabled: true })}
              >
                On
              </button>
              {target.id !== 'full-body' ? (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={!ceramicConfig.enabled}
                  onClick={() => onUpdateCeramicDraft({ enabled: false })}
                >
                  Off
                </button>
              ) : null}
            </div>
          </div>

          {ceramicScope && ceramicScopeOptions.length > 0 ? (
            <div>
              <p className="part-popup-finish-label">Apply To</p>
              <div className="part-popup-finish-grid" aria-label="Apply To">
                {ceramicScopeOptions.map((scope) => (
                  <button
                    type="button"
                    className="part-popup-finish"
                    data-selected={ceramicScope === scope.id}
                    key={scope.id}
                    onClick={() => onUpdateCeramicScope(scope.id)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showArtworkEditor && artworkConfig ? (
        <div className="part-popup-wrap" aria-label="Artwork options">
          <label className="part-popup-field">
            <span>Upload</span>
            <input
              type="file"
              className="part-popup-file-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                handleArtworkUpload(event.currentTarget.files)
              }
            />
          </label>

          {artworkConfig.error ? (
            <p className="part-popup-warning" role="alert">
              {artworkConfig.error}
            </p>
          ) : null}

          {artworkConfig.lowResolution ? (
            <p className="part-popup-warning">Low Resolution</p>
          ) : null}

          {artworkConfig.fileName ? (
            <p className="part-popup-file-name">{artworkConfig.fileName}</p>
          ) : null}

          <div>
            <p className="part-popup-finish-label">Mode</p>
            <div className="part-popup-finish-grid" aria-label="Artwork mode">
              {artworkModeOptions.map((mode) => (
                <button
                  type="button"
                  className="part-popup-finish"
                  data-selected={artworkConfig.mode === mode.id}
                  key={mode.id}
                  onClick={() => handleArtworkModeSelect(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {artworkConfig.imageSource && artworkConfig.mode === 'place' ? (
            <>
              <label className="part-popup-field">
                <span>Size</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={0.12}
                    max={2.2}
                    step={0.02}
                    value={artworkConfig.scale}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        scale: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {artworkConfig.scale.toFixed(2)}
                  </span>
                </div>
              </label>

              <label className="part-popup-field">
                <span>Rotate</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={-180}
                    max={180}
                    step={1}
                    value={artworkConfig.rotation}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        rotation: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {Math.round(artworkConfig.rotation)} deg
                  </span>
                </div>
              </label>
            </>
          ) : null}

          {artworkConfig.imageSource && artworkConfig.mode === 'fill' ? (
            <>
              <label className="part-popup-field">
                <span>Scale</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={1}
                    max={4}
                    step={0.05}
                    value={artworkConfig.scale}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        scale: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {artworkConfig.scale.toFixed(2)}
                  </span>
                </div>
              </label>

              <label className="part-popup-field">
                <span>Horizontal offset</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={artworkConfig.offsetX}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        offsetX: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {artworkConfig.offsetX.toFixed(2)}
                  </span>
                </div>
              </label>

              <label className="part-popup-field">
                <span>Vertical offset</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={artworkConfig.offsetY}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        offsetY: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {artworkConfig.offsetY.toFixed(2)}
                  </span>
                </div>
              </label>

              <label className="part-popup-field">
                <span>Rotate</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={-180}
                    max={180}
                    step={1}
                    value={artworkConfig.rotation}
                    onChange={(event) =>
                      onUpdateArtworkDraft({
                        rotation: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {Math.round(artworkConfig.rotation)} deg
                  </span>
                </div>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {showFreeArtEditor && freeArtworkConfig ? (
        <div className="part-popup-wrap" aria-label="Free Art options">
          <label className="part-popup-field">
            <span>Upload</span>
            <input
              type="file"
              className="part-popup-file-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                handleFreeArtworkUpload(event.currentTarget.files)
              }
            />
          </label>

          {freeArtworkConfig.error ? (
            <p className="part-popup-warning" role="alert">
              {freeArtworkConfig.error}
            </p>
          ) : null}

          {freeArtworkConfig.lowResolution ? (
            <p className="part-popup-warning">Low Resolution</p>
          ) : null}

          {freeArtworkConfig.pendingFileName ? (
            <p className="part-popup-file-name">
              {freeArtworkConfig.pendingFileName}
            </p>
          ) : null}

          <button
            type="button"
            className="part-popup-apply part-popup-add"
            disabled={!freeArtworkConfig.pendingImageSource}
            onClick={onAddFreeArtwork}
          >
            Add
          </button>

          {freeArtworkConfig.items.length > 0 ? (
            <div>
              <p className="part-popup-finish-label">Place</p>
              <div className="part-popup-finish-grid" aria-label="Free Art items">
                {freeArtworkConfig.items.map((item, index) => (
                  <button
                    type="button"
                    className="part-popup-finish"
                    data-selected={
                      freeArtworkConfig.selectedItemId === item.id
                    }
                    key={item.id}
                    onClick={() => onSelectFreeArtwork(item.id)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {selectedFreeArtworkItem ? (
            <>
              <p className="part-popup-file-name">
                {selectedFreeArtworkIndex >= 0
                  ? `Item ${selectedFreeArtworkIndex + 1}: `
                  : ''}
                {selectedFreeArtworkItem.fileName}
              </p>

              <label className="part-popup-field">
                <span>Size</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={0.16}
                    max={5}
                    step={0.04}
                    value={selectedFreeArtworkItem.uniformScale}
                    onChange={(event) =>
                      onUpdateFreeArtworkItem(selectedFreeArtworkItem.id, {
                        uniformScale: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {selectedFreeArtworkItem.uniformScale.toFixed(2)}
                  </span>
                </div>
              </label>

              <label className="part-popup-field">
                <span>Rotate</span>
                <div className="part-popup-tint-custom-row">
                  <input
                    type="range"
                    className="part-popup-vlt-input"
                    min={-180}
                    max={180}
                    step={1}
                    value={selectedFreeArtworkItem.rotation}
                    onChange={(event) =>
                      onUpdateFreeArtworkItem(selectedFreeArtworkItem.id, {
                        rotation: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span className="part-popup-color-value">
                    {Math.round(selectedFreeArtworkItem.rotation)} deg
                  </span>
                </div>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {showServiceList ? (
        <div className="part-popup-services" aria-label="Services">
          {target.services.map((serviceId) => {
            const service = getService(serviceId)

            return (
              <button
                type="button"
                className="part-popup-service"
                data-selected={selectedServiceId === serviceId}
                key={service.id}
                onClick={() => onSelectService(service.id)}
              >
                {service.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {showWrapEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetWrap ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetWrap}
            >
              Reset
            </button>
          ) : null}
          {canResetAllWraps ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetAllWraps}
            >
              Reset All
            </button>
          ) : null}
          {canApplyAllWraps ? (
            <button
              type="button"
              className="part-popup-apply"
              onClick={onApplyAll}
            >
              Apply All
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showTintEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetTint ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetTint}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showLightTintEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetLightTint ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetLightTint}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showChromeDeleteEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetChromeDelete ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetChromeDelete}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showCaliperPaintEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetCaliperPaint ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetCaliperPaint}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showPowderCoatEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetPowderCoat ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetPowderCoat}
            >
              Reset
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showPpfEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetPpf ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetPpf}
            >
              Reset
            </button>
          ) : null}
          {canResetAllPpf ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetAllPpf}
            >
              Reset All
            </button>
          ) : null}
          {canApplyAllPpf ? (
            <button
              type="button"
              className="part-popup-apply"
              onClick={onApplyAll}
            >
              Apply All
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showCeramicEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canResetCeramic ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetCeramic}
            >
              Reset
            </button>
          ) : null}
          {canResetAllCeramic ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onResetAllCeramic}
            >
              Reset All
            </button>
          ) : null}
          {canApplyAllCeramic ? (
            <button
              type="button"
              className="part-popup-apply"
              onClick={onApplyAll}
            >
              Apply All
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : showArtworkEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {canRemoveArtwork ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onRemoveArtwork}
            >
              Remove
            </button>
          ) : null}
          {canRemoveAllArtwork ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onRemoveAllArtwork}
            >
              Remove All
            </button>
          ) : null}
          <button
            type="button"
            className="part-popup-apply"
            disabled={!artworkConfig?.imageSource}
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      ) : showFreeArtEditor ? (
        <div className="part-popup-actions part-popup-actions--wrap">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          <button type="button" className="part-popup-link" onClick={onCancel}>
            Cancel
          </button>
          {selectedFreeArtworkItem ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={() => onDuplicateFreeArtwork(selectedFreeArtworkItem.id)}
            >
              Duplicate
            </button>
          ) : null}
          {selectedFreeArtworkItem ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={() => onDeleteFreeArtwork(selectedFreeArtworkItem.id)}
            >
              Delete
            </button>
          ) : null}
          {freeArtworkConfig && freeArtworkConfig.items.length > 0 ? (
            <button
              type="button"
              className="part-popup-link"
              onClick={onDeleteAllFreeArtwork}
            >
              Delete All
            </button>
          ) : null}
          <button type="button" className="part-popup-apply" onClick={onApply}>
            Apply
          </button>
        </div>
      ) : (
        <div className="part-popup-actions">
          <button type="button" className="part-popup-link" onClick={onBack}>
            Back
          </button>
          {selectedServiceId ? (
            <button type="button" className="part-popup-apply" onClick={onApply}>
              Apply
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
