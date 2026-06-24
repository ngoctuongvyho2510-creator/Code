import { useRef } from 'react'
import {
  VehicleViewer,
  type VehicleViewerHandle,
} from './components/viewer/VehicleViewer'
import './App.css'

const services = [
  'Wrap',
  'Chrome Delete',
  'Window Tint',
  'PPF',
  'Ceramic Coating',
  'Caliper Paint',
  'Powder Coating',
  'Custom Artwork',
  'Add-ons',
]

const configurationSections = [
  'Selected Service',
  'Vehicle Part',
  'Material',
  'Finish',
]

const viewerControls = [
  'Reset View',
  'Front Left',
  'Front Right',
  'Left',
  'Right',
  'Top',
  'Fullscreen',
]

function App() {
  const vehicleViewerRef = useRef<VehicleViewerHandle>(null)

  return (
    <main className="studio-shell" aria-label="ModifyWrap 3D S4 Demo">
      <header className="studio-header">
        <div className="brand-lockup">
          <img className="brand-logo" src="/Logo.png" alt="ModifyWrap logo" />
          <div>
            <h1 className="studio-title">MODIFYWRAP 3D STUDIO</h1>
            <p className="vehicle-name">2013 Audi S4</p>
          </div>
        </div>

        <div className="header-actions" aria-label="Design actions">
          <button type="button" className="primary-action">
            Save My Design
          </button>
          <button type="button" className="secondary-action">
            Request a Quote
          </button>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="services-panel" aria-labelledby="services-heading">
          <h2 id="services-heading">Services</h2>
          <nav aria-label="Customization services">
            <ul className="services-list">
              {services.map((service) => (
                <li key={service}>
                  <button type="button" className="service-button">
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <section className="viewer-panel" aria-labelledby="viewer-heading">
          <h2 id="viewer-heading" className="visually-hidden">
            Vehicle viewer
          </h2>
          <VehicleViewer ref={vehicleViewerRef} />
        </section>

        <aside className="configuration-panel" aria-labelledby="configuration-heading">
          <h2 id="configuration-heading">Configuration</h2>
          <div className="configuration-sections">
            {configurationSections.map((section) => (
              <section className="configuration-section" key={section}>
                <h3>{section}</h3>
                <p>Not selected</p>
              </section>
            ))}
          </div>
        </aside>
      </div>

      <footer className="viewer-toolbar" aria-label="Viewer toolbar">
        {viewerControls.map((control) => (
          <button
            type="button"
            className="toolbar-button"
            key={control}
            onClick={
              control === 'Reset View'
                ? () => vehicleViewerRef.current?.resetView()
                : undefined
            }
          >
            {control}
          </button>
        ))}
      </footer>
    </main>
  )
}

export default App
