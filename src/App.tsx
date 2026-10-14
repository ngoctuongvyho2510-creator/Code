import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import {
  FULL_BODY_PART_IDS,
  FULL_BODY_TARGET_ID,
  getCaliperPaintScopeOptions,
  getCeramicScopeOptions,
  getChromeDeleteScopeOptions,
  getLightTintScopeOptions,
  getPpfScopeOptions,
  getPowderCoatScopeOptions,
  getTintScopeOptions,
  getSelectionTarget,
  resolveCaliperPaintScopeTargetIds,
  resolveCeramicScopeTargetIds,
  resolveChromeDeleteScopeTargetIds,
  resolveLightTintScopeTargetIds,
  resolvePpfScopeTargetIds,
  resolvePowderCoatScopeTargetIds,
  resolveTintScopeTargetIds,
} from './config/vehicleParts'
import { MaterialCalibrationPanel } from './components/calibration/MaterialCalibrationPanel'
import { PartServicePopup } from './components/viewer/PartServicePopup'
import {
  VehicleViewer,
  type LightingMode,
  type VehicleViewerHandle,
} from './components/viewer/VehicleViewer'
import {
  configuratorReducer,
  initialConfiguratorState,
} from './state/configuratorReducer'
import type {
  ArtworkDraftState,
  ArtworkPreviewState,
  CaliperPaintConfig,
  CaliperPaintScope,
  CaliperPaintPreviewState,
  CeramicConfig,
  CeramicScope,
  CeramicPreviewState,
  ChromeDeleteConfig,
  ChromeDeleteScope,
  ChromeDeletePreviewState,
  FreeArtworkItem,
  FreeArtworkDraftState,
  FreeArtworkPreviewState,
  LightTintConfig,
  LightTintScope,
  LightTintPreviewState,
  PpfConfig,
  PpfScope,
  PpfPreviewState,
  PowderCoatConfig,
  PowderCoatScope,
  PowderCoatPreviewState,
  ServiceId,
  TintConfig,
  TintScope,
  TintPreviewState,
  WrapConfigPatch,
  WrapPreviewState,
} from './types/configurator'
import type { OfficialWrapSelection } from './types/materialCatalog'
import './App.css'

const lightingModes: readonly LightingMode[] = ['studio', 'day', 'night']

const viewerControls = [
  { label: 'Reset View', action: 'reset' },
  { label: 'Front Left', action: 'frontLeft' },
  { label: 'Front Right', action: 'frontRight' },
  { label: 'Left', action: 'left' },
  { label: 'Right', action: 'right' },
  { label: 'Top', action: 'top' },
  { label: 'Fullscreen', action: 'fullscreen' },
] as const

function isMaterialCalibrationModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('calibrate') === '1'
}

