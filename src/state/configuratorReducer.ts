import {
  FULL_BODY_PART_IDS,
  FULL_BODY_TARGET_ID,
  getDefaultCaliperPaintScope,
  getDefaultChromeDeleteScope,
  getDefaultPowderCoatScope,
  getDefaultTintScope,
  getSelectionTarget,
  resolveCaliperPaintScopeTargetIds,
  resolveChromeDeleteScopeTargetIds,
  resolvePowderCoatScopeTargetIds,
  resolveTintScopeTargetIds,
} from '../config/vehicleParts'
import type {
  AppliedDesignState,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintScope,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  DraftSelectionState,
  LayeredSurfaceState,
  PowderCoatConfig,
  PowderCoatFinish,
  PowderCoatScope,
  SelectionTargetId,
  ServiceId,
  TintConfig,
  TintScope,
  WrapConfig,
  WrapFinish,
} from '../types/configurator'

const DEFAULT_WRAP_CONFIG: WrapConfig = {
  color: '#c49d59',
  finish: 'gloss',
}

const DEFAULT_TINT_CONFIG: TintConfig = {
  vlt: 35,
}

const DEFAULT_CHROME_DELETE_CONFIG: ChromeDeleteConfig = {
  color: '#050505',
  finish: 'gloss',
}

const DEFAULT_CALIPER_PAINT_CONFIG: CaliperPaintConfig = {
  color: '#d51f28',
  finish: 'gloss',
}

const DEFAULT_POWDER_COAT_CONFIG: PowderCoatConfig = {
  color: '#2d3135',
  finish: 'satin',
}

export type ConfiguratorState = {
  appliedDesign: AppliedDesignState
  draftSelection: DraftSelectionState | null
}

export type ConfiguratorAction =
  | {
      type: 'select-target'
      targetId: SelectionTargetId
    }
  | {
      type: 'select-service'
      serviceId: ServiceId
    }
  | {
      type: 'update-wrap-draft'
      patch: Partial<WrapConfig>
    }
  | {
      type: 'update-tint-draft'
      patch: Partial<TintConfig>
    }
  | {
      type: 'update-tint-scope'
      scope: TintScope
    }
  | {
      type: 'update-chrome-delete-draft'
      patch: Partial<ChromeDeleteConfig>
    }
  | {
      type: 'update-chrome-delete-scope'
      scope: ChromeDeleteScope
    }
  | {
      type: 'update-caliper-paint-draft'
      patch: Partial<CaliperPaintConfig>
    }
  | {
      type: 'update-caliper-paint-scope'
      scope: CaliperPaintScope
    }
  | {
      type: 'update-powder-coat-draft'
      patch: Partial<PowderCoatConfig>
    }
  | {
      type: 'update-powder-coat-scope'
      scope: PowderCoatScope
    }
  | {
      type: 'clear-service'
    }
  | {
      type: 'cancel-draft'
    }
  | {
      type: 'apply-draft'
    }
  | {
      type: 'apply-wrap-all'
    }
  | {
      type: 'reset-wrap'
      targetId: SelectionTargetId
    }
  | {
      type: 'reset-tint'
      targetId: SelectionTargetId
      scope: TintScope
    }
  | {
      type: 'reset-chrome-delete'
      targetId: SelectionTargetId
      scope: ChromeDeleteScope
    }
  | {
      type: 'reset-caliper-paint'
      targetId: SelectionTargetId
      scope: CaliperPaintScope
    }
  | {
      type: 'reset-powder-coat'
      targetId: SelectionTargetId
      scope: PowderCoatScope
    }
  | {
      type: 'reset-all-wraps'
    }

function createLayeredSurfaceState(): LayeredSurfaceState {
  return {
    wrap: null,
    tint: null,
    chromeDelete: null,
    caliperPaint: null,
    powderCoat: null,
    artwork: null,
    ppf: null,
    ceramic: null,
    services: {},
  }
}

