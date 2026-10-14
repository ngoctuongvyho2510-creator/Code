import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  filterOfficialMaterials,
  materialCatalogFilterOptions,
  officialMaterials,
} from '../../data/materials/catalog'
import {
  downloadApprovedCalibrationProfiles,
  downloadCalibrationProfiles,
  loadCalibrationProfiles,
  parseCalibrationExport,
  saveCalibrationProfiles,
  type MaterialCalibrationProfile,
  type MaterialCalibrationProfiles,
  type MaterialCalibrationStatus,
} from '../../data/materials/calibrationStore'
import { resolveWrapVisual } from '../../three/materials/wrapMaterialProfiles'
import type {
  MaterialCalibrationOverride,
  MaterialCatalogFilter,
  MaterialCatalogItem,
  OfficialWrapSelection,
} from '../../types/materialCatalog'
import './MaterialCalibrationPanel.css'

type CalibrationBrandTab = '3M' | 'Avery'

type CalibrationDraft = MaterialCalibrationOverride & {
  notes: string
}

type MaterialCalibrationPanelProps = {
  onPreviewChange: (selection: OfficialWrapSelection | null) => void
}

const validHexPattern = /^#[0-9a-f]{6}$/i
const multiColorEffectTypes = new Set([
  'color_shift',
  'pearl',
  'special_effect',
  'diamond',
])

function createOfficialSelection(
  material: MaterialCatalogItem,
): OfficialWrapSelection {
  return {
    kind: 'official',
    materialId: material.id,
    brand: material.brand,
    manufacturerCode: material.manufacturerCode,
    displayName: material.displayName,
    renderPresetId: material.renderPresetId,
  }
}

function createBaselineDraft(material: MaterialCatalogItem): CalibrationDraft {
  const visual = resolveWrapVisual(createOfficialSelection(material))

  if (!visual) {
    return {
      baseColor: material.primaryHex,
      secondaryColor: material.secondaryHex ?? undefined,
      tertiaryColor: material.tertiaryHex ?? undefined,
      grazingColor: material.primaryHex,
      fresnelStrength: 0.12,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1,
      effectStrength: 0,
      notes: '',
    }
  }

  return {
    baseColor: visual.baseColor,
    secondaryColor: visual.secondaryColor,
    tertiaryColor: visual.tertiaryColor,
    grazingColor: visual.grazingColor,
    fresnelStrength: visual.fresnelStrength,
    roughness: visual.roughness,
    metalness: visual.metalness,
    clearcoat: visual.clearcoat,
    clearcoatRoughness: visual.clearcoatRoughness,
    envMapIntensity: visual.envMapIntensity,
    effectStrength: visual.effectStrength,
    notes: '',
  }
}

function createDraftFromProfile(
  material: MaterialCatalogItem,
  profile: MaterialCalibrationProfile | undefined,
): CalibrationDraft {
  if (!profile) {
    return createBaselineDraft(material)
  }

  const baseline = createBaselineDraft(material)

  return {
    baseColor: profile.baseColor,
    secondaryColor: profile.secondaryColor ?? baseline.secondaryColor,
    tertiaryColor: profile.tertiaryColor ?? baseline.tertiaryColor,
    grazingColor: profile.grazingColor ?? baseline.grazingColor,
    fresnelStrength:
      profile.fresnelStrength ?? baseline.fresnelStrength,
    roughness: profile.roughness ?? baseline.roughness,
    metalness: profile.metalness ?? baseline.metalness,
    clearcoat: profile.clearcoat ?? baseline.clearcoat,
    clearcoatRoughness:
      profile.clearcoatRoughness ?? baseline.clearcoatRoughness,
    envMapIntensity:
      profile.envMapIntensity ?? baseline.envMapIntensity,
    effectStrength: profile.effectStrength ?? baseline.effectStrength,
    notes: profile.notes,
  }
}

