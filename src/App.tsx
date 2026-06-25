import { useMemo, useReducer, useRef, type PointerEvent } from 'react'
import { FULL_BODY_TARGET_ID, getSelectionTarget } from './config/vehicleParts'
import { PartServicePopup } from './components/viewer/PartServicePopup'
import {
  VehicleViewer,
  type VehicleViewerHandle,
} from './components/viewer/VehicleViewer'
import {
  configuratorReducer,
  initialConfiguratorState,
} from './state/configuratorReducer'
import './App.css'

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
  const [configuratorState, dispatch] = useReducer(
    configuratorReducer,
    initialConfiguratorState,
  )

  const activeTarget = useMemo(() => {
    const draftSelection = configuratorState.draftSelection

    if (!draftSelection) {
      return null
    }

    return getSelectionTarget(draftSelection.targetId)
  }, [configuratorState.draftSelection])

  function handleShellPointerDown(event: PointerEvent<HTMLElement>) {
    if (!configuratorState.draftSelection) {
      return
    }

    if (!(event.target instanceof Element)) {
      return
    }

    if (
      event.target.closest('[data-popup-root]') ||
      event.target.closest('.vehicle-viewer-canvas')
    ) {
      return
    }

    dispatch({ type: 'cancel-draft' })
  }

  function handleBack() {
    if (configuratorState.draftSelection?.serviceId) {
      dispatch({ type: 'clear-service' })
    } else {
      dispatch({ type: 'cancel-draft' })
    }
  }

  return (
    <main
      className="studio-shell"
      aria-label="ModifyWrap 3D S4 Demo"
      onPointerDownCapture={handleShellPointerDown}
    >
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
        <section className="viewer-panel" aria-labelledby="viewer-heading">
          <h2 id="viewer-heading" className="visually-hidden">
            Vehicle viewer
          </h2>
          <VehicleViewer
            ref={vehicleViewerRef}
            selectedTargetId={configuratorState.draftSelection?.targetId ?? null}
            onPartSelect={(partId) =>
              dispatch({ type: 'select-target', targetId: partId })
            }
            onScenePointerMissed={() => dispatch({ type: 'cancel-draft' })}
          />
          <button
            type="button"
            className="full-body-action"
            onClick={() =>
              dispatch({ type: 'select-target', targetId: FULL_BODY_TARGET_ID })
            }
          >
            Full Body
          </button>
          {activeTarget ? (
            <PartServicePopup
              target={activeTarget}
              selectedServiceId={
                configuratorState.draftSelection?.serviceId ?? null
              }
              onApply={() => dispatch({ type: 'apply-draft' })}
              onBack={handleBack}
              onClose={() => dispatch({ type: 'cancel-draft' })}
              onSelectService={(serviceId) =>
                dispatch({ type: 'select-service', serviceId })
              }
            />
          ) : null}
        </section>
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
