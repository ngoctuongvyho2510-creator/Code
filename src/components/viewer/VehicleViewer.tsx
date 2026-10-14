import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Bounds, OrbitControls, useProgress } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  ACESFilmicToneMapping,
  MOUSE,
  SRGBColorSpace,
  TOUCH,
  Vector3,
} from 'three'
import type { RootState } from '@react-three/fiber'
import type { PointLight } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { S4Model } from './S4Model'
import { ViewerErrorBoundary } from './ViewerErrorBoundary'
import {
  StudioEnvironment,
  type LightingMode,
} from '../../three/environment/StudioEnvironment'
import { setWrapLightingState } from '../../three/materials/wrapMaterialShaders'
import type {
  AppliedDesignState,
  ArtworkDraftState,
  ArtworkPreviewState,
  CaliperPaintPreviewState,
  CeramicPreviewState,
  ChromeDeletePreviewState,
  FreeArtworkItem,
  FreeArtworkPreviewState,
  LightTintPreviewState,
  PpfPreviewState,
  PowderCoatPreviewState,
  TintPreviewState,
  WrapPreviewState,
} from '../../types/configurator'
import './VehicleViewer.css'

const INITIAL_VIEW_SAVE_DELAY_MS = 1100
const MIN_POLAR_ANGLE = 0.01
const MAX_POLAR_ANGLE = Math.PI - 0.01
const desktopDprRange: [number, number] = [1, 1.5]
const mobileDprRange: [number, number] = [1, 1.25]


type LightingPreset = {
  ambientIntensity: number
  background: string
  exposure: number
  frontFillIntensity: number
  hemisphereGround: string
  hemisphereIntensity: number
  hemisphereSky: string
  inspectionColor: string
  inspectionIntensity: number
  inspectionPosition: [number, number, number]
  keyIntensity: number
  leftFillIntensity: number
  rightFillIntensity: number
  shaderLightIntensity: number
}

const lightingPresets = {
  studio: {
  ambientIntensity: 0.10,
  background: '#090a0c',

  exposure: 0.96,

  frontFillIntensity: 0.30,
  hemisphereGround: '#5a6068',
  hemisphereIntensity: 0.66,
  hemisphereSky: '#ffffff',

  inspectionColor: '#ffffff',
  inspectionIntensity: 82,
  inspectionPosition: [5.5, 3.8, 4.8],

  keyIntensity: 0.50,
  leftFillIntensity: 0.29,
  rightFillIntensity: 0.18,

  shaderLightIntensity: 0.72,
},
  day: {
    ambientIntensity: 0.2,
    background: '#91a9ba',
    exposure: 1.02,
    frontFillIntensity: 0.56,
    hemisphereGround: '#8b765d',
    hemisphereIntensity: 1.08,
    hemisphereSky: '#e9f5ff',
    inspectionColor: '#fff4df',
    inspectionIntensity: 82,
    inspectionPosition: [6.2, 5.4, 4.2],
    keyIntensity: 0.92,
    leftFillIntensity: 0.34,
    rightFillIntensity: 0.28,
    shaderLightIntensity: 0.66,
  },
  night: {
    ambientIntensity: 0.035,
    background: '#02040a',
    exposure: 1.18,
    frontFillIntensity: 0.18,
    hemisphereGround: '#07090d',
    hemisphereIntensity: 0.24,
    hemisphereSky: '#29456f',
    inspectionColor: '#dceaff',
    inspectionIntensity: 145,
    inspectionPosition: [4.8, 2.7, 5.8],
    keyIntensity: 0.2,
    leftFillIntensity: 0.12,
    rightFillIntensity: 0.1,
    shaderLightIntensity: 0.92,
  },
} satisfies Record<LightingMode, LightingPreset>

function getViewerDprRange(): [number, number] {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  ) {
    return mobileDprRange
  }

  return desktopDprRange
}

export type ViewerNamedView =
  | 'frontLeft'
  | 'frontRight'
  | 'left'
  | 'right'
  | 'top'

