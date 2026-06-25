import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { Bounds, OrbitControls, useProgress } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { MOUSE, TOUCH } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { S4Model } from './S4Model'
import { ViewerErrorBoundary } from './ViewerErrorBoundary'
import type {
  AppliedDesignState,
  TintPreviewState,
  WrapPreviewState,
} from '../../types/configurator'
import './VehicleViewer.css'

const INITIAL_VIEW_SAVE_DELAY_MS = 1100
const MIN_POLAR_ANGLE = 0.01
const MAX_POLAR_ANGLE = Math.PI - 0.01

export type VehicleViewerHandle = {
  resetView: () => void
}

type VehicleViewerProps = {
  appliedDesign: AppliedDesignState
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
  onPartSelect: (partId: string) => void
  onScenePointerMissed: () => void
}

function LoadingOverlay() {
  const { active, progress } = useProgress()

  if (!active) {
    return null
  }

  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="vehicle-viewer-overlay" role="status" aria-live="polite">
      <div className="vehicle-viewer-loading-card">
        <span className="vehicle-viewer-kicker">Loading model</span>
        <strong>Mahir S4</strong>
        <span>{roundedProgress}%</span>
      </div>
    </div>
  )
}

function VehicleErrorState() {
  return (
    <div className="vehicle-viewer-error" role="alert">
      <div>
        <span className="vehicle-viewer-kicker">Viewer unavailable</span>
        <h3>Vehicle viewer could not start</h3>
        <p>Open the browser Console for the exact runtime error and stack trace.</p>
      </div>
    </div>
  )
}

function StudioLighting() {
  return (
    <>
      <hemisphereLight args={['#f4efe5', '#12100d', 0.72]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        castShadow
        color="#fff2d8"
        intensity={2.25}
        position={[5.5, 7, 4.5]}
        shadow-bias={-0.00008}
        shadow-camera-bottom={-12}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-near={0.5}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <directionalLight color="#d9dde4" intensity={0.95} position={[-5, 4, 3]} />
      <directionalLight color="#fff8ea" intensity={0.55} position={[0, 3.2, -6]} />
    </>
  )
}

type InitialViewStateProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  onResetReady: (resetView: () => void) => void
}

function InitialViewState({ controlsRef, onResetReady }: InitialViewStateProps) {
  const { camera } = useThree()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const controls = controlsRef.current

      if (!controls) {
        return
      }

      controls.saveState()
      onResetReady(() => {
        controls.reset()
        camera.updateProjectionMatrix()
      })
    }, INITIAL_VIEW_SAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [camera, controlsRef, onResetReady])

  return null
}

type ViewerSceneProps = {
  appliedDesign: AppliedDesignState
  onResetReady: (resetView: () => void) => void
  onPartSelect: (partId: string) => void
  onScenePointerMissed: () => void
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
}

function ViewerScene({
  appliedDesign,
  onPartSelect,
  onResetReady,
  onScenePointerMissed,
  selectedTargetId,
  tintPreview,
  wrapPreview,
}: ViewerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <>
      <color attach="background" args={['#090a0c']} />
      <StudioLighting />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate={false}
        dampingFactor={0.08}
        enableDamping
        enablePan
        maxDistance={80}
        maxPolarAngle={MAX_POLAR_ANGLE}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
        minDistance={2}
        minPolarAngle={MIN_POLAR_ANGLE}
        screenSpacePanning
        touches={{
          ONE: TOUCH.ROTATE,
          TWO: TOUCH.DOLLY_PAN,
        }}
      />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.18} maxDuration={0.9}>
          <InitialViewState controlsRef={controlsRef} onResetReady={onResetReady} />
          <S4Model
            appliedDesign={appliedDesign}
            controlsRef={controlsRef}
            selectedTargetId={selectedTargetId}
            tintPreview={tintPreview}
            wrapPreview={wrapPreview}
            onPartSelect={onPartSelect}
            onSelectionClear={onScenePointerMissed}
          />
        </Bounds>
      </Suspense>
    </>
  )
}

export const VehicleViewer = forwardRef<VehicleViewerHandle, VehicleViewerProps>(
  function VehicleViewer(
    {
      appliedDesign,
      onPartSelect,
      onScenePointerMissed,
      selectedTargetId,
      tintPreview,
      wrapPreview,
    },
    ref,
  ) {
  const resetViewRef = useRef<() => void>(() => undefined)

  const handleResetReady = useCallback((resetView: () => void) => {
    resetViewRef.current = resetView
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => {
        resetViewRef.current()
      },
    }),
    [],
  )

  return (
    <div
      className="vehicle-viewer"
      aria-describedby="vehicle-viewer-fallback"
      aria-label="Interactive Mahir S4 3D viewer"
      role="region"
    >
      <p id="vehicle-viewer-fallback" className="vehicle-viewer-accessible-fallback">
        Interactive 3D viewer for the 2013 Audi S4. The model is loaded from
        /Mahir S4.glb.
      </p>
      <ViewerErrorBoundary fallback={<VehicleErrorState />}>
        <Canvas
          aria-hidden="true"
          camera={{ fov: 35, near: 0.1, far: 100, position: [5.4, 2.7, 6.2] }}
          className="vehicle-viewer-canvas"
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows="percentage"
        >
          <ViewerScene
            appliedDesign={appliedDesign}
            selectedTargetId={selectedTargetId}
            tintPreview={tintPreview}
            wrapPreview={wrapPreview}
            onPartSelect={onPartSelect}
            onScenePointerMissed={onScenePointerMissed}
            onResetReady={handleResetReady}
          />
        </Canvas>
      </ViewerErrorBoundary>
      <LoadingOverlay />
    </div>
  )
  },
)
