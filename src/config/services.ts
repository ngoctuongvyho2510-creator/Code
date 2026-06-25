import type { ServiceDefinition, ServiceId } from '../types/configurator'

export const SERVICES = [
  { id: 'wrap', label: 'Wrap' },
  { id: 'artwork', label: 'Artwork' },
  { id: 'ppf', label: 'PPF' },
  { id: 'ceramic', label: 'Ceramic' },
  { id: 'chrome-delete', label: 'Chrome Delete' },
  { id: 'tint', label: 'Tint' },
  { id: 'remove', label: 'Remove' },
  { id: 'powder-coat', label: 'Powder Coat' },
  { id: 'caliper-paint', label: 'Caliper Paint' },
  { id: 'performance', label: 'Performance' },
] as const satisfies readonly ServiceDefinition[]

const serviceById = new Map<ServiceId, ServiceDefinition>(
  SERVICES.map((service) => [service.id, service]),
)

export function getService(serviceId: ServiceId): ServiceDefinition {
  const service = serviceById.get(serviceId)

  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`)
  }

  return service
}
