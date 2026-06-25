import { getService } from '../../config/services'
import type { ServiceId, VehiclePartDefinition } from '../../types/configurator'

type PartServicePopupProps = {
  target: VehiclePartDefinition
  selectedServiceId: ServiceId | null
  onApply: () => void
  onBack: () => void
  onClose: () => void
  onSelectService: (serviceId: ServiceId) => void
}

export function PartServicePopup({
  target,
  selectedServiceId,
  onApply,
  onBack,
  onClose,
  onSelectService,
}: PartServicePopupProps) {
  return (
    <section
      className="part-popup"
      data-popup-root
      aria-label={`${target.label} services`}
    >
      <div className="part-popup-header">
        <h2>{target.label.toUpperCase()}</h2>
        <button type="button" className="part-popup-link" onClick={onClose}>
          Close
        </button>
      </div>

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
    </section>
  )
}