function normalizeOptionalHex(value: string | undefined): string | undefined {
  if (!value || !validHexPattern.test(value)) {
    return undefined
  }

  return value.toLowerCase()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getFilteredMaterials(
  brandTab: CalibrationBrandTab,
  filter: MaterialCatalogFilter,
  search: string,
): readonly MaterialCatalogItem[] {
  const normalizedSearch = search.trim().toLowerCase()

  return filterOfficialMaterials(brandTab, filter).filter((material) => {
    if (!normalizedSearch) {
      return true
    }

    return [
      material.displayName,
      material.manufacturerCode,
      material.catalogGroup,
      material.series,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  })
}

function findNextUnapprovedMaterial(
  materials: readonly MaterialCatalogItem[],
  selectedIndex: number,
  profiles: MaterialCalibrationProfiles,
): MaterialCatalogItem | null {
  if (materials.length === 0) {
    return null
  }

  const currentIndex = Math.max(0, selectedIndex)

  for (let offset = 1; offset <= materials.length; offset += 1) {
    const material = materials[(currentIndex + offset) % materials.length]

    if (profiles[material.id]?.status !== 'approved') {
      return material
    }
  }

  return null
}

function CalibrationColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (value: string) => void
}) {
  const textValue = value ?? ''
  const isValid = validHexPattern.test(textValue)

  return (
    <label className="calibration-color-field">
      <span>{label}</span>
      <div className="calibration-color-row">
        <input
          aria-label={`${label} picker`}
          className="calibration-color-picker"
          type="color"
          value={isValid ? textValue : '#808080'}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          aria-invalid={!isValid}
          className="calibration-hex-input"
          spellCheck={false}
          value={textValue.toUpperCase()}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  )
}