export type VehicleViewerHandle = {
  resetView: () => void
  setNamedView: (view: ViewerNamedView) => void
  toggleFullscreen: () => void
}

type VehicleViewerProps = {
  appliedDesign: AppliedDesignState
  artworkPreview: ArtworkPreviewState | null
  caliperPaintPreview: CaliperPaintPreviewState | null
  chromeDeletePreview: ChromeDeletePreviewState | null
  ceramicPreview: CeramicPreviewState | null
  freeArtworkPreview: FreeArtworkPreviewState | null
  lightTintPreview: LightTintPreviewState | null
  lightingMode: LightingMode
  inspectionSweep: boolean
  ppfPreview: PpfPreviewState | null
  powderCoatPreview: PowderCoatPreviewState | null
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
  onArtworkPreviewTransformChange: (patch: Partial<ArtworkDraftState>) => void
  onFreeArtworkTransformChange: (
    artworkId: string,
    patch: Partial<FreeArtworkItem>,
  ) => void
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

function RendererSettings({ mode }: { mode: LightingMode }) {
  const { gl, invalidate } = useThree()
  const preset = lightingPresets[mode]

  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace
    gl.toneMapping = ACESFilmicToneMapping
    gl.toneMappingExposure = preset.exposure
    invalidate()
  }, [gl, invalidate, preset.exposure])

  return null
}

