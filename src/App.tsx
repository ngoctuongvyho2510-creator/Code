import { useMemo, useReducer, useRef, type PointerEvent } from 'react'
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
import { PartServicePopup } from './components/viewer/PartServicePopup'
import {
  VehicleViewer,
  type VehicleViewerHandle,
} from './components/viewer/VehicleViewer'
import {
  configuratorReducer,
  initialConfiguratorState,
} from './state/configuratorReducer'
import type {
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
} from './types/configurator'
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
  const tintScopeOptions = activeTarget
    ? getTintScopeOptions(activeTarget.id)
    : []
  const activeLightTintScope =
    configuratorState.draftSelection?.serviceId === 'tint'
      ? configuratorState.draftSelection.lightTintScope
      : null
  const lightTintScopeOptions = activeTarget
    ? getLightTintScopeOptions(activeTarget.id)
    : []
  const activeChromeDeleteScope =
    configuratorState.draftSelection?.serviceId === 'chrome-delete'
      ? configuratorState.draftSelection.chromeDeleteScope
      : null
  const chromeDeleteScopeOptions = activeTarget
    ? getChromeDeleteScopeOptions(activeTarget.id)
    : []
  const activeCaliperPaintScope =
    configuratorState.draftSelection?.serviceId === 'caliper-paint'
      ? configuratorState.draftSelection.caliperPaintScope
      : null
  const caliperPaintScopeOptions = activeTarget
    ? getCaliperPaintScopeOptions(activeTarget.id)
    : []
  const activePowderCoatScope =
    configuratorState.draftSelection?.serviceId === 'powder-coat'
      ? configuratorState.draftSelection.powderCoatScope
      : null
  const powderCoatScopeOptions = activeTarget
    ? getPowderCoatScopeOptions(activeTarget.id)
    : []
  const ppfScopeOptions = activeTarget ? getPpfScopeOptions(activeTarget.id) : []
  const ceramicScopeOptions = activeTarget
    ? getCeramicScopeOptions(activeTarget.id)
    : []
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
            appliedDesign={configuratorState.appliedDesign}
            artworkPreview={artworkPreview}
            caliperPaintPreview={caliperPaintPreview}
            chromeDeletePreview={chromeDeletePreview}
            freeArtworkPreview={freeArtworkPreview}
            lightTintPreview={lightTintPreview}
            ppfPreview={ppfPreview}
            ceramicPreview={ceramicPreview}
            powderCoatPreview={powderCoatPreview}
            ref={vehicleViewerRef}
            selectedTargetId={configuratorState.draftSelection?.targetId ?? null}
            tintPreview={tintPreview}
            wrapPreview={wrapPreview}
            onArtworkPreviewTransformChange={(patch) =>
              dispatch({ type: 'update-artwork-draft', patch })
            }
            onFreeArtworkTransformChange={(artworkId, patch) =>
              dispatch({
                type: 'update-free-artwork-item',
                artworkId,
                patch,
              })
            }
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
              onApply={() => dispatch({ type: 'apply-draft' })}
              onApplyAll={() =>
                configuratorState.draftSelection?.serviceId === 'ceramic'
                  ? dispatch({ type: 'apply-ceramic-all' })
                  : configuratorState.draftSelection?.serviceId === 'ppf'
                    ? dispatch({ type: 'apply-ppf-all' })
                    : dispatch({ type: 'apply-wrap-all' })
              }
              onBack={handleBack}
              onCancel={() => dispatch({ type: 'cancel-draft' })}
              onClose={() => dispatch({ type: 'cancel-draft' })}
              onResetAllWraps={() => dispatch({ type: 'reset-all-wraps' })}
              onResetAllPpf={() => dispatch({ type: 'reset-all-ppf' })}
              onResetAllCeramic={() =>
                dispatch({ type: 'reset-all-ceramic' })
              }
              onResetCaliperPaint={() =>
                activeCaliperPaintScope
                  ? dispatch({
                      type: 'reset-caliper-paint',
                      targetId: activeTarget.id,
                      scope: activeCaliperPaintScope,
                    })
                  : undefined
              }
              onResetPowderCoat={() =>
                activePowderCoatScope
                  ? dispatch({
                      type: 'reset-powder-coat',
                      targetId: activeTarget.id,
                      scope: activePowderCoatScope,
                    })
                  : undefined
              }
              onResetChromeDelete={() =>
                activeChromeDeleteScope
                  ? dispatch({
                      type: 'reset-chrome-delete',
                      targetId: activeTarget.id,
                      scope: activeChromeDeleteScope,
                    })
                  : undefined
              }
              onResetLightTint={() =>
                activeLightTintScope
                  ? dispatch({
                      type: 'reset-light-tint',
                      targetId: activeTarget.id,
                      scope: activeLightTintScope,
                    })
                  : undefined
              }
              onResetTint={() =>
                activeTintScope
                  ? dispatch({
                      type: 'reset-tint',
                      targetId: activeTarget.id,
                      scope: activeTintScope,
                    })
                  : undefined
              }
              onResetPpf={() =>
                dispatch({ type: 'reset-ppf', targetId: activeTarget.id })
              }
              onResetCeramic={() =>
                dispatch({ type: 'reset-ceramic', targetId: activeTarget.id })
              }
              onResetWrap={() =>
                dispatch({ type: 'reset-wrap', targetId: activeTarget.id })
              }
              onRemoveArtwork={() =>
                activeArtworkId
                  ? dispatch({
                      type: 'remove-artwork',
                      targetId: activeTarget.id,
                      artworkId: activeArtworkId,
                    })
                  : undefined
              }
              onRemoveAllArtwork={() =>
                dispatch({
                  type: 'remove-all-artwork',
                  targetId: activeTarget.id,
                })
              }
              onAddFreeArtwork={() => dispatch({ type: 'add-free-artwork' })}
              onDeleteAllFreeArtwork={() =>
                dispatch({ type: 'delete-all-free-artwork' })
              }
              onDeleteFreeArtwork={(artworkId) =>
                dispatch({ type: 'delete-free-artwork', artworkId })
              }
              onDuplicateFreeArtwork={(artworkId) =>
                dispatch({ type: 'duplicate-free-artwork', artworkId })
              }
              onSelectFreeArtwork={(artworkId) =>
                dispatch({ type: 'select-free-artwork', artworkId })
              }
              onSelectService={(serviceId) =>
                dispatch({ type: 'select-service', serviceId })
              }
              onUpdateWrapDraft={(patch) =>
                dispatch({ type: 'update-wrap-draft', patch })
              }
              onUpdateTintDraft={(patch) =>
                dispatch({ type: 'update-tint-draft', patch })
              }
              onUpdateTintScope={(scope) =>
                dispatch({ type: 'update-tint-scope', scope })
              }
              onUpdateLightTintDraft={(patch) =>
                dispatch({ type: 'update-light-tint-draft', patch })
              }
              onUpdateLightTintScope={(scope) =>
                dispatch({ type: 'update-light-tint-scope', scope })
              }
              onUpdateChromeDeleteDraft={(patch) =>
                dispatch({ type: 'update-chrome-delete-draft', patch })
              }
              onUpdateChromeDeleteScope={(scope) =>
                dispatch({ type: 'update-chrome-delete-scope', scope })
              }
              onUpdateCaliperPaintDraft={(patch) =>
                dispatch({ type: 'update-caliper-paint-draft', patch })
              }
              onUpdateCaliperPaintScope={(scope) =>
                dispatch({ type: 'update-caliper-paint-scope', scope })
              }
              onUpdatePowderCoatDraft={(patch) =>
                dispatch({ type: 'update-powder-coat-draft', patch })
              }
              onUpdatePowderCoatScope={(scope) =>
                dispatch({ type: 'update-powder-coat-scope', scope })
              }
              onUpdatePpfDraft={(patch) =>
                dispatch({ type: 'update-ppf-draft', patch })
              }
              onUpdatePpfScope={(scope) =>
                dispatch({ type: 'update-ppf-scope', scope })
              }
              onUpdateCeramicDraft={(patch) =>
                dispatch({ type: 'update-ceramic-draft', patch })
              }
              onUpdateCeramicScope={(scope) =>
                dispatch({ type: 'update-ceramic-scope', scope })
              }
              onUpdateArtworkDraft={(patch) =>
                dispatch({ type: 'update-artwork-draft', patch })
              }
              onUpdateFreeArtworkItem={(
                artworkId: string,
                patch: Partial<FreeArtworkItem>,
              ) =>
                dispatch({
                  type: 'update-free-artwork-item',
                  artworkId,
                  patch,
                })
              }
              onUpdateFreeArtworkUpload={(patch) =>
                dispatch({ type: 'update-free-artwork-upload', patch })
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