function CalibrationRange({
  label,
  value,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string
  value: number
  max?: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="calibration-range">
      <span>
        {label}
        <output>{value.toFixed(2)}</output>
      </span>
      <input
        max={max}
        min={0}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function MaterialCalibrationPanel({
  onPreviewChange,
}: MaterialCalibrationPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [brandTab, setBrandTab] = useState<CalibrationBrandTab>('3M')
  const [filter, setFilter] = useState<MaterialCatalogFilter>('all')
  const [search, setSearch] = useState('')
  const [profiles, setProfiles] = useState<MaterialCalibrationProfiles>(() =>
    loadCalibrationProfiles(),
  )
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    officialMaterials[0]?.id ?? '',
  )
  const [draft, setDraft] = useState<CalibrationDraft>(() => {
    const initialMaterial = officialMaterials[0]
    return initialMaterial
      ? createDraftFromProfile(initialMaterial, profiles[initialMaterial.id])
      : { baseColor: '#808080', notes: '' }
  })
  const [message, setMessage] = useState('')
  const [previewRevision, setPreviewRevision] = useState(0)

  const filteredMaterials = useMemo(
    () => getFilteredMaterials(brandTab, filter, search),
    [brandTab, filter, search],
  )

  const selectedMaterial = useMemo(
    () =>
      officialMaterials.find(
        (material) => material.id === selectedMaterialId,
      ) ?? officialMaterials[0] ?? null,
    [selectedMaterialId],
  )

  const selectedIndex = selectedMaterial
    ? filteredMaterials.findIndex(
        (material) => material.id === selectedMaterial.id,
      )
    : -1
  const savedProfile = selectedMaterial
    ? profiles[selectedMaterial.id]
    : undefined
  const selectedStatus = savedProfile?.status ?? 'unreviewed'
  const approvedCount = Object.values(profiles).filter(
    (profile) => profile.status === 'approved',
  ).length
  const draftCount = Object.values(profiles).filter(
    (profile) => profile.status === 'draft',
  ).length
  const showMultiColorFields = selectedMaterial
    ? multiColorEffectTypes.has(selectedMaterial.effectType.toLowerCase()) ||
      selectedMaterial.renderPresetId === 'color_shift'
    : false

  useEffect(() => {
    if (!selectedMaterial) {
      onPreviewChange(null)
      return
    }

    onPreviewChange({
      ...createOfficialSelection(selectedMaterial),
      calibrationOverride: {
        baseColor: draft.baseColor,
        secondaryColor: normalizeOptionalHex(draft.secondaryColor),
        tertiaryColor: normalizeOptionalHex(draft.tertiaryColor),
        grazingColor: normalizeOptionalHex(draft.grazingColor),
        fresnelStrength: draft.fresnelStrength,
        roughness: draft.roughness,
        metalness: draft.metalness,
        clearcoat: draft.clearcoat,
        clearcoatRoughness: draft.clearcoatRoughness,
        envMapIntensity: draft.envMapIntensity,
        effectStrength: draft.effectStrength,
      },
      calibrationRevision: previewRevision,
    })
  }, [draft, onPreviewChange, previewRevision, selectedMaterial])

  const selectMaterial = useCallback(
    (
      material: MaterialCatalogItem,
      profileSource: MaterialCalibrationProfiles = profiles,
    ) => {
      setSelectedMaterialId(material.id)
      setDraft(createDraftFromProfile(material, profileSource[material.id]))
      setMessage('')
    },
    [profiles],
  )

  const handleBrandChange = useCallback(
    (nextBrand: CalibrationBrandTab) => {
      setBrandTab(nextBrand)
      const nextMaterials = getFilteredMaterials(nextBrand, filter, search)

      if (nextMaterials[0]) {
        selectMaterial(nextMaterials[0])
      }
    },
    [filter, search, selectMaterial],
  )

  const handleFilterChange = useCallback(
    (nextFilter: MaterialCatalogFilter) => {
      setFilter(nextFilter)
      const nextMaterials = getFilteredMaterials(brandTab, nextFilter, search)

      if (nextMaterials[0]) {
        selectMaterial(nextMaterials[0])
      }
    },
    [brandTab, search, selectMaterial],
  )

  const handleSearchChange = useCallback(
    (nextSearch: string) => {
      setSearch(nextSearch)
      const nextMaterials = getFilteredMaterials(brandTab, filter, nextSearch)

      if (nextMaterials[0]) {
        selectMaterial(nextMaterials[0])
      }
    },
    [brandTab, filter, selectMaterial],
  )

  const selectRelativeMaterial = useCallback(
    (offset: number) => {
      if (filteredMaterials.length === 0) {
        return
      }

      const currentIndex = Math.max(0, selectedIndex)
      const nextIndex =
        (currentIndex + offset + filteredMaterials.length) %
        filteredMaterials.length
      selectMaterial(filteredMaterials[nextIndex])
    },
    [filteredMaterials, selectedIndex, selectMaterial],
  )

  const selectNextUnapproved = useCallback(
    (profileSource: MaterialCalibrationProfiles = profiles) => {
      const nextMaterial = findNextUnapprovedMaterial(
        filteredMaterials,
        selectedIndex,
        profileSource,
      )

      if (nextMaterial) {
        selectMaterial(nextMaterial, profileSource)
        return
      }

      setMessage('Every material in this filtered list is approved.')
    },
    [filteredMaterials, profiles, selectedIndex, selectMaterial],
  )

  const saveCurrentProfile = useCallback(
    (status: MaterialCalibrationStatus, moveNext: boolean) => {
      if (!selectedMaterial || !validHexPattern.test(draft.baseColor)) {
        setMessage('Enter a valid six-digit base colour before saving.')
        return
      }

      const profile: MaterialCalibrationProfile = {
        materialId: selectedMaterial.id,
        brand: selectedMaterial.brand,
        manufacturerCode: selectedMaterial.manufacturerCode,
        displayName: selectedMaterial.displayName,
        status,
        notes: draft.notes.trim(),
        updatedAt: new Date().toISOString(),
        baseColor: draft.baseColor.toLowerCase(),
        secondaryColor: normalizeOptionalHex(draft.secondaryColor),
        tertiaryColor: normalizeOptionalHex(draft.tertiaryColor),
        grazingColor: normalizeOptionalHex(draft.grazingColor),
        fresnelStrength: clamp(draft.fresnelStrength ?? 0, 0, 1),
        roughness: clamp(draft.roughness ?? 0, 0, 1),
        metalness: clamp(draft.metalness ?? 0, 0, 1),
        clearcoat: clamp(draft.clearcoat ?? 0, 0, 1),
        clearcoatRoughness: clamp(
          draft.clearcoatRoughness ?? 0,
          0,
          1,
        ),
        envMapIntensity: clamp(draft.envMapIntensity ?? 0, 0, 3),
        effectStrength: clamp(draft.effectStrength ?? 0, 0, 1),
      }
      const nextProfiles = {
        ...profiles,
        [selectedMaterial.id]: profile,
      }

      setProfiles(nextProfiles)
      saveCalibrationProfiles(nextProfiles)
      setPreviewRevision((revision) => revision + 1)
      setMessage(
        status === 'approved'
          ? `${selectedMaterial.manufacturerCode} approved.`
          : `${selectedMaterial.manufacturerCode} saved as draft.`,
      )

      if (moveNext) {
        selectNextUnapproved(nextProfiles)
      }
    },
    [draft, profiles, selectNextUnapproved, selectedMaterial],
  )

  const resetCurrentProfile = useCallback(() => {
    if (!selectedMaterial) {
      return
    }

    const nextProfiles = { ...profiles }
    delete nextProfiles[selectedMaterial.id]
    setProfiles(nextProfiles)
    saveCalibrationProfiles(nextProfiles)
    setDraft(createBaselineDraft(selectedMaterial))
    setPreviewRevision((revision) => revision + 1)
    setMessage(`${selectedMaterial.manufacturerCode} reset to catalog defaults.`)
  }, [profiles, selectedMaterial])

  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (!file) {
        return
      }

      try {
        const imported = parseCalibrationExport(
          JSON.parse(await file.text()) as unknown,
        )
        setProfiles(imported.profiles)
        saveCalibrationProfiles(imported.profiles)
        if (selectedMaterial) {
          setDraft(
            createDraftFromProfile(
              selectedMaterial,
              imported.profiles[selectedMaterial.id],
            ),
          )
        }
        setPreviewRevision((revision) => revision + 1)
        setMessage(
          `Imported ${Object.keys(imported.profiles).length} saved profiles.`,
        )
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to import calibration data.',
        )
      } finally {
        event.target.value = ''
      }
    },
    [selectedMaterial],
  )

  if (!selectedMaterial) {
    return null
  }

  return (
    <aside
      className="material-calibration-panel"
      data-calibration-root
      aria-label="Material calibration mode"
    >
      <header className="calibration-header">
        <div>
          <span className="calibration-kicker">Internal tool</span>
          <h2>Material Calibration</h2>
        </div>
        <span className={`calibration-status calibration-status--${selectedStatus}`}>
          {selectedStatus}
        </span>
      </header>

      <div className="calibration-progress">
        <span>{approvedCount} approved</span>
        <span>{draftCount} drafts</span>
        <span>{officialMaterials.length - approvedCount - draftCount} unreviewed</span>
      </div>

      <div className="calibration-filter-grid">
        <label>
          <span>Brand</span>
          <select
            value={brandTab}
            onChange={(event) =>
              handleBrandChange(event.target.value as CalibrationBrandTab)
            }
          >
            <option value="3M">3M</option>
            <option value="Avery">Avery</option>
          </select>
        </label>
        <label>
          <span>Group</span>
          <select
            value={filter}
            onChange={(event) =>
              handleFilterChange(event.target.value as MaterialCatalogFilter)
            }
          >
            {materialCatalogFilterOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="calibration-search">
        <span>Find material</span>
        <input
          placeholder="Name or manufacturer code"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </label>

      <label className="calibration-material-select">
        <span>
          Material
          <output>
            {selectedIndex >= 0 ? selectedIndex + 1 : 0} / {filteredMaterials.length}
          </output>
        </span>
        <select
          value={selectedMaterial.id}
          onChange={(event) => {
            const material = officialMaterials.find(
              (item) => item.id === event.target.value,
            )

            if (material) {
              selectMaterial(material)
            }
          }}
        >
          {filteredMaterials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.manufacturerCode} — {material.displayName}
            </option>
          ))}
        </select>
      </label>

      <div className="calibration-navigation">
        <button type="button" onClick={() => selectRelativeMaterial(-1)}>
          Previous
        </button>
        <button type="button" onClick={() => selectRelativeMaterial(1)}>
          Next
        </button>
        <button type="button" onClick={() => selectNextUnapproved()}>
          Next unapproved
        </button>
      </div>

      <section className="calibration-reference">
        <img
          src={selectedMaterial.swatchAsset}
          alt={`${selectedMaterial.displayName} catalog swatch`}
        />
        <div>
          <strong>{selectedMaterial.displayName}</strong>
          <span>{selectedMaterial.manufacturerCode}</span>
          <span>{selectedMaterial.catalogGroup}</span>
          <span>
            {selectedMaterial.surfaceFinish} · {selectedMaterial.effectType}
          </span>
        </div>
      </section>

      <div className="calibration-catalog-colors" aria-label="Catalog colours">
        {[
          selectedMaterial.primaryHex,
          selectedMaterial.secondaryHex,
          selectedMaterial.tertiaryHex,
        ]
          .filter((color): color is string => Boolean(color))
          .map((color, index) => (
            <span key={`${color}-${index}`} title={color} style={{ background: color }} />
          ))}
      </div>

      <section className="calibration-colors">
        <CalibrationColorField
          label="Base colour"
          value={draft.baseColor}
          onChange={(baseColor) =>
            setDraft((current) => ({ ...current, baseColor }))
          }
        />
        <CalibrationColorField
          label="Grazing colour"
          value={draft.grazingColor}
          onChange={(grazingColor) =>
            setDraft((current) => ({ ...current, grazingColor }))
          }
        />
        {showMultiColorFields ? (
          <>
            <CalibrationColorField
              label="Secondary colour"
              value={draft.secondaryColor}
              onChange={(secondaryColor) =>
                setDraft((current) => ({ ...current, secondaryColor }))
              }
            />
            <CalibrationColorField
              label="Tertiary colour"
              value={draft.tertiaryColor}
              onChange={(tertiaryColor) =>
                setDraft((current) => ({ ...current, tertiaryColor }))
              }
            />
          </>
        ) : null}
      </section>

      <details className="calibration-advanced">
        <summary>Advanced material response</summary>
        <div className="calibration-range-grid">
          <CalibrationRange
            label="Angle colour strength"
            value={draft.fresnelStrength ?? 0}
            onChange={(fresnelStrength) =>
              setDraft((current) => ({ ...current, fresnelStrength }))
            }
          />
          <CalibrationRange
            label="Roughness"
            value={draft.roughness ?? 0}
            onChange={(roughness) =>
              setDraft((current) => ({ ...current, roughness }))
            }
          />
          <CalibrationRange
            label="Metalness"
            value={draft.metalness ?? 0}
            onChange={(metalness) =>
              setDraft((current) => ({ ...current, metalness }))
            }
          />
          <CalibrationRange
            label="Clearcoat"
            value={draft.clearcoat ?? 0}
            onChange={(clearcoat) =>
              setDraft((current) => ({ ...current, clearcoat }))
            }
          />
          <CalibrationRange
            label="Clearcoat roughness"
            value={draft.clearcoatRoughness ?? 0}
            onChange={(clearcoatRoughness) =>
              setDraft((current) => ({
                ...current,
                clearcoatRoughness,
              }))
            }
          />
          <CalibrationRange
            label="Environment reflection"
            max={3}
            value={draft.envMapIntensity ?? 0}
            onChange={(envMapIntensity) =>
              setDraft((current) => ({ ...current, envMapIntensity }))
            }
          />
          <CalibrationRange
            label="Effect strength"
            value={draft.effectStrength ?? 0}
            onChange={(effectStrength) =>
              setDraft((current) => ({ ...current, effectStrength }))
            }
          />
        </div>
      </details>

      <label className="calibration-notes">
        <span>Notes</span>
        <textarea
          placeholder="What you compared or changed"
          value={draft.notes}
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
        />
      </label>

      <div className="calibration-actions">
        <button
          type="button"
          onClick={() => saveCurrentProfile('draft', false)}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="calibration-primary-action"
          onClick={() => saveCurrentProfile('approved', true)}
        >
          Approve & Next
        </button>
        <button type="button" onClick={resetCurrentProfile}>
          Reset current
        </button>
      </div>

      <div className="calibration-file-actions">
        <button
          type="button"
          onClick={() => downloadCalibrationProfiles(profiles)}
        >
          Export backup
        </button>
        <button
          type="button"
          onClick={() => downloadApprovedCalibrationProfiles(profiles)}
        >
          Export approved file
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={importInputRef}
          accept="application/json,.json"
          hidden
          type="file"
          onChange={handleImport}
        />
      </div>

      <p className="calibration-message" aria-live="polite">
        {message || 'Live preview is not saved until you choose Draft or Approve.'}
      </p>
      <p className="calibration-disclaimer">
        Saved profiles stay in this browser. Export JSON regularly. Digital
        preview and physical film can vary by display and lighting.
      </p>
    </aside>
  )
}
