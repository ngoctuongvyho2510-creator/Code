import { useState } from 'react'
import { getService } from '../../config/services'
import type {
  ArtworkDraftState,
  ArtworkMode,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintScope,
  CaliperPaintScopeOption,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  ChromeDeleteScopeOption,
  LightTintConfig,
  LightTintScope,
  LightTintScopeOption,
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
const lowResolutionShortEdgeThreshold = 256
const lowResolutionLongEdgeThreshold = 600

type PartServicePopupProps = {
  target: VehiclePartDefinition
  selectedServiceId: ServiceId | null
  artworkConfig: ArtworkDraftState | null
  caliperPaintConfig: CaliperPaintConfig | null
  caliperPaintScope: CaliperPaintScope | null
  caliperPaintScopeOptions: readonly CaliperPaintScopeOption[]
  powderCoatConfig: PowderCoatConfig | null
  powderCoatScope: PowderCoatScope | null
  powderCoatScopeOptions: readonly PowderCoatScopeOption[]
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
  canResetAllWraps: boolean
  canResetCaliperPaint: boolean
  canResetChromeDelete: boolean
  canResetLightTint: boolean
  canResetPowderCoat: boolean
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
  onResetCaliperPaint: () => void
  onResetChromeDelete: () => void
  onResetLightTint: () => void
  onResetPowderCoat: () => void
  onResetTint: () => void
  onResetWrap: () => void
  onRemoveArtwork: () => void
  onRemoveAllArtwork: () => void
  onSelectService: (serviceId: ServiceId) => void
  onUpdateArtworkDraft: (patch: Partial<ArtworkDraftState>) => void
  onUpdateCaliperPaintDraft: (patch: Partial<CaliperPaintConfig>) => void
  onUpdateCaliperPaintScope: (scope: CaliperPaintScope) => void
  onUpdatePowderCoatDraft: (patch: Partial<PowderCoatConfig>) => void
  onUpdatePowderCoatScope: (scope: PowderCoatScope) => void
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
  canApplyAllWraps,
  canRemoveAllArtwork,
  canRemoveArtwork,
  canResetAllWraps,
  canResetCaliperPaint,
  canResetChromeDelete,
  canResetLightTint,
  canResetPowderCoat,
  canResetTint,
  canResetWrap,
  caliperPaintConfig,
  caliperPaintScope,
  caliperPaintScopeOptions,
  powderCoatConfig,
  powderCoatScope,
  powderCoatScopeOptions,
  lightTintConfig,
  lightTintScope,
  lightTintScopeOptions,
  chromeDeleteConfig,
  chromeDeleteScope,
  chromeDeleteScopeOptions,
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
  onResetAllWraps,
  onResetCaliperPaint,
  onResetChromeDelete,
  onResetLightTint,
  onResetPowderCoat,
  onResetTint,
  onResetWrap,
  onRemoveAllArtwork,
  onRemoveArtwork,
  onSelectService,
  onUpdateArtworkDraft,
  onUpdateCaliperPaintDraft,
  onUpdateCaliperPaintScope,
  onUpdatePowderCoatDraft,
  onUpdatePowderCoatScope,
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
  const showArtworkEditor =
    selectedServiceId === 'artwork' && artworkConfig !== null
  const showServiceList =
    !showWrapEditor &&
    !showTintEditor &&
    !showLightTintEditor &&
    !showChromeDeleteEditor &&
    !showCaliperPaintEditor &&
    !showPowderCoatEditor &&
    !showArtworkEditor
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

  function handleArtworkUpload(fileList: FileList | null) {
    const file = fileList?.[0]

    if (!file) {
      return
    }

    if (!supportedArtworkMimeTypes.has(file.type)) {
      onUpdateArtworkDraft({
        imageSource: null,
        fileName: '',
        imageWidth: 0,
        imageHeight: 0,
        aspectRatio: 1,
        lowResolution: false,
        error: 'Unsupported file type',
      })
      return
    }

    const reader = new FileReader()

    reader.onerror = () => {
      onUpdateArtworkDraft({
        imageSource: null,
        fileName: '',
        imageWidth: 0,
        imageHeight: 0,
        aspectRatio: 1,
        lowResolution: false,
        error: 'Upload failed',
      })
    }

    reader.onload = () => {
      const imageSource = reader.result

      if (typeof imageSource !== 'string') {
        onUpdateArtworkDraft({
          imageSource: null,
          fileName: '',
          imageWidth: 0,
          imageHeight: 0,
          aspectRatio: 1,
          lowResolution: false,
          error: 'Upload failed',
        })
        return
      }

      const image = new Image()

      image.onerror = () => {
        onUpdateArtworkDraft({
          imageSource: null,
          fileName: '',
          imageWidth: 0,
          imageHeight: 0,
          aspectRatio: 1,
          lowResolution: false,
          error: 'Upload failed',
        })
      }

      image.onload = () => {
        onUpdateArtworkDraft({
          imageSource,
          fileName: file.name,
          imageWidth: image.naturalWidth,
          imageHeight: image.naturalHeight,
          aspectRatio: image.naturalWidth / image.naturalHeight,
          lowResolution: isLowResolutionArtwork(
            image.naturalWidth,
            image.naturalHeight,
          ),
          error: null,
        })
      }

      image.src = imageSource
    }

    reader.readAsDataURL(file)
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
