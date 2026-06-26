import { useState } from 'react'
import { getService } from '../../config/services'
import type {
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintScope,
  CaliperPaintScopeOption,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  ChromeDeleteScopeOption,
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

const validHexColorPattern = /^#[0-9A-F]{6}$/
const partialHexColorPattern = /^#[0-9A-F]{0,6}$/
const tintShadeOptions = [70, 50, 35, 20, 5] as const
const tintShadeOptionSet = new Set<number>(tintShadeOptions)

type PartServicePopupProps = {
  target: VehiclePartDefinition
  selectedServiceId: ServiceId | null
  caliperPaintConfig: CaliperPaintConfig | null
  caliperPaintScope: CaliperPaintScope | null
  caliperPaintScopeOptions: readonly CaliperPaintScopeOption[]
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
  canResetTint: boolean
  canResetWrap: boolean
  onApply: () => void
  onApplyAll: () => void
  onBack: () => void
  onCancel: () => void
  onClose: () => void
  onResetAllWraps: () => void
  onResetCaliperPaint: () => void
  onResetChromeDelete: () => void
  onResetTint: () => void
  onResetWrap: () => void
  onSelectService: (serviceId: ServiceId) => void
  onUpdateCaliperPaintDraft: (patch: Partial<CaliperPaintConfig>) => void
  onUpdateCaliperPaintScope: (scope: CaliperPaintScope) => void
  onUpdateChromeDeleteDraft: (patch: Partial<ChromeDeleteConfig>) => void
  onUpdateChromeDeleteScope: (scope: ChromeDeleteScope) => void
  onUpdateTintDraft: (patch: Partial<TintConfig>) => void
  onUpdateTintScope: (scope: TintScope) => void
  onUpdateWrapDraft: (patch: Partial<WrapConfig>) => void
}

export function PartServicePopup({
  canApplyAllWraps,
  canResetAllWraps,
  canResetCaliperPaint,
  canResetChromeDelete,
  canResetTint,
  canResetWrap,
  caliperPaintConfig,
  caliperPaintScope,
  caliperPaintScopeOptions,
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
  onResetTint,
  onResetWrap,
  onSelectService,
  onUpdateCaliperPaintDraft,
  onUpdateCaliperPaintScope,
  onUpdateChromeDeleteDraft,
  onUpdateChromeDeleteScope,
  onUpdateTintDraft,
  onUpdateTintScope,
  onUpdateWrapDraft,
}: PartServicePopupProps) {
  const showWrapEditor = selectedServiceId === 'wrap' && wrapConfig !== null
  const showTintEditor =
    selectedServiceId === 'tint' && tintConfig !== null && tintScope !== null
  const showChromeDeleteEditor =
    selectedServiceId === 'chrome-delete' &&
    chromeDeleteConfig !== null &&
    chromeDeleteScope !== null
  const showCaliperPaintEditor =
    selectedServiceId === 'caliper-paint' &&
    caliperPaintConfig !== null &&
    caliperPaintScope !== null
  const showServiceList =
    !showWrapEditor &&
    !showTintEditor &&
    !showChromeDeleteEditor &&
    !showCaliperPaintEditor
  const syncedHexValue = wrapConfig?.color.toUpperCase() ?? '#C49D59'
  const syncedChromeDeleteHexValue =
    chromeDeleteConfig?.color.toUpperCase() ?? '#050505'
  const syncedCaliperPaintHexValue =
    caliperPaintConfig?.color.toUpperCase() ?? '#D51F28'
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
  const [customTint, setCustomTint] = useState<{
    active: boolean
    source: number
  } | null>(null)
  const customTintActive = tintConfig
    ? customTint?.source === tintConfig.vlt
      ? customTint.active
      : !tintShadeOptionSet.has(tintConfig.vlt)
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