function InspectionLight({
  autoSweep,
  mode,
}: {
  autoSweep: boolean
  mode: LightingMode
}) {
  const lightRef = useRef<PointLight | null>(null)
  const movingPositionRef = useRef(new Vector3())
  const { invalidate } = useThree()
  const preset = lightingPresets[mode]

  useEffect(() => {
  if (autoSweep) {
    return
  }

  const position = movingPositionRef.current.set(
    ...preset.inspectionPosition,
  )

  setWrapLightingState({
    color: preset.inspectionColor,
    intensity: 0,
    position,
  })

  invalidate()
}, [
  autoSweep,
  invalidate,
  preset.inspectionColor,
  preset.inspectionPosition,
])
  useEffect(() => {
    if (!autoSweep) {
      return
    }

    let animationFrameId = 0
    const startedAt = performance.now()

    const animate = (time: number) => {
      const elapsed = time - startedAt
      const angle = elapsed * 0.00034
      const radius = mode === 'night' ? 5.8 : 6.5
      const position = movingPositionRef.current.set(
        Math.cos(angle) * radius,
        2.8 + Math.sin(angle * 0.7) * 1.15,
        Math.sin(angle) * radius,
      )

      lightRef.current?.position.copy(position)
      setWrapLightingState({
        color: preset.inspectionColor,
        intensity: preset.shaderLightIntensity,
        position,
      })
      invalidate()
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    autoSweep,
    invalidate,
    mode,
    preset.inspectionColor,
    preset.shaderLightIntensity,
  ])

  return autoSweep ? (
  <pointLight
    ref={lightRef}
    color={preset.inspectionColor}
    intensity={preset.inspectionIntensity}
    position={preset.inspectionPosition}
    distance={18}
    decay={2}
  />
) : null
}

function StudioLighting({
  inspectionSweep,
  mode,
}: {
  inspectionSweep: boolean
  mode: LightingMode
}) {
  const preset = lightingPresets[mode]

  return (
    <>
      <hemisphereLight
        args={[
          preset.hemisphereSky,
          preset.hemisphereGround,
          preset.hemisphereIntensity,
        ]}
      />
      <ambientLight intensity={preset.ambientIntensity} />

      <directionalLight
        castShadow
        color={mode === 'day' ? '#fff5e6' : '#ffffff'}
        intensity={preset.keyIntensity}
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

      <directionalLight
        color={mode === 'night' ? '#f0e8ff' : '#ffffff'}
        intensity={preset.frontFillIntensity}
        position={[0, 5.5, 6.5]}
      />

      <directionalLight
        color={mode === 'night' ? '#b49bd8' : '#f7f9fc'}
        intensity={preset.leftFillIntensity}
        position={[-6, 4, 2]}
      />

      <directionalLight
        color={mode === 'night' ? '#d5c5e8' : '#eef2f6'}
        intensity={preset.rightFillIntensity}
        position={[6, 3, -3]}
      />
      {mode === 'night' && (
  <>
    <pointLight
      color="#f0e8f7"
      intensity={9}
      distance={5.5}
      decay={2}
      position={[-4.5, 0.9, 2.5]}
    />

    <pointLight
      color="#ffffff"
      intensity={9}
      distance={5.5}
      decay={2}
      position={[4.5, 0.9, -2.5]}
    />
  </>
)}
      <InspectionLight autoSweep={inspectionSweep} mode={mode} />
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
  artworkPreview: ArtworkPreviewState | null
  caliperPaintPreview: CaliperPaintPreviewState | null
  chromeDeletePreview: ChromeDeletePreviewState | null
  ceramicPreview: CeramicPreviewState | null
  freeArtworkPreview: FreeArtworkPreviewState | null
  lightTintPreview: LightTintPreviewState | null
  lightingMode: LightingMode
  inspectionSweep: boolean
  ppfPreview: PpfPreviewState | null
  powderCoatPreview: PowderCoatPreviewState | null
  onResetReady: (resetView: () => void) => void
  onNamedViewReady: (
  setNamedView: (view: ViewerNamedView) => void
) => void
  onPartSelect: (partId: string) => void
  onScenePointerMissed: () => void
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
  onArtworkPreviewTransformChange: (patch: Partial<ArtworkDraftState>) => void
  onFreeArtworkTransformChange: (
    artworkId: string,
    patch: Partial<FreeArtworkItem>,
  ) => void
}

type NamedViewControllerProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  onNamedViewReady: (
    setNamedView: (view: ViewerNamedView) => void
  ) => void
}

function NamedViewController({
  controlsRef,
  onNamedViewReady,
}: NamedViewControllerProps) {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    onNamedViewReady((view: ViewerNamedView) => {
      const controls = controlsRef.current

      if (!controls) {
        return
      }

      const positions: Record<
        ViewerNamedView,
        [number, number, number]
      > = {
        frontLeft: [5.4, 2.7, 6.2],
        frontRight: [-5.4, 2.7, 6.2],
        left: [8.2, 2, 0],
        right: [-8.2, 2, 0],
        top: [0, 9.2, 0.01],
      }

      const [x, y, z] = positions[view]

      camera.position.set(x, y, z)
      controls.target.set(0, 1.2, 0)
      controls.update()
      camera.updateProjectionMatrix()
      invalidate()
    })
  }, [camera, controlsRef, invalidate, onNamedViewReady])

  return null
}
function ViewerScene({
  appliedDesign,
  artworkPreview,
  caliperPaintPreview,
  chromeDeletePreview,
  ceramicPreview,
  freeArtworkPreview,
  lightTintPreview,
  lightingMode,
  inspectionSweep,
  ppfPreview,
  powderCoatPreview,
  onPartSelect,
  onResetReady,
  onNamedViewReady,
  onScenePointerMissed,
  selectedTargetId,
  tintPreview,
  wrapPreview,
  onArtworkPreviewTransformChange,
  onFreeArtworkTransformChange,
}: ViewerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <>
      <RendererSettings mode={lightingMode} />
      <color
        key={lightingMode}
        attach="background"
        args={[lightingPresets[lightingMode].background]}
      />
      <StudioEnvironment mode={lightingMode} />
      <StudioLighting
        inspectionSweep={inspectionSweep}
        mode={lightingMode}
      />
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
      <NamedViewController
  controlsRef={controlsRef}
  onNamedViewReady={onNamedViewReady}
/>
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.18} maxDuration={0.9}>
          <InitialViewState controlsRef={controlsRef} onResetReady={onResetReady} />
          <S4Model
            appliedDesign={appliedDesign}
            artworkPreview={artworkPreview}
            caliperPaintPreview={caliperPaintPreview}
            chromeDeletePreview={chromeDeletePreview}
            ceramicPreview={ceramicPreview}
            controlsRef={controlsRef}
            freeArtworkPreview={freeArtworkPreview}
            lightTintPreview={lightTintPreview}
            ppfPreview={ppfPreview}
            powderCoatPreview={powderCoatPreview}
            selectedTargetId={selectedTargetId}
            tintPreview={tintPreview}
            wrapPreview={wrapPreview}
            onArtworkPreviewTransformChange={onArtworkPreviewTransformChange}
            onFreeArtworkTransformChange={onFreeArtworkTransformChange}
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
      artworkPreview,
      caliperPaintPreview,
      chromeDeletePreview,
      ceramicPreview,
      freeArtworkPreview,
      lightTintPreview,
      lightingMode,
      inspectionSweep,
      ppfPreview,
      powderCoatPreview,
      onPartSelect,
      onScenePointerMissed,
      selectedTargetId,
      tintPreview,
      wrapPreview,
      onArtworkPreviewTransformChange,
      onFreeArtworkTransformChange,
    },
    ref,
  ) {
  const resetViewRef = useRef<() => void>(() => undefined)

const rootRef = useRef<HTMLDivElement | null>(null)

const setNamedViewRef = useRef<(view: ViewerNamedView) => void>(
  () => undefined,
)

const viewerDprRange = useMemo(() => getViewerDprRange(), [])

  const handleResetReady = useCallback((resetView: () => void) => {
    resetViewRef.current = resetView
  }, [])

  const handleCanvasCreated = useCallback(
    (state: RootState) => {
      state.gl.outputColorSpace = SRGBColorSpace
      state.gl.toneMapping = ACESFilmicToneMapping
      state.gl.toneMappingExposure = lightingPresets[lightingMode].exposure
    },
    [lightingMode],
  )

  const handleNamedViewReady = useCallback(
  (setNamedView: (view: ViewerNamedView) => void) => {
    setNamedViewRef.current = setNamedView
  },
  [],
)

const handleToggleFullscreen = useCallback(() => {
  const element = rootRef.current

  if (!element) {
    return
  }

  if (document.fullscreenElement) {
    void document.exitFullscreen()
    return
  }

  void element.requestFullscreen()
}, [])

  useImperativeHandle(
  ref,
  () => ({
    resetView: () => {
      resetViewRef.current()
    },

    setNamedView: (view: ViewerNamedView) => {
      setNamedViewRef.current(view)
    },

    toggleFullscreen: () => {
      handleToggleFullscreen()
    },
  }),
  [handleToggleFullscreen],
)

  return (
    <div
      ref={rootRef}
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
          dpr={viewerDprRange}
          frameloop="demand"
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={handleCanvasCreated}
          shadows="percentage"
        >
          <ViewerScene
            appliedDesign={appliedDesign}
            artworkPreview={artworkPreview}
            caliperPaintPreview={caliperPaintPreview}
            chromeDeletePreview={chromeDeletePreview}
            ceramicPreview={ceramicPreview}
            freeArtworkPreview={freeArtworkPreview}
            lightTintPreview={lightTintPreview}
            lightingMode={lightingMode}
            inspectionSweep={inspectionSweep}
            ppfPreview={ppfPreview}
            powderCoatPreview={powderCoatPreview}
            selectedTargetId={selectedTargetId}
            tintPreview={tintPreview}
            wrapPreview={wrapPreview}
            onArtworkPreviewTransformChange={onArtworkPreviewTransformChange}
            onFreeArtworkTransformChange={onFreeArtworkTransformChange}
            onPartSelect={onPartSelect}
            onScenePointerMissed={onScenePointerMissed}
            onResetReady={handleResetReady}
            onNamedViewReady={handleNamedViewReady}
          />
        </Canvas>
      </ViewerErrorBoundary>
      <LoadingOverlay />
    </div>
  )
  },
)

export type { LightingMode } from '../../three/environment/StudioEnvironment'
