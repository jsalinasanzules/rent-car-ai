import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeftRight, Camera, Check, CheckCircle2,
  ChevronDown, Clock3, Info, Layers3, Plus, ShieldCheck, Sparkles,
  Trash2, UploadCloud, X, Save, CarFront,
} from "lucide-react";

type Side = "baseline" | "current";
type Zone =
  | "front" | "rear" | "left_side" | "right_side"
  | "front_left_corner" | "front_right_corner"
  | "rear_left_corner" | "rear_right_corner"
  | "interior" | "dashboard" | "detail";

type Photo = {
  id: string;
  file?: File;
  preview: string;
  filename?: string;
  sizeBytes?: number;
  isSaved?: boolean;
  zone: Zone | "";
};

type VehicleForm = {
  make: string;
  model: string;
  modelYear: string;
  licensePlate: string;
  vin: string;
};

type ComparisonResult = {
  comparisonId: string;
  status: "COMPLETED";
  result: "NEW_DAMAGE" | "NO_CHANGE" | "INCONCLUSIVE";
  summary: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  zones: Array<{ zone: string; result: string; summary: string }>;
  findings: Array<{ id: string; zone: string; finding_type: string; location_description: string; description: string; severity: string; confidence: number; requires_human_review: boolean }>;
  requiresHumanReview: boolean;
};

type SaveResult = {
  vehicleId: string;
  inspections: { baseline: string; current: string };
  images: Array<{ id: string; zone: string; inspection_id: string }>;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const ZONES: { value: Zone; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "left_side", label: "Left side" },
  { value: "right_side", label: "Right side" },
  { value: "front_left_corner", label: "Front-left corner" },
  { value: "front_right_corner", label: "Front-right corner" },
  { value: "rear_left_corner", label: "Rear-left corner" },
  { value: "rear_right_corner", label: "Rear-right corner" },
  { value: "interior", label: "Interior" },
  { value: "dashboard", label: "Dashboard / odometer" },
  { value: "detail", label: "Additional detail" },
];

