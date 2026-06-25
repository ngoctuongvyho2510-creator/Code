import { useState } from 'react'
import { getService } from '../../config/services'
import type {
  ServiceId,
  VehiclePartDefinition,
  WrapConfig,
  WrapFinish,
} from '../../types/configurator'

const wrapFinishOptions = [
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
] as const satisfies readonly { id: WrapFinish; label: string }[]

const validHexColorPattern = /^#[0-9A-F]{6}$/
const partialHexColorPattern = /^#[0-9A-F]{0,6}$/

type PartServicePopupProps = {
  target: VehiclePartDefinition
  selectedServiceId: ServiceId | null
  wrapConfig: WrapConfig | null
  canApplyAllWraps: boolean
  canResetAllWraps: boolean
  canResetWrap: boolean
  onApply: () => void
  onApplyAll: () => void
  onBack: () => void
  onCancel: () => void
  onClose: () => void
  onResetAllWraps: () => void
  onResetWrap: () => void
  onSelectService: (serviceId: ServiceId) => void
  onUpdateWrapDraft: (patch: Partial<WrapConfig>) => void
}

export function PartServicePopup({
  canApplyAllWraps,
  canResetAllWraps,
  canResetWrap,
  target,
  selectedServiceId,
  wrapConfig,
  onApply,
  onApplyAll,
  onBack,
  onCancel,
  onClose,
  onResetAllWraps,
  onResetWrap,
  onSelectService,
  onUpdateWrapDraft,
}: PartServicePopupProps) {
  const showWrapEditor = selectedServiceId === 'wrap' && wrapConfig
  const syncedHexValue = wrapConfig?.color.toUpperCase() ?? '#C49D59'
  const [hexInput, setHexInput] = useState<{
    source: string
    value: string
  } | null>(null)
  const hexValue =
    hexInput?.source === syncedHexValue ? hexInput.value : syncedHexValue

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

      {showWrapEditor ? (
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
      ) : (
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
      )}

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