function applyServiceToSurface(
  surfaceState: LayeredSurfaceState,
  serviceId: ServiceId,
): LayeredSurfaceState {
  const appliedService = { serviceId }

  if (serviceId === 'wrap') {
    return {
      ...surfaceState,
      wrap: DEFAULT_WRAP_CONFIG,
    }
  }

  if (serviceId === 'tint') {
    return {
      ...surfaceState,
      tint: DEFAULT_TINT_CONFIG,
    }
  }

  if (serviceId === 'chrome-delete') {
    return {
      ...surfaceState,
      chromeDelete: DEFAULT_CHROME_DELETE_CONFIG,
    }
  }

  if (serviceId === 'caliper-paint') {
    return {
      ...surfaceState,
      caliperPaint: DEFAULT_CALIPER_PAINT_CONFIG,
    }
  }

  if (serviceId === 'powder-coat') {
    return {
      ...surfaceState,
      powderCoat: DEFAULT_POWDER_COAT_CONFIG,
    }
  }

  if (serviceId === 'artwork') {
    return {
      ...surfaceState,
      artwork: appliedService,
    }
  }

  if (serviceId === 'ppf') {
    return {
      ...surfaceState,
      ppf: appliedService,
    }
  }

  if (serviceId === 'ceramic') {
    return {
      ...surfaceState,
      ceramic: appliedService,
    }
  }

  return {
    ...surfaceState,
    services: {
      ...surfaceState.services,
      [serviceId]: appliedService,
    },
  }
}

function setWrapOnSurface(
  surfaceState: LayeredSurfaceState,
  wrapConfig: WrapConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: wrapConfig,
  }
}

function clearWrapFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: null,
  }
}

function setTintOnSurface(
  surfaceState: LayeredSurfaceState,
  tintConfig: TintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: tintConfig,
  }
}

function clearTintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: null,
  }
}

function setChromeDeleteOnSurface(
  surfaceState: LayeredSurfaceState,
  chromeDeleteConfig: ChromeDeleteConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: chromeDeleteConfig,
  }
}

function clearChromeDeleteFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: null,
  }
}

function setCaliperPaintOnSurface(
  surfaceState: LayeredSurfaceState,
  caliperPaintConfig: CaliperPaintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    caliperPaint: caliperPaintConfig,
  }
}

function clearCaliperPaintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    caliperPaint: null,
  }
}

function setPowderCoatOnSurface(
  surfaceState: LayeredSurfaceState,
  powderCoatConfig: PowderCoatConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    powderCoat: powderCoatConfig,
  }
}

function clearPowderCoatFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    powderCoat: null,
  }
}

function getAppliedWrapForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig | null {
  if (targetId === FULL_BODY_TARGET_ID) {
    return appliedDesign.fullBody.wrap
  }

  const target = getSelectionTarget(targetId)
  const partWrap = appliedDesign.parts[targetId]?.wrap ?? null

  if (partWrap) {
    return partWrap
  }

  if (target?.fullBody) {
    return appliedDesign.fullBody.wrap
  }

  return null
}

function createWrapDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig {
  return getAppliedWrapForTarget(appliedDesign, targetId) ?? DEFAULT_WRAP_CONFIG
}

function getAppliedTintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig | null {
  return appliedDesign.parts[targetId]?.tint ?? null
}

function createTintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig {
  return getAppliedTintForTarget(appliedDesign, targetId) ?? DEFAULT_TINT_CONFIG
}

function getAppliedChromeDeleteForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig | null {
  return appliedDesign.parts[targetId]?.chromeDelete ?? null
}

function createChromeDeleteDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig {
  return (
    getAppliedChromeDeleteForTarget(appliedDesign, targetId) ??
    DEFAULT_CHROME_DELETE_CONFIG
  )
}

function getAppliedCaliperPaintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): CaliperPaintConfig | null {
  return appliedDesign.parts[targetId]?.caliperPaint ?? null
}

function createCaliperPaintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): CaliperPaintConfig {
  return (
    getAppliedCaliperPaintForTarget(appliedDesign, targetId) ??
    DEFAULT_CALIPER_PAINT_CONFIG
  )
}

function getAppliedPowderCoatForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PowderCoatConfig | null {
  return appliedDesign.parts[targetId]?.powderCoat ?? null
}

function createPowderCoatDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): PowderCoatConfig {
  return (
    getAppliedPowderCoatForTarget(appliedDesign, targetId) ??
    DEFAULT_POWDER_COAT_CONFIG
  )
}

function updateWrapDraft(
  currentWrap: WrapConfig,
  patch: Partial<WrapConfig>,
): WrapConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentWrap.color,
    finish: isWrapFinish(finish) ? finish : currentWrap.finish,
  }
}

function updateTintDraft(
  currentTint: TintConfig,
  patch: Partial<TintConfig>,
): TintConfig {
  const patchedVlt = patch.vlt ?? currentTint.vlt

  return {
    vlt: clampTintVlt(patchedVlt),
  }
}

function updateChromeDeleteDraft(
  currentChromeDelete: ChromeDeleteConfig,
  patch: Partial<ChromeDeleteConfig>,
): ChromeDeleteConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentChromeDelete.color,
    finish: isChromeDeleteFinish(finish)
      ? finish
      : currentChromeDelete.finish,
  }
}

function updateCaliperPaintDraft(
  currentCaliperPaint: CaliperPaintConfig,
  patch: Partial<CaliperPaintConfig>,
): CaliperPaintConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentCaliperPaint.color,
    finish: isCaliperPaintFinish(finish)
      ? finish
      : currentCaliperPaint.finish,
  }
}

function updatePowderCoatDraft(
  currentPowderCoat: PowderCoatConfig,
  patch: Partial<PowderCoatConfig>,
): PowderCoatConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentPowderCoat.color,
    finish: isPowderCoatFinish(finish)
      ? finish
      : currentPowderCoat.finish,
  }
}

function isWrapFinish(finish: WrapFinish | undefined): finish is WrapFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isChromeDeleteFinish(
  finish: ChromeDeleteFinish | undefined,
): finish is ChromeDeleteFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isCaliperPaintFinish(
  finish: CaliperPaintFinish | undefined,
): finish is CaliperPaintFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isPowderCoatFinish(
  finish: PowderCoatFinish | undefined,
): finish is PowderCoatFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function clampTintVlt(vlt: number): number {
  if (!Number.isFinite(vlt)) {
    return DEFAULT_TINT_CONFIG.vlt
  }

  return Math.min(100, Math.max(5, Math.round(vlt)))
}

function clearFullBodyPartWraps(
  parts: AppliedDesignState['parts'],
): AppliedDesignState['parts'] {
  const fullBodyPartIds = new Set(FULL_BODY_PART_IDS)
  const nextParts: AppliedDesignState['parts'] = {}

  for (const [partId, partState] of Object.entries(parts)) {
    nextParts[partId] = fullBodyPartIds.has(partId)
      ? clearWrapFromSurface(partState)
      : partState
  }

  return nextParts
}

function setTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  tintConfig: TintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setTintOnSurface(currentPartState, tintConfig)
  }

  return nextParts
}

function clearTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearTintFromSurface(currentPartState)
  }

  return nextParts
}

function setChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  chromeDeleteConfig: ChromeDeleteConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setChromeDeleteOnSurface(
      currentPartState,
      chromeDeleteConfig,
    )
  }

  return nextParts
}

function clearChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearChromeDeleteFromSurface(currentPartState)
  }

  return nextParts
}

function setCaliperPaintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  caliperPaintConfig: CaliperPaintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setCaliperPaintOnSurface(
      currentPartState,
      caliperPaintConfig,
    )
  }

  return nextParts
}

function clearCaliperPaintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearCaliperPaintFromSurface(currentPartState)
  }

  return nextParts
}

function setPowderCoatForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  powderCoatConfig: PowderCoatConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setPowderCoatOnSurface(
      currentPartState,
      powderCoatConfig,
    )
  }

  return nextParts
}

function clearPowderCoatForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearPowderCoatFromSurface(currentPartState)
  }

  return nextParts
}

export const initialConfiguratorState: ConfiguratorState = {
  appliedDesign: {
    fullBody: createLayeredSurfaceState(),
    parts: {},
  },
  draftSelection: null,
}