function App() {
  const vehicleViewerRef = useRef<VehicleViewerHandle>(null)
  const [configuratorState, dispatch] = useReducer(
    configuratorReducer,
    initialConfiguratorState,
  )
  const calibrationMode = useMemo(
    () => isMaterialCalibrationModeEnabled(),
    [],
  )
  const [calibrationPreview, setCalibrationPreview] =
    useState<OfficialWrapSelection | null>(null)
  const [lightingMode, setLightingMode] = useState<LightingMode>('studio')
  const [inspectionSweep, setInspectionSweep] = useState(false)

  const activeTarget = useMemo(() => {
    const draftSelection = configuratorState.draftSelection

    if (!draftSelection) {
      return null
    }

    return getSelectionTarget(draftSelection.targetId)
  }, [configuratorState.draftSelection])

  const wrapPreview = useMemo<WrapPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (draftSelection?.serviceId !== 'wrap' || !draftSelection.wrapConfig) {
      return null
    }

    return {
      targetId: draftSelection.targetId,
      wrap: draftSelection.wrapConfig,
    }
  }, [configuratorState.draftSelection])

  const effectiveWrapPreview = useMemo<WrapPreviewState | null>(() => {
    if (calibrationMode && calibrationPreview) {
      return {
        targetId: FULL_BODY_TARGET_ID,
        wrap: calibrationPreview,
      }
    }

    return wrapPreview
  }, [calibrationMode, calibrationPreview, wrapPreview])

  const tintPreview = useMemo<TintPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'tint' ||
      !draftSelection.tintConfig ||
      !draftSelection.tintScope
    ) {
      return null
    }

    const targetIds = resolveTintScopeTargetIds(
      draftSelection.targetId,
      draftSelection.tintScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      targetIds,
      tint: draftSelection.tintConfig,
    }
  }, [configuratorState.draftSelection])

  const lightTintPreview = useMemo<LightTintPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'tint' ||
      !draftSelection.lightTintConfig ||
      !draftSelection.lightTintScope
    ) {
      return null
    }

    const targetIds = resolveLightTintScopeTargetIds(
      draftSelection.targetId,
      draftSelection.lightTintScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      targetIds,
      lightTint: draftSelection.lightTintConfig,
    }
  }, [configuratorState.draftSelection])

  const chromeDeletePreview = useMemo<ChromeDeletePreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'chrome-delete' ||
      !draftSelection.chromeDeleteConfig ||
      !draftSelection.chromeDeleteScope
    ) {
      return null
    }

    const targetIds = resolveChromeDeleteScopeTargetIds(
      draftSelection.targetId,
      draftSelection.chromeDeleteScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      targetIds,
      chromeDelete: draftSelection.chromeDeleteConfig,
    }
  }, [configuratorState.draftSelection])

  const caliperPaintPreview = useMemo<CaliperPaintPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'caliper-paint' ||
      !draftSelection.caliperPaintConfig ||
      !draftSelection.caliperPaintScope
    ) {
      return null
    }

    const targetIds = resolveCaliperPaintScopeTargetIds(
      draftSelection.targetId,
      draftSelection.caliperPaintScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      targetIds,
      caliperPaint: draftSelection.caliperPaintConfig,
    }
  }, [configuratorState.draftSelection])

  const powderCoatPreview = useMemo<PowderCoatPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'powder-coat' ||
      !draftSelection.powderCoatConfig ||
      !draftSelection.powderCoatScope
    ) {
      return null
    }

    const targetIds = resolvePowderCoatScopeTargetIds(
      draftSelection.targetId,
      draftSelection.powderCoatScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      targetIds,
      powderCoat: draftSelection.powderCoatConfig,
    }
  }, [configuratorState.draftSelection])

  const ppfPreview = useMemo<PpfPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (draftSelection?.serviceId !== 'ppf' || !draftSelection.ppfConfig) {
      return null
    }

    if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
      return {
        fullBodyBase: true,
        targetIds: FULL_BODY_PART_IDS,
        ppf: draftSelection.ppfConfig,
      }
    }

    if (!draftSelection.ppfScope) {
      return null
    }

    const targetIds = resolvePpfScopeTargetIds(
      draftSelection.targetId,
      draftSelection.ppfScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      fullBodyBase: false,
      targetIds,
      ppf: draftSelection.ppfConfig,
    }
  }, [configuratorState.draftSelection])

  const ceramicPreview = useMemo<CeramicPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection

    if (
      draftSelection?.serviceId !== 'ceramic' ||
      !draftSelection.ceramicConfig
    ) {
      return null
    }

    if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
      return {
        fullBodyBase: true,
        targetIds: FULL_BODY_PART_IDS,
        ceramic: draftSelection.ceramicConfig,
      }
    }

    if (!draftSelection.ceramicScope) {
      return null
    }

    const targetIds = resolveCeramicScopeTargetIds(
      draftSelection.targetId,
      draftSelection.ceramicScope,
    )

    if (targetIds.length === 0) {
      return null
    }

    return {
      fullBodyBase: false,
      targetIds,
      ceramic: draftSelection.ceramicConfig,
    }
  }, [configuratorState.draftSelection])

  const artworkPreview = useMemo<ArtworkPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection
    const artworkConfig = draftSelection?.artworkConfig

    if (
      draftSelection?.serviceId !== 'artwork' ||
      !artworkConfig?.imageSource
    ) {
      return null
    }

    return {
      targetId: draftSelection.targetId,
      artwork: {
        id: artworkConfig.id,
        targetPartId: artworkConfig.targetPartId,
        mode: artworkConfig.mode,
        imageSource: artworkConfig.imageSource,
        fileName: artworkConfig.fileName,
        imageWidth: artworkConfig.imageWidth,
        imageHeight: artworkConfig.imageHeight,
        aspectRatio: artworkConfig.aspectRatio,
        position: artworkConfig.position,
        orientation: artworkConfig.orientation,
        size: artworkConfig.size,
        scale: artworkConfig.scale,
        rotation: artworkConfig.rotation,
        offsetX: artworkConfig.offsetX,
        offsetY: artworkConfig.offsetY,
      },
    }
  }, [configuratorState.draftSelection])

  const freeArtworkPreview = useMemo<FreeArtworkPreviewState | null>(() => {
    const draftSelection = configuratorState.draftSelection
    const freeArtworkConfig = draftSelection?.freeArtworkConfig

    if (
      draftSelection?.serviceId !== 'free-art' ||
      !freeArtworkConfig
    ) {
      return null
    }

    return {
      items: freeArtworkConfig.items,
      selectedItemId: freeArtworkConfig.selectedItemId,
    }
  }, [configuratorState.draftSelection])

  const hasFullBodyWrapOverrides = FULL_BODY_PART_IDS.some((partId) =>
    Boolean(configuratorState.appliedDesign.parts[partId]?.wrap),
  )
  const hasFullBodyPpfOverrides = FULL_BODY_PART_IDS.some((partId) =>
    Boolean(configuratorState.appliedDesign.parts[partId]?.ppf),
  )
  const hasFullBodyCeramicOverrides = FULL_BODY_PART_IDS.some((partId) =>
    Boolean(configuratorState.appliedDesign.parts[partId]?.ceramic),
  )

  const activeTargetHasDirectWrap = activeTarget
    ? activeTarget.id === FULL_BODY_TARGET_ID
      ? Boolean(configuratorState.appliedDesign.fullBody.wrap)
      : Boolean(configuratorState.appliedDesign.parts[activeTarget.id]?.wrap)
    : false
  const activeTargetHasDirectPpf = activeTarget
    ? activeTarget.id === FULL_BODY_TARGET_ID
      ? Boolean(configuratorState.appliedDesign.fullBody.ppf)
      : Boolean(configuratorState.appliedDesign.parts[activeTarget.id]?.ppf)
    : false
  const activeTargetHasDirectCeramic = activeTarget
    ? activeTarget.id === FULL_BODY_TARGET_ID
      ? Boolean(configuratorState.appliedDesign.fullBody.ceramic)
      : Boolean(configuratorState.appliedDesign.parts[activeTarget.id]?.ceramic)
    : false

  const canResetAllWraps =
    activeTarget?.id === FULL_BODY_TARGET_ID &&
    (Boolean(configuratorState.appliedDesign.fullBody.wrap) ||
      hasFullBodyWrapOverrides)
  const canResetAllPpf =
    activeTarget?.id === FULL_BODY_TARGET_ID &&
    (Boolean(configuratorState.appliedDesign.fullBody.ppf) ||
      hasFullBodyPpfOverrides)
  const canResetAllCeramic =
    activeTarget?.id === FULL_BODY_TARGET_ID &&
    (Boolean(configuratorState.appliedDesign.fullBody.ceramic) ||
      hasFullBodyCeramicOverrides)
  const activeTintScope =
    configuratorState.draftSelection?.serviceId === 'tint'
      ? configuratorState.draftSelection.tintScope
      : null
  const tintScopeOptions = useMemo(
    () => (activeTarget ? getTintScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const activeLightTintScope =
    configuratorState.draftSelection?.serviceId === 'tint'
      ? configuratorState.draftSelection.lightTintScope
      : null
  const lightTintScopeOptions = useMemo(
    () => (activeTarget ? getLightTintScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const activeChromeDeleteScope =
    configuratorState.draftSelection?.serviceId === 'chrome-delete'
      ? configuratorState.draftSelection.chromeDeleteScope
      : null
  const chromeDeleteScopeOptions = useMemo(
    () => (activeTarget ? getChromeDeleteScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const activeCaliperPaintScope =
    configuratorState.draftSelection?.serviceId === 'caliper-paint'
      ? configuratorState.draftSelection.caliperPaintScope
      : null
  const caliperPaintScopeOptions = useMemo(
    () => (activeTarget ? getCaliperPaintScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const activePowderCoatScope =
    configuratorState.draftSelection?.serviceId === 'powder-coat'
      ? configuratorState.draftSelection.powderCoatScope
      : null
  const powderCoatScopeOptions = useMemo(
    () => (activeTarget ? getPowderCoatScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const ppfScopeOptions = useMemo(
    () => (activeTarget ? getPpfScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const ceramicScopeOptions = useMemo(
    () => (activeTarget ? getCeramicScopeOptions(activeTarget.id) : []),
    [activeTarget],
  )
  const canResetTint =
    activeTarget && activeTintScope
      ? resolveTintScopeTargetIds(activeTarget.id, activeTintScope).some(
          (targetId) =>
            Boolean(configuratorState.appliedDesign.parts[targetId]?.tint),
        )
      : false
  const canResetLightTint =
    activeTarget && activeLightTintScope
      ? resolveLightTintScopeTargetIds(
          activeTarget.id,
          activeLightTintScope,
        ).some((targetId) =>
          Boolean(configuratorState.appliedDesign.parts[targetId]?.lightTint),
        )
      : false
  const canResetChromeDelete =
    activeTarget && activeChromeDeleteScope
      ? resolveChromeDeleteScopeTargetIds(
          activeTarget.id,
          activeChromeDeleteScope,
        ).some((targetId) =>
          Boolean(
            configuratorState.appliedDesign.parts[targetId]?.chromeDelete,
          ),
        )
      : false
  const canResetCaliperPaint =
    activeTarget && activeCaliperPaintScope
      ? resolveCaliperPaintScopeTargetIds(
          activeTarget.id,
          activeCaliperPaintScope,
        ).some((targetId) =>
          Boolean(
            configuratorState.appliedDesign.parts[targetId]?.caliperPaint,
          ),
        )
      : false
  const canResetPowderCoat =
    activeTarget && activePowderCoatScope
      ? resolvePowderCoatScopeTargetIds(
          activeTarget.id,
          activePowderCoatScope,
        ).some((targetId) =>
          Boolean(
            configuratorState.appliedDesign.parts[targetId]?.powderCoat,
          ),
        )
      : false
  const activeTargetArtwork = activeTarget
    ? (configuratorState.appliedDesign.parts[activeTarget.id]?.artwork ?? [])
    : []
  const activeArtworkId =
    configuratorState.draftSelection?.artworkConfig?.selectedArtworkId ??
    activeTargetArtwork.at(-1)?.id ??
    null
  const activeFreeArtworkConfig =
    configuratorState.draftSelection?.serviceId === 'free-art'
      ? configuratorState.draftSelection.freeArtworkConfig
      : null
  const activeFreeArtworkItem =
    activeFreeArtworkConfig?.items.find(
      (item) => item.id === activeFreeArtworkConfig.selectedItemId,
    ) ?? null

  const handleArtworkPreviewTransformChange = useCallback(
    (patch: Partial<ArtworkDraftState>) =>
      dispatch({ type: 'update-artwork-draft', patch }),
    [],
  )

  const handleFreeArtworkTransformChange = useCallback(
    (artworkId: string, patch: Partial<FreeArtworkItem>) =>
      dispatch({
        type: 'update-free-artwork-item',
        artworkId,
        patch,
      }),
    [],
  )

  const handlePartSelect = useCallback((partId: string) => {
    dispatch({ type: 'select-target', targetId: partId })
  }, [])

  const handleCalibrationPreviewChange = useCallback(
    (selection: OfficialWrapSelection | null) => {
      setCalibrationPreview(selection)
    },
    [],
  )

  const ignoreCalibrationPartSelection = useCallback(() => undefined, [])

  const handleCancelDraft = useCallback(() => {
    dispatch({ type: 'cancel-draft' })
  }, [])

  const handleFullBodySelect = useCallback(() => {
    dispatch({ type: 'select-target', targetId: FULL_BODY_TARGET_ID })
  }, [])

  const handleApply = useCallback(() => {
    dispatch({ type: 'apply-draft' })
  }, [])

  const handleApplyAll = useCallback(() => {
    if (configuratorState.draftSelection?.serviceId === 'ceramic') {
      dispatch({ type: 'apply-ceramic-all' })
      return
    }

    if (configuratorState.draftSelection?.serviceId === 'ppf') {
      dispatch({ type: 'apply-ppf-all' })
      return
    }

    dispatch({ type: 'apply-wrap-all' })
  }, [configuratorState.draftSelection?.serviceId])

  const handleBack = useCallback(() => {
    if (configuratorState.draftSelection?.serviceId) {
      dispatch({ type: 'clear-service' })
    } else {
      dispatch({ type: 'cancel-draft' })
    }
  }, [configuratorState.draftSelection?.serviceId])

  const handleResetAllWraps = useCallback(() => {
    dispatch({ type: 'reset-all-wraps' })
  }, [])

  const handleResetAllPpf = useCallback(() => {
    dispatch({ type: 'reset-all-ppf' })
  }, [])

  const handleResetAllCeramic = useCallback(() => {
    dispatch({ type: 'reset-all-ceramic' })
  }, [])

  const handleResetCaliperPaint = useCallback(() => {
    if (!activeTarget || !activeCaliperPaintScope) {
      return
    }

    dispatch({
      type: 'reset-caliper-paint',
      targetId: activeTarget.id,
      scope: activeCaliperPaintScope,
    })
  }, [activeCaliperPaintScope, activeTarget])

  const handleResetPowderCoat = useCallback(() => {
    if (!activeTarget || !activePowderCoatScope) {
      return
    }

    dispatch({
      type: 'reset-powder-coat',
      targetId: activeTarget.id,
      scope: activePowderCoatScope,
    })
  }, [activePowderCoatScope, activeTarget])

  const handleResetChromeDelete = useCallback(() => {
    if (!activeTarget || !activeChromeDeleteScope) {
      return
    }

    dispatch({
      type: 'reset-chrome-delete',
      targetId: activeTarget.id,
      scope: activeChromeDeleteScope,
    })
  }, [activeChromeDeleteScope, activeTarget])

  const handleResetLightTint = useCallback(() => {
    if (!activeTarget || !activeLightTintScope) {
      return
    }

    dispatch({
      type: 'reset-light-tint',
      targetId: activeTarget.id,
      scope: activeLightTintScope,
    })
  }, [activeLightTintScope, activeTarget])

  const handleResetTint = useCallback(() => {
    if (!activeTarget || !activeTintScope) {
      return
    }

    dispatch({
      type: 'reset-tint',
      targetId: activeTarget.id,
      scope: activeTintScope,
    })
  }, [activeTarget, activeTintScope])

  const handleResetPpf = useCallback(() => {
    if (activeTarget) {
      dispatch({ type: 'reset-ppf', targetId: activeTarget.id })
    }
  }, [activeTarget])

  const handleResetCeramic = useCallback(() => {
    if (activeTarget) {
      dispatch({ type: 'reset-ceramic', targetId: activeTarget.id })
    }
  }, [activeTarget])

  const handleResetWrap = useCallback(() => {
    if (activeTarget) {
      dispatch({ type: 'reset-wrap', targetId: activeTarget.id })
    }
  }, [activeTarget])

  const handleRemoveArtwork = useCallback(() => {
    if (!activeTarget || !activeArtworkId) {
      return
    }

    dispatch({
      type: 'remove-artwork',
      targetId: activeTarget.id,
      artworkId: activeArtworkId,
    })
  }, [activeArtworkId, activeTarget])

  const handleRemoveAllArtwork = useCallback(() => {
    if (activeTarget) {
      dispatch({
        type: 'remove-all-artwork',
        targetId: activeTarget.id,
      })
    }
  }, [activeTarget])

  const handleAddFreeArtwork = useCallback(() => {
    dispatch({ type: 'add-free-artwork' })
  }, [])

  const handleDeleteAllFreeArtwork = useCallback(() => {
    dispatch({ type: 'delete-all-free-artwork' })
  }, [])

  const handleDeleteFreeArtwork = useCallback((artworkId: string) => {
    dispatch({ type: 'delete-free-artwork', artworkId })
  }, [])

  const handleDuplicateFreeArtwork = useCallback((artworkId: string) => {
    dispatch({ type: 'duplicate-free-artwork', artworkId })
  }, [])

  const handleSelectFreeArtwork = useCallback((artworkId: string) => {
    dispatch({ type: 'select-free-artwork', artworkId })
  }, [])

  const handleSelectService = useCallback((serviceId: ServiceId) => {
    dispatch({ type: 'select-service', serviceId })
  }, [])

  const handleUpdateWrapDraft = useCallback((patch: WrapConfigPatch) => {
    dispatch({ type: 'update-wrap-draft', patch })
  }, [])

  const handleUpdateTintDraft = useCallback((patch: Partial<TintConfig>) => {
    dispatch({ type: 'update-tint-draft', patch })
  }, [])

  const handleUpdateTintScope = useCallback((scope: TintScope) => {
    dispatch({ type: 'update-tint-scope', scope })
  }, [])

  const handleUpdateLightTintDraft = useCallback(
    (patch: Partial<LightTintConfig>) => {
      dispatch({ type: 'update-light-tint-draft', patch })
    },
    [],
  )

  const handleUpdateLightTintScope = useCallback((scope: LightTintScope) => {
    dispatch({ type: 'update-light-tint-scope', scope })
  }, [])

  const handleUpdateChromeDeleteDraft = useCallback(
    (patch: Partial<ChromeDeleteConfig>) => {
      dispatch({ type: 'update-chrome-delete-draft', patch })
    },
    [],
  )

  const handleUpdateChromeDeleteScope = useCallback(
    (scope: ChromeDeleteScope) => {
      dispatch({ type: 'update-chrome-delete-scope', scope })
    },
    [],
  )

  const handleUpdateCaliperPaintDraft = useCallback(
    (patch: Partial<CaliperPaintConfig>) => {
      dispatch({ type: 'update-caliper-paint-draft', patch })
    },
    [],
  )

  const handleUpdateCaliperPaintScope = useCallback(
    (scope: CaliperPaintScope) => {
      dispatch({ type: 'update-caliper-paint-scope', scope })
    },
    [],
  )

  const handleUpdatePowderCoatDraft = useCallback(
    (patch: Partial<PowderCoatConfig>) => {
      dispatch({ type: 'update-powder-coat-draft', patch })
    },
    [],
  )

  const handleUpdatePowderCoatScope = useCallback(
    (scope: PowderCoatScope) => {
      dispatch({ type: 'update-powder-coat-scope', scope })
    },
    [],
  )

  const handleUpdatePpfDraft = useCallback((patch: Partial<PpfConfig>) => {
    dispatch({ type: 'update-ppf-draft', patch })
  }, [])

  const handleUpdatePpfScope = useCallback((scope: PpfScope) => {
    dispatch({ type: 'update-ppf-scope', scope })
  }, [])

  const handleUpdateCeramicDraft = useCallback(
    (patch: Partial<CeramicConfig>) => {
      dispatch({ type: 'update-ceramic-draft', patch })
    },
    [],
  )

  const handleUpdateCeramicScope = useCallback((scope: CeramicScope) => {
    dispatch({ type: 'update-ceramic-scope', scope })
  }, [])

  const handleUpdateArtworkDraft = useCallback(
    (patch: Partial<ArtworkDraftState>) => {
      dispatch({ type: 'update-artwork-draft', patch })
    },
    [],
  )

  const handleUpdateFreeArtworkItem = useCallback(
    (artworkId: string, patch: Partial<FreeArtworkItem>) => {
      dispatch({
        type: 'update-free-artwork-item',
        artworkId,
        patch,
      })
    },
    [],
  )

  const handleUpdateFreeArtworkUpload = useCallback(
    (patch: Partial<FreeArtworkDraftState>) => {
      dispatch({ type: 'update-free-artwork-upload', patch })
    },
    [],
  )

  const handleShellPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!configuratorState.draftSelection) {
      return
    }

    if (!(event.target instanceof Element)) {
      return
    }

    if (
      event.target.closest('[data-popup-root]') ||
      event.target.closest('[data-calibration-root]') ||
      event.target.closest('.vehicle-viewer-canvas')
    ) {
      return
    }

    dispatch({ type: 'cancel-draft' })
  }, [configuratorState.draftSelection])

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
            appliedDesign={configuratorState.appliedDesign}
            artworkPreview={artworkPreview}
            caliperPaintPreview={caliperPaintPreview}
            chromeDeletePreview={chromeDeletePreview}
            freeArtworkPreview={freeArtworkPreview}
            lightTintPreview={lightTintPreview}
            lightingMode={lightingMode}
            inspectionSweep={inspectionSweep}
            ppfPreview={ppfPreview}
            ceramicPreview={ceramicPreview}
            powderCoatPreview={powderCoatPreview}
            ref={vehicleViewerRef}
            selectedTargetId={
              calibrationMode
                ? null
                : (configuratorState.draftSelection?.targetId ?? null)
            }
            tintPreview={tintPreview}
            wrapPreview={effectiveWrapPreview}
            onArtworkPreviewTransformChange={
              handleArtworkPreviewTransformChange
            }
            onFreeArtworkTransformChange={handleFreeArtworkTransformChange}
            onPartSelect={
              calibrationMode ? ignoreCalibrationPartSelection : handlePartSelect
            }
            onScenePointerMissed={
              calibrationMode ? ignoreCalibrationPartSelection : handleCancelDraft
            }
          />
          {calibrationMode ? (
            <MaterialCalibrationPanel
              onPreviewChange={handleCalibrationPreviewChange}
            />
          ) : (
            <button
              type="button"
              className="full-body-action"
              onClick={handleFullBodySelect}
            >
              Full Body
            </button>
          )}
          {!calibrationMode && activeTarget ? (
            <PartServicePopup
              target={activeTarget}
              selectedServiceId={
                configuratorState.draftSelection?.serviceId ?? null
              }
              chromeDeleteConfig={
                configuratorState.draftSelection?.chromeDeleteConfig ?? null
              }
              chromeDeleteScope={
                configuratorState.draftSelection?.chromeDeleteScope ?? null
              }
              chromeDeleteScopeOptions={chromeDeleteScopeOptions}
              caliperPaintConfig={
                configuratorState.draftSelection?.caliperPaintConfig ?? null
              }
              caliperPaintScope={
                configuratorState.draftSelection?.caliperPaintScope ?? null
              }
              caliperPaintScopeOptions={caliperPaintScopeOptions}
              powderCoatConfig={
                configuratorState.draftSelection?.powderCoatConfig ?? null
              }
              powderCoatScope={
                configuratorState.draftSelection?.powderCoatScope ?? null
              }
              powderCoatScopeOptions={powderCoatScopeOptions}
              ppfConfig={configuratorState.draftSelection?.ppfConfig ?? null}
              ppfScope={configuratorState.draftSelection?.ppfScope ?? null}
              ppfScopeOptions={ppfScopeOptions}
              ceramicConfig={
                configuratorState.draftSelection?.ceramicConfig ?? null
              }
              ceramicScope={
                configuratorState.draftSelection?.ceramicScope ?? null
              }
              ceramicScopeOptions={ceramicScopeOptions}
              artworkConfig={
                configuratorState.draftSelection?.artworkConfig ?? null
              }
              freeArtworkConfig={activeFreeArtworkConfig}
              selectedFreeArtworkItem={activeFreeArtworkItem}
              lightTintConfig={
                configuratorState.draftSelection?.lightTintConfig ?? null
              }
              lightTintScope={
                configuratorState.draftSelection?.lightTintScope ?? null
              }
              lightTintScopeOptions={lightTintScopeOptions}
              wrapConfig={configuratorState.draftSelection?.wrapConfig ?? null}
              tintConfig={configuratorState.draftSelection?.tintConfig ?? null}
              tintScope={configuratorState.draftSelection?.tintScope ?? null}
              tintScopeOptions={tintScopeOptions}
              canApplyAllWraps={
                activeTarget.id === FULL_BODY_TARGET_ID &&
                hasFullBodyWrapOverrides
              }
              canApplyAllPpf={
                activeTarget.id === FULL_BODY_TARGET_ID &&
                hasFullBodyPpfOverrides
              }
              canApplyAllCeramic={
                activeTarget.id === FULL_BODY_TARGET_ID &&
                hasFullBodyCeramicOverrides
              }
              canResetAllWraps={canResetAllWraps}
              canResetAllPpf={canResetAllPpf}
              canResetAllCeramic={canResetAllCeramic}
              canResetCaliperPaint={canResetCaliperPaint}
              canResetChromeDelete={canResetChromeDelete}
              canResetLightTint={canResetLightTint}
              canResetPowderCoat={canResetPowderCoat}
              canResetTint={canResetTint}
              canResetPpf={activeTargetHasDirectPpf}
              canResetCeramic={activeTargetHasDirectCeramic}
              canResetWrap={activeTargetHasDirectWrap}
              canRemoveArtwork={Boolean(activeArtworkId)}
              canRemoveAllArtwork={activeTargetArtwork.length > 0}
              onApply={handleApply}
              onApplyAll={handleApplyAll}
              onBack={handleBack}
              onCancel={handleCancelDraft}
              onClose={handleCancelDraft}
              onResetAllWraps={handleResetAllWraps}
              onResetAllPpf={handleResetAllPpf}
              onResetAllCeramic={handleResetAllCeramic}
              onResetCaliperPaint={handleResetCaliperPaint}
              onResetPowderCoat={handleResetPowderCoat}
              onResetChromeDelete={handleResetChromeDelete}
              onResetLightTint={handleResetLightTint}
              onResetTint={handleResetTint}
              onResetPpf={handleResetPpf}
              onResetCeramic={handleResetCeramic}
              onResetWrap={handleResetWrap}
              onRemoveArtwork={handleRemoveArtwork}
              onRemoveAllArtwork={handleRemoveAllArtwork}
              onAddFreeArtwork={handleAddFreeArtwork}
              onDeleteAllFreeArtwork={handleDeleteAllFreeArtwork}
              onDeleteFreeArtwork={handleDeleteFreeArtwork}
              onDuplicateFreeArtwork={handleDuplicateFreeArtwork}
              onSelectFreeArtwork={handleSelectFreeArtwork}
              onSelectService={handleSelectService}
              onUpdateWrapDraft={handleUpdateWrapDraft}
              onUpdateTintDraft={handleUpdateTintDraft}
              onUpdateTintScope={handleUpdateTintScope}
              onUpdateLightTintDraft={handleUpdateLightTintDraft}
              onUpdateLightTintScope={handleUpdateLightTintScope}
              onUpdateChromeDeleteDraft={handleUpdateChromeDeleteDraft}
              onUpdateChromeDeleteScope={handleUpdateChromeDeleteScope}
              onUpdateCaliperPaintDraft={handleUpdateCaliperPaintDraft}
              onUpdateCaliperPaintScope={handleUpdateCaliperPaintScope}
              onUpdatePowderCoatDraft={handleUpdatePowderCoatDraft}
              onUpdatePowderCoatScope={handleUpdatePowderCoatScope}
              onUpdatePpfDraft={handleUpdatePpfDraft}
              onUpdatePpfScope={handleUpdatePpfScope}
              onUpdateCeramicDraft={handleUpdateCeramicDraft}
              onUpdateCeramicScope={handleUpdateCeramicScope}
              onUpdateArtworkDraft={handleUpdateArtworkDraft}
              onUpdateFreeArtworkItem={handleUpdateFreeArtworkItem}
              onUpdateFreeArtworkUpload={handleUpdateFreeArtworkUpload}
            />
          ) : null}
        </section>
      </div>

      <footer className="viewer-toolbar" aria-label="Viewer toolbar">
        {lightingModes.map((mode) => (
          <button
            type="button"
            aria-pressed={lightingMode === mode}
            className="toolbar-button"
            key={mode}
            onClick={() => setLightingMode(mode)}
          >
            {mode === 'studio' ? 'Studio' : mode === 'day' ? 'Day' : 'Night'}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={inspectionSweep}
          className="toolbar-button"
          onClick={() => setInspectionSweep((enabled) => !enabled)}
        >
          {inspectionSweep ? 'Stop Light Sweep' : 'Light Sweep'}
        </button>
        {viewerControls.map((control) => (
  <button
    type="button"
    className="toolbar-button"
    key={control.action}
    onClick={() => {
      const viewer = vehicleViewerRef.current

      if (!viewer) {
        return
      }

      switch (control.action) {
        case 'reset':
          viewer.resetView()
          break

        case 'fullscreen':
          viewer.toggleFullscreen()
          break

        case 'frontLeft':
        case 'frontRight':
        case 'left':
        case 'right':
        case 'top':
          viewer.setNamedView(control.action)
          break
      }
    }}
  >
    {control.label}
  </button>
))}
      </footer>
    </main>
  )
}

export default App