const MAX_FILE_SIZE_MB = 7;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function App() {
  const [baseline, setBaseline] = useState<Photo[]>([]);
  const [current, setCurrent] = useState<Photo[]>([]);
  const [vehicle, setVehicle] = useState<VehicleForm>({
    make: "", model: "", modelYear: "", licensePlate: "", vin: "",
  });
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<SaveResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [inspectionId, setInspectionId] = useState("");
  const [loadedBaselineId, setLoadedBaselineId] = useState<string | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [comparing, setComparing] = useState(false);
  const baselineInput = useRef<HTMLInputElement>(null);
  const currentInput = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);

  const allPhotos = [...baseline, ...current];

  useEffect(() => {
    photosRef.current = allPhotos;
  }, [baseline, current]);

  useEffect(() => {
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
  }, []);

  const matchedZones = useMemo(() => {
    const left = new Set(baseline.map((photo) => photo.zone).filter(Boolean));
    const right = new Set(current.map((photo) => photo.zone).filter(Boolean));
    return new Set([...left].filter((zone) => right.has(zone)));
  }, [baseline, current]);

  const assignedCount = allPhotos.filter((photo) => photo.zone).length;
  const allAssigned = allPhotos.length > 0 && assignedCount === allPhotos.length;
  const canSave = Boolean(
    vehicle.make.trim() && vehicle.model.trim() &&
    baseline.length > 0 && current.length > 0 &&
    allAssigned && matchedZones.size > 0 && !saving && !savedResult &&
    (loadedBaselineId ? current.every((photo) => Boolean(photo.file)) : allPhotos.every((photo) => Boolean(photo.file)))
  );

  function updateSide(side: Side, updater: (photos: Photo[]) => Photo[]) {
    setSavedResult(null);
    const setter = side === "baseline" ? setBaseline : setCurrent;
    setter((photos) => updater(photos));
  }

  function addFiles(side: Side, fileList: FileList | null) {
    if (!fileList) return;
    const accepted: Photo[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported file format`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_MB} MB`);
        return;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        zone: "",
      });
    });

    updateSide(side, (photos) => [...photos, ...accepted]);
    setNotice(errors.length ? errors.join(" · ") : accepted.length ? `${accepted.length} photo(s) added. Assign a vehicle area to each image.` : "");
    if (side === "baseline" && baselineInput.current) baselineInput.current.value = "";
    if (side === "current" && currentInput.current) currentInput.current.value = "";
  }

  function removePhoto(side: Side, id: string) {
    updateSide(side, (photos) => {
      const removed = photos.find((photo) => photo.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.preview);
      return photos.filter((photo) => photo.id !== id);
    });
  }

  function assignZone(side: Side, id: string, value: Zone | "") {
    updateSide(side, (photos) => {
      const occupied = photos.find((photo) => photo.zone === value && photo.id !== id);
      if (value && occupied) {
        const label = ZONES.find((zone) => zone.value === value)?.label ?? value;
        if (!window.confirm(`A photo is already assigned to "${label}". Do you want to replace it?`)) return photos;
        if (occupied.file) URL.revokeObjectURL(occupied.preview);
        return photos
          .filter((photo) => photo.id !== occupied.id)
          .map((photo) => photo.id === id ? { ...photo, zone: value } : photo);
      }
      return photos.map((photo) => photo.id === id ? { ...photo, zone: value } : photo);
    });
  }

  function openPicker(side: Side) {
    (side === "baseline" ? baselineInput : currentInput).current?.click();
  }

  async function loadSavedInspection() {
    const id = inspectionId.trim();
    if (!id || loadingInspection) return;
    setLoadingInspection(true);
    setNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${encodeURIComponent(id)}`);
      const data = await response.json() as {
        error?: string; message?: string;
        inspection: { id: string; type: string; inspectedAt: string };
        vehicle: { make: string; model: string; modelYear: number | null; licensePlate: string; vin: string };
        photos: Array<{ id: string; zone: Zone; filename: string; mimeType: string; sizeBytes: number; url: string }>;
      };
      if (!response.ok) throw new Error(data.message || data.error || "Unable to load this inspection.");
      if (data.inspection.type !== "BASELINE") throw new Error("This ID belongs to a CURRENT inspection. Please enter a BASELINE inspection ID.");
      if (!data.photos.length) throw new Error("This inspection has no saved photos.");
      const nextPhotos: Photo[] = data.photos.map((photo) => ({
        id: photo.id,
        preview: photo.url,
        filename: photo.filename,
        sizeBytes: photo.sizeBytes,
        zone: photo.zone,
        isSaved: true,
      }));
      setBaseline(nextPhotos);
      setCurrent([]);
      setVehicle({
        make: data.vehicle.make,
        model: data.vehicle.model,
        modelYear: data.vehicle.modelYear ? String(data.vehicle.modelYear) : "",
        licensePlate: data.vehicle.licensePlate,
        vin: data.vehicle.vin,
      });
      setLoadedBaselineId(data.inspection.id);
      setSavedResult(null);
      setComparison(null);
      setNotice(`Baseline inspection loaded · ${new Date(data.inspection.inspectedAt).toLocaleString()}. Add the new inspection photos to continue.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load the saved inspection.");
    } finally {
      setLoadingInspection(false);
    }
  }

  async function runComparison() {
    if (!savedResult || comparing) return;
    setComparing(true);
    setNotice("");
    setComparison(null);
    try {
      const response = await fetch(`${API_BASE_URL}/comparisons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselineInspectionId: savedResult.inspections.baseline,
          currentInspectionId: savedResult.inspections.current,
        }),
      });
      const data = await response.json() as ComparisonResult & { error?: string; message?: string };
      if (!response.ok) throw new Error(data.message || data.error || "Unable to compare the photos.");
      setComparison(data);
      setNotice("AI analysis completed. Review the findings before making any decisions.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to complete the AI analysis.");
    } finally {
      setComparing(false);
    }
  }

  async function saveInspections() {
    if (!canSave) {
      setNotice("Enter the make and model, add photos to both inspections, and assign an area to every image. At least one matching area is required.");
      return;
    }

    setSaving(true);
    setNotice("");
    const formData = new FormData();
    const serializePhotos = (photos: Photo[], side: Side) => photos.map((photo) => {
      if (!photo.file) throw new Error("A new inspection photo is missing its local file.");
      const fileField = `${side}__${photo.id}`;
      formData.append(fileField, photo.file, photo.file.name);
      return { zone: photo.zone, fileField };
    });

    const payload = loadedBaselineId
      ? { current: { photos: serializePhotos(current, "current") } }
      : {
          vehicle: {
            make: vehicle.make.trim(),
            model: vehicle.model.trim(),
            modelYear: vehicle.modelYear ? Number(vehicle.modelYear) : null,
            licensePlate: vehicle.licensePlate.trim(),
            vin: vehicle.vin.trim(),
          },
          baseline: { photos: serializePhotos(baseline, "baseline") },
          current: { photos: serializePhotos(current, "current") },
        };
    formData.append("payload", JSON.stringify(payload));

    try {
      const endpoint = loadedBaselineId
        ? `${API_BASE_URL}/inspections/${encodeURIComponent(loadedBaselineId)}/current`
        : `${API_BASE_URL}/inspections`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await response.json() as SaveResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to save the data.");
      }
      setSavedResult(data);
      setNotice(data.message || "Inspections guardadas correctamente en Supabase.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to connect to the backend. Make sure it is running.");
    } finally {
      setSaving(false);
    }
  }

  const renderPhotoCard = (photo: Photo, side: Side) => (
    <article className="photo-card" key={photo.id}>
      <div className="photo-preview">
        <img src={photo.preview} alt={photo.filename || photo.file?.name || "Inspection photo"} />
        {!photo.isSaved && <button className="icon-button remove-photo" onClick={() => removePhoto(side, photo.id)} aria-label="Remove photo" title="Remove">
          <Trash2 size={15} />
        </button>}
        <span className="photo-size">{((photo.sizeBytes ?? photo.file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</span>
      </div>
      <div className="photo-details">
        <p className="photo-name" title={photo.filename || photo.file?.name}>{photo.filename || photo.file?.name}</p>
        <label className="field-label" htmlFor={`zone-${photo.id}`}>Vehicle area</label>
        <div className="select-wrap">
          <select
            id={`zone-${photo.id}`}
            value={photo.zone}
            disabled={photo.isSaved}
            onChange={(event) => assignZone(side, photo.id, event.target.value as Zone | "")}
          >
            <option value="">Select an area...</option>
            {ZONES.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
          </select>
          <ChevronDown size={15} />
        </div>
        {photo.zone && matchedZones.has(photo.zone) && (
          <span className="match-label"><CheckCircle2 size={13} /> Matched area</span>
        )}
      </div>
    </article>
  );

  const renderInspection = (side: Side, photos: Photo[]) => {
    const isBaseline = side === "baseline";
    const title = isBaseline ? "Previous inspection" : "Current inspection";
    const subtitle = isBaseline ? "Reference photos" : "Photos from the new inspection";
    return (
      <section className={`inspection-panel ${isBaseline ? "baseline-panel" : "current-panel"}`}>
        <div className="panel-heading">
          <div className="panel-icon">{isBaseline ? <Clock3 size={19} /> : <Camera size={19} />}</div>
          <div>
            <div className="panel-title-row">
              <h2>{title}</h2>
              <span className={`step-tag ${isBaseline ? "tag-muted" : "tag-blue"}`}>{isBaseline ? "01 · BASELINE" : "02 · CURRENT"}</span>
            </div>
            <p>{subtitle}{isBaseline && loadedBaselineId ? ` · Saved ID: ${loadedBaselineId}` : ""}</p>
          </div>
          <span className="photo-counter">{photos.length} photos</span>
        </div>

        {photos.length === 0 ? (
          <button
            className="dropzone"
            onClick={() => openPicker(side)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(side, event.dataTransfer.files);
            }}
          >
            <span className="upload-icon"><UploadCloud size={23} /></span>
            <strong>Select photos</strong>
            <span>Drag images here or click to browse</span>
            <small>JPG, PNG, or WEBP · Up to {MAX_FILE_SIZE_MB} MB per imagen</small>
          </button>
        ) : (
          <>
            <div className="photo-grid">{photos.map((photo) => renderPhotoCard(photo, side))}</div>
            {!(isBaseline && loadedBaselineId) && <button className="add-more-button" onClick={() => openPicker(side)}>
              <Plus size={16} /> Add more photos
            </button>}
          </>
        )}
      </section>
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Rent Car AI home">
          <span className="brand-mark"><Layers3 size={20} /></span>
          <span>rentcar<span className="brand-accent">.ai</span></span>
        </a>
        <div className="topbar-right">
          <span className="prototype-pill"><span /> PROTOTYPE</span>
          <span className="user-avatar">JS</span>
        </div>
      </header>

      <main className="main-content">
        <div className="breadcrumb"><span>Inspections</span><span>/</span><strong>Vehicle comparison</strong></div>

        <section className="page-intro">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> SMART INSPECTION</div>
            <h1>Compare inspections</h1>
            <p>Enter the vehicle details, save photos from both inspections, and then run the AI analysis.</p>
          </div>
          <div className="secure-note"><ShieldCheck size={17} /><span>Private images<br /><strong>Supabase storage</strong></span></div>
        </section>

        <section className="matching-section load-inspection">
          <div className="matching-heading">
            <div className="matching-icon"><Clock3 size={18} /></div>
            <div><h2>Load saved inspection</h2><p>Use a previous inspection as the baseline for a new comparison.</p></div>
          </div>
          <div className="load-inspection-controls">
            <input value={inspectionId} onChange={(event) => setInspectionId(event.target.value)} placeholder="Enter baseline Inspection ID" aria-label="Baseline inspection ID" />
            <button className="add-more-button" onClick={() => void loadSavedInspection()} disabled={!inspectionId.trim() || loadingInspection}>
              {loadingInspection ? "Loading..." : "Load inspection"}
            </button>
          </div>
          {loadedBaselineId && <p className="loaded-baseline"><CheckCircle2 size={14} /> Baseline loaded: {loadedBaselineId}. Original photos are read-only.</p>}
        </section>

        <section className="vehicle-summary vehicle-form">
          <div className="vehicle-form-heading">
            <div className="vehicle-thumb"><CarFront size={25} /></div>
            <div className="vehicle-info">
              <span className="summary-label">VEHICLE DETAILS</span>
              <strong>Vehicle identification</strong>
              <span>Enter the vehicle details before saving the inspections.</span>
            </div>
            <div className="vehicle-meta"><span>STATUS</span><strong className={savedResult ? "saved-state" : "draft-state"}><i /> {savedResult ? "Saved" : "Draft"}</strong></div>
          </div>
          <div className="vehicle-fields">
            <label>Make *<input value={vehicle.make} placeholder="e.g. Toyota" disabled={Boolean(loadedBaselineId)} onChange={(e) => { setVehicle({ ...vehicle, make: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>Model *<input value={vehicle.model} placeholder="e.g. Corolla" disabled={Boolean(loadedBaselineId)} onChange={(e) => { setVehicle({ ...vehicle, model: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>Year<input type="number" min="1886" max="2100" value={vehicle.modelYear} placeholder="2022" disabled={Boolean(loadedBaselineId)} onChange={(e) => { setVehicle({ ...vehicle, modelYear: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>License plate<input value={vehicle.licensePlate} placeholder="ABC-1234" disabled={Boolean(loadedBaselineId)} onChange={(e) => { setVehicle({ ...vehicle, licensePlate: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>VIN / Chassis<input value={vehicle.vin} placeholder="Chassis number" disabled={Boolean(loadedBaselineId)} onChange={(e) => { setVehicle({ ...vehicle, vin: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
          </div>
        </section>

        <div className="section-heading">
          <div><h2>Photo records</h2><p>Select multiple views for each inspection and assign the same area to both sides to compare them.</p></div>
          <div className="selection-progress"><span>{assignedCount} de {allPhotos.length} photos categorized</span><div className="progress-track"><span style={{ width: `${allPhotos.length ? Math.min(100, (assignedCount / allPhotos.length) * 100) : 0}%` }} /></div></div>
        </div>

        <div className="inspection-grid">
          {renderInspection("baseline", baseline)}
          <div className="comparison-connector"><ArrowLeftRight size={17} /><span>VS</span></div>
          {renderInspection("current", current)}
        </div>

        {notice && (
          <div className={`notice ${savedResult ? "notice-success" : ""}`} role="status">
            {savedResult ? <CheckCircle2 size={17} /> : <Info size={17} />}
            <span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        )}

        <section className="matching-section">
          <div className="matching-heading">
            <div className="matching-icon"><ArrowLeftRight size={18} /></div>
            <div><h2>Areas ready for comparison</h2><p>Only areas with a photo in both inspections will be analyzed.</p></div>
            <span className="match-count">{matchedZones.size} {matchedZones.size === 1 ? "area" : "areas"}</span>
          </div>
          {matchedZones.size ? (
            <div className="matched-list">
              {ZONES.filter((zone) => matchedZones.has(zone.value)).map((zone) => (
                <span className="matched-chip" key={zone.value}><Check size={13} />{zone.label}</span>
              ))}
            </div>
          ) : (
            <div className="empty-match"><AlertCircle size={17} /><span>Select and categorize at least one matching area in both inspections.</span></div>
          )}
        </section>

        <section className="ai-info">
          <div className="ai-symbol"><Sparkles size={19} /></div>
          <div><strong>AI visual analysis</strong><p>Compare photos from both inspections using the provider configured in the backend.</p></div>
          <span className="coming-soon">GEMINI / CLAUDE</span>
        </section>

        {comparison && (
          <section className="matching-section ai-results">
            <div className="matching-heading">
              <div className="matching-icon"><Sparkles size={18} /></div>
              <div>
                <h2>Analysis results</h2>
                <p>{comparison.result === "NEW_DAMAGE" ? "Potential new damage was detected." : comparison.result === "NO_CHANGE" ? "No new visible damage was identified." : "A reliable conclusion could not be reached."}</p>
              </div>
              <span className="match-count">{comparison.result.replace("_", " ")}</span>
            </div>
            <p className="ai-summary">{comparison.summary}</p>
            <div className="matched-list">
              {comparison.zones.map((zone) => (
                <span className="matched-chip" key={zone.zone}>{ZONES.find((item) => item.value === zone.zone)?.label ?? zone.zone}: {zone.result.replace("_", " ")}</span>
              ))}
            </div>
            {comparison.findings.length > 0 && (
              <div className="ai-findings">
                <h3>Findings requiring human review</h3>
                {comparison.findings.map((finding) => (
                  <article className="ai-finding" key={finding.id}>
                    <strong>{finding.finding_type} · {ZONES.find((item) => item.value === finding.zone)?.label ?? finding.zone}</strong>
                    <span>{finding.location_description}</span>
                    <p>{finding.description}</p>
                    <small>Severity: {finding.severity} · Estimated confidence: {Math.round(finding.confidence * 100)}% · Human review required</small>
                  </article>
                ))}
              </div>
            )}
            <p className="ai-disclaimer">AI results may be inaccurate. Confidence scores are not calibrated, and all findings require human review. Model: {comparison.model} · Tokens: {comparison.usage.inputTokens} input / {comparison.usage.outputTokens} salida.</p>
          </section>
        )}

        <footer className="page-actions">
          <span className="local-disclaimer">
            {savedResult ? <CheckCircle2 size={14} /> : <Info size={14} />}
            {savedResult ? `${savedResult.images.length} images saved to Supabase` : "Vehicle details and photos have not been saved yet."}
          </span>
          <div className="action-buttons">
            <button className="save-button" onClick={() => void saveInspections()} disabled={!canSave}>
              <Save size={17} /> {saving ? "Saving..." : savedResult ? "Saved" : "Save inspections"}
            </button>
            <button className="compare-button" onClick={() => void runComparison()} disabled={!savedResult || comparing} title={!savedResult ? "Save the inspections first." : "Compare the saved photos using AI."}>
              <Sparkles size={17} /> {comparing ? "Analyzing..." : "Compare with AI"}
            </button>
          </div>
        </footer>
      </main>

      <input ref={baselineInput} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addFiles("baseline", event.target.files)} />
      <input ref={currentInput} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addFiles("current", event.target.files)} />
    </div>
  );
}

export default App;
