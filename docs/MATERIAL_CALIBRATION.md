# ModifyWrap Material Calibration Mode

## Open the tool

Run the project normally:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173/?calibrate=1
```

Use the actual port shown by Vite if it is not `5173`.

Without `?calibrate=1`, the normal customer configurator remains unchanged.

## Workflow

1. Choose `3M` or `Avery`.
2. Choose a material group or search by name/manufacturer code.
3. Compare the reference swatch with the material on the full vehicle.
4. Adjust the base colour.
5. For colour-shift, pearl, diamond, or special-effect materials, adjust the secondary and tertiary colours.
6. Open **Advanced material response** only when the colour alone is not enough.
7. Choose **Save Draft** while the material is still being reviewed.
8. Choose **Approve & Next** when the material is accepted.
9. Export JSON regularly so progress is not only stored in the browser.

Calibration data is stored in browser `localStorage`. Clearing browser data removes the local copy.

## Apply approved calibrations to the normal website

Use **Export backup** to save all drafts and approved work.

Use **Export approved file** to download:

```text
approvedMaterialCalibrations.json
```

Replace:

```text
src/data/materials/approvedMaterialCalibrations.json
```

with the exported JSON file and keep the exact destination file name.

The normal customer website automatically uses only profiles whose status is:

```json
"status": "approved"
```

Draft profiles in the exported file are ignored by the production material resolver.

After replacing the file, run:

```bash
npm run build
npm run lint
npm run validate:materials
```

## Important calibration rules

- Keep the renderer, lighting, exposure, camera reference angles, and shared finish recipes fixed while reviewing the catalog.
- Adjust one SKU at a time.
- Use colour controls first.
- Use advanced physical controls only when a material genuinely requires a per-SKU override.
- Do not try to match printed/PDF swatches by changing global lighting for each colour.
- Export backups at the end of every calibration session.
- Digital previews cannot be guaranteed to match physical film under every monitor and lighting condition.