export function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  if (action.type === 'select-target') {
    const target = getSelectionTarget(action.targetId)

    if (!target) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        targetId: target.id,
        serviceId: null,
        wrapConfig: null,
        tintConfig: null,
        tintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
        caliperPaintConfig: null,
        caliperPaintScope: null,
        powderCoatConfig: null,
        powderCoatScope: null,
      },
    }
  }

  if (action.type === 'select-service') {
    if (!state.draftSelection) {
      return state
    }

    const wrapConfig =
      action.serviceId === 'wrap'
        ? createWrapDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const defaultTintScope =
      action.serviceId === 'tint'
        ? getDefaultTintScope(state.draftSelection.targetId)
        : null
    const tintConfig =
      action.serviceId === 'tint' && defaultTintScope
        ? createTintDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const defaultChromeDeleteScope =
      action.serviceId === 'chrome-delete'
        ? getDefaultChromeDeleteScope(state.draftSelection.targetId)
        : null
    const chromeDeleteConfig =
      action.serviceId === 'chrome-delete' && defaultChromeDeleteScope
        ? createChromeDeleteDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultCaliperPaintScope =
      action.serviceId === 'caliper-paint'
        ? getDefaultCaliperPaintScope(state.draftSelection.targetId)
        : null
    const caliperPaintConfig =
      action.serviceId === 'caliper-paint' && defaultCaliperPaintScope
        ? createCaliperPaintDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null
    const defaultPowderCoatScope =
      action.serviceId === 'powder-coat'
        ? getDefaultPowderCoatScope(state.draftSelection.targetId)
        : null
    const powderCoatConfig =
      action.serviceId === 'powder-coat' && defaultPowderCoatScope
        ? createPowderCoatDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: action.serviceId,
        wrapConfig,
        tintConfig,
        tintScope: defaultTintScope,
        chromeDeleteConfig,
        chromeDeleteScope: defaultChromeDeleteScope,
        caliperPaintConfig,
        caliperPaintScope: defaultCaliperPaintScope,
        powderCoatConfig,
        powderCoatScope: defaultPowderCoatScope,
      },
    }
  }

  if (action.type === 'update-wrap-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'wrap') {
      return state
    }

    const currentWrap =
      draftSelection.wrapConfig ??
      createWrapDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        wrapConfig: updateWrapDraft(currentWrap, action.patch),
      },
    }
  }

  if (action.type === 'update-tint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint') {
      return state
    }

    const currentTint =
      draftSelection.tintConfig ??
      createTintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintConfig: updateTintDraft(currentTint, action.patch),
      },
    }
  }

  if (action.type === 'update-tint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint') {
      return state
    }

    if (
      resolveTintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-chrome-delete-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    const currentChromeDelete =
      draftSelection.chromeDeleteConfig ??
      createChromeDeleteDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteConfig: updateChromeDeleteDraft(
          currentChromeDelete,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-chrome-delete-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    if (
      resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteScope: action.scope,
      },
    }
  }

  if (action.type === 'update-caliper-paint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'caliper-paint') {
      return state
    }

    const currentCaliperPaint =
      draftSelection.caliperPaintConfig ??
      createCaliperPaintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        caliperPaintConfig: updateCaliperPaintDraft(
          currentCaliperPaint,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-caliper-paint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'caliper-paint') {
      return state
    }

    if (
      resolveCaliperPaintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        caliperPaintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-powder-coat-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'powder-coat') {
      return state
    }

    const currentPowderCoat =
      draftSelection.powderCoatConfig ??
      createPowderCoatDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        powderCoatConfig: updatePowderCoatDraft(
          currentPowderCoat,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-powder-coat-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'powder-coat') {
      return state
    }

    if (
      resolvePowderCoatScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        powderCoatScope: action.scope,
      },
    }
  }

  if (action.type === 'clear-service') {
    if (!state.draftSelection) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: null,
        wrapConfig: null,
        tintConfig: null,
        tintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
        caliperPaintConfig: null,
        caliperPaintScope: null,
        powderCoatConfig: null,
        powderCoatScope: null,
      },
    }
  }

  if (action.type === 'cancel-draft') {
    return {
      ...state,
      draftSelection: null,
    }
  }

  if (action.type === 'apply-draft') {
    const draftSelection = state.draftSelection

    if (!draftSelection?.serviceId) {
      return state
    }

    if (draftSelection.serviceId === 'wrap') {
      if (!draftSelection.wrapConfig) {
        return state
      }

      if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            fullBody: setWrapOnSurface(
              state.appliedDesign.fullBody,
              draftSelection.wrapConfig,
            ),
          },
          draftSelection: null,
        }
      }

      const currentPartState =
        state.appliedDesign.parts[draftSelection.targetId] ??
        createLayeredSurfaceState()

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: {
            ...state.appliedDesign.parts,
            [draftSelection.targetId]: setWrapOnSurface(
              currentPartState,
              draftSelection.wrapConfig,
            ),
          },
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'tint') {
      if (!draftSelection.tintConfig || !draftSelection.tintScope) {
        return state
      }

      const tintTargetIds = resolveTintScopeTargetIds(
        draftSelection.targetId,
        draftSelection.tintScope,
      )

      if (tintTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setTintForTargetIds(
            state.appliedDesign.parts,
            tintTargetIds,
            draftSelection.tintConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'chrome-delete') {
      if (
        !draftSelection.chromeDeleteConfig ||
        !draftSelection.chromeDeleteScope
      ) {
        return state
      }

      const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        draftSelection.chromeDeleteScope,
      )

      if (chromeDeleteTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setChromeDeleteForTargetIds(
            state.appliedDesign.parts,
            chromeDeleteTargetIds,
            draftSelection.chromeDeleteConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'caliper-paint') {
      if (!draftSelection.caliperPaintConfig || !draftSelection.caliperPaintScope) {
        return state
      }

      const caliperPaintTargetIds = resolveCaliperPaintScopeTargetIds(
        draftSelection.targetId,
        draftSelection.caliperPaintScope,
      )

      if (caliperPaintTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setCaliperPaintForTargetIds(
            state.appliedDesign.parts,
            caliperPaintTargetIds,
            draftSelection.caliperPaintConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'powder-coat') {
      if (!draftSelection.powderCoatConfig || !draftSelection.powderCoatScope) {
        return state
      }

      const powderCoatTargetIds = resolvePowderCoatScopeTargetIds(
        draftSelection.targetId,
        draftSelection.powderCoatScope,
      )

      if (powderCoatTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setPowderCoatForTargetIds(
            state.appliedDesign.parts,
            powderCoatTargetIds,
            draftSelection.powderCoatConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: applyServiceToSurface(
            state.appliedDesign.fullBody,
            draftSelection.serviceId,
          ),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[draftSelection.targetId] ??
      createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [draftSelection.targetId]: applyServiceToSurface(
            currentPartState,
            draftSelection.serviceId,
          ),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'apply-wrap-all') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.targetId !== FULL_BODY_TARGET_ID ||
      draftSelection.serviceId !== 'wrap' ||
      !draftSelection.wrapConfig
    ) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: setWrapOnSurface(
          state.appliedDesign.fullBody,
          draftSelection.wrapConfig,
        ),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-wrap') {
    if (action.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: clearWrapFromSurface(currentPartState),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-tint') {
    const tintTargetIds = resolveTintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (tintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearTintForTargetIds(state.appliedDesign.parts, tintTargetIds),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-chrome-delete') {
    const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (chromeDeleteTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearChromeDeleteForTargetIds(
          state.appliedDesign.parts,
          chromeDeleteTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-caliper-paint') {
    const caliperPaintTargetIds = resolveCaliperPaintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (caliperPaintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearCaliperPaintForTargetIds(
          state.appliedDesign.parts,
          caliperPaintTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-powder-coat') {
    const powderCoatTargetIds = resolvePowderCoatScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (powderCoatTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearPowderCoatForTargetIds(
          state.appliedDesign.parts,
          powderCoatTargetIds,
        ),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-all-wraps') {
    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  return state
}
