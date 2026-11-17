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
  file: File;
  preview: string;
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
  { value: "front", label: "Frontal" },
  { value: "rear", label: "Posterior" },
  { value: "left_side", label: "Lateral izquierdo" },
  { value: "right_side", label: "Lateral derecho" },
  { value: "front_left_corner", label: "Esquina delantera izquierda" },
  { value: "front_right_corner", label: "Esquina delantera derecha" },
  { value: "rear_left_corner", label: "Esquina trasera izquierda" },
  { value: "rear_right_corner", label: "Esquina trasera derecha" },
  { value: "interior", label: "Interior" },
  { value: "dashboard", label: "Tablero / odómetro" },
  { value: "detail", label: "Detalle adicional" },
];

const MAX_FILE_SIZE_MB = 12;
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
    allAssigned && matchedZones.size > 0 && !saving && !savedResult
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
        errors.push(`${file.name}: formato no compatible`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: supera ${MAX_FILE_SIZE_MB} MB`);
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
    setNotice(errors.length ? errors.join(" · ") : accepted.length ? `${accepted.length} fotografía(s) agregada(s). Asigne una toma a cada imagen.` : "");
    if (side === "baseline" && baselineInput.current) baselineInput.current.value = "";
    if (side === "current" && currentInput.current) currentInput.current.value = "";
  }

  function removePhoto(side: Side, id: string) {
    updateSide(side, (photos) => {
      const removed = photos.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return photos.filter((photo) => photo.id !== id);
    });
  }

  function assignZone(side: Side, id: string, value: Zone | "") {
    updateSide(side, (photos) => {
      const occupied = photos.find((photo) => photo.zone === value && photo.id !== id);
      if (value && occupied) {
        const label = ZONES.find((zone) => zone.value === value)?.label ?? value;
        if (!window.confirm(`Ya existe una fotografía para "${label}". ¿Desea reemplazarla?`)) return photos;
        URL.revokeObjectURL(occupied.preview);
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
      if (!response.ok) throw new Error(data.message || data.error || "No fue posible comparar las fotografías.");
      setComparison(data);
      setNotice("Análisis de Claude Vision completado. Revise los hallazgos antes de tomar decisiones.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No fue posible completar el análisis con IA.");
    } finally {
      setComparing(false);
    }
  }

  async function saveInspections() {
    if (!canSave) {
      setNotice("Complete marca y modelo, agregue fotografías a ambas inspecciones y asigne una zona a cada imagen. Debe existir al menos una zona coincidente.");
      return;
    }

    setSaving(true);
    setNotice("");
    const formData = new FormData();
    const serializePhotos = (photos: Photo[], side: Side) => photos.map((photo) => {
      const fileField = `${side}__${photo.id}`;
      formData.append(fileField, photo.file, photo.file.name);
      return { zone: photo.zone, fileField };
    });

    const payload = {
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
      const response = await fetch(`${API_BASE_URL}/inspections`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json() as SaveResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.message || data.error || "No se pudieron guardar los datos.");
      }
      setSavedResult(data);
      setNotice(data.message || "Inspecciones guardadas correctamente en Supabase.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No fue posible conectar con el backend. Verifique que esté ejecutándose.");
    } finally {
      setSaving(false);
    }
  }

  const renderPhotoCard = (photo: Photo, side: Side) => (
    <article className="photo-card" key={photo.id}>
      <div className="photo-preview">
        <img src={photo.preview} alt={photo.file.name} />
        <button className="icon-button remove-photo" onClick={() => removePhoto(side, photo.id)} aria-label="Eliminar fotografía" title="Eliminar">
          <Trash2 size={15} />
        </button>
        <span className="photo-size">{(photo.file.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>
      <div className="photo-details">
        <p className="photo-name" title={photo.file.name}>{photo.file.name}</p>
        <label className="field-label" htmlFor={`zone-${photo.id}`}>Toma del vehículo</label>
        <div className="select-wrap">
          <select
            id={`zone-${photo.id}`}
            value={photo.zone}
            onChange={(event) => assignZone(side, photo.id, event.target.value as Zone | "")}
          >
            <option value="">Seleccionar toma...</option>
            {ZONES.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
          </select>
          <ChevronDown size={15} />
        </div>
        {photo.zone && matchedZones.has(photo.zone) && (
          <span className="match-label"><CheckCircle2 size={13} /> Toma emparejada</span>
        )}
      </div>
    </article>
  );

  const renderInspection = (side: Side, photos: Photo[]) => {
    const isBaseline = side === "baseline";
    const title = isBaseline ? "Inspección anterior" : "Inspección actual";
    const subtitle = isBaseline ? "Fotografías de referencia" : "Fotografías de la nueva revisión";
    return (
      <section className={`inspection-panel ${isBaseline ? "baseline-panel" : "current-panel"}`}>
        <div className="panel-heading">
          <div className="panel-icon">{isBaseline ? <Clock3 size={19} /> : <Camera size={19} />}</div>
          <div>
            <div className="panel-title-row">
              <h2>{title}</h2>
              <span className={`step-tag ${isBaseline ? "tag-muted" : "tag-blue"}`}>{isBaseline ? "01 · BASELINE" : "02 · CURRENT"}</span>
            </div>
            <p>{subtitle}</p>
          </div>
          <span className="photo-counter">{photos.length} fotos</span>
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
            <strong>Seleccionar fotografías</strong>
            <span>Arrastre imágenes aquí o haga clic para buscarlas</span>
            <small>JPG, PNG o WEBP · Máximo {MAX_FILE_SIZE_MB} MB por imagen</small>
          </button>
        ) : (
          <>
            <div className="photo-grid">{photos.map((photo) => renderPhotoCard(photo, side))}</div>
            <button className="add-more-button" onClick={() => openPicker(side)}>
              <Plus size={16} /> Agregar más fotografías
            </button>
          </>
        )}
      </section>
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Rent Car AI inicio">
          <span className="brand-mark"><Layers3 size={20} /></span>
          <span>rentcar<span className="brand-accent">.ai</span></span>
        </a>
        <div className="topbar-right">
          <span className="prototype-pill"><span /> PROTOTIPO</span>
          <span className="user-avatar">JS</span>
        </div>
      </header>

      <main className="main-content">
        <div className="breadcrumb"><span>Inspecciones</span><span>/</span><strong>Comparación de vehículo</strong></div>

        <section className="page-intro">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> INSPECCIÓN INTELIGENTE</div>
            <h1>Comparar inspecciones</h1>
            <p>Registre el vehículo, guarde las fotografías de ambas inspecciones y luego podrá solicitar el análisis de IA.</p>
          </div>
          <div className="secure-note"><ShieldCheck size={17} /><span>Imágenes privadas<br /><strong>Almacenamiento Supabase</strong></span></div>
        </section>

        <section className="vehicle-summary vehicle-form">
          <div className="vehicle-form-heading">
            <div className="vehicle-thumb"><CarFront size={25} /></div>
            <div className="vehicle-info">
              <span className="summary-label">DATOS DEL VEHÍCULO</span>
              <strong>Identificación del vehículo</strong>
              <span>Complete los datos antes de guardar las inspecciones.</span>
            </div>
            <div className="vehicle-meta"><span>ESTADO</span><strong className={savedResult ? "saved-state" : "draft-state"}><i /> {savedResult ? "Guardado" : "Borrador"}</strong></div>
          </div>
          <div className="vehicle-fields">
            <label>Marca *<input value={vehicle.make} placeholder="Ej. Toyota" onChange={(e) => { setVehicle({ ...vehicle, make: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>Modelo *<input value={vehicle.model} placeholder="Ej. Corolla" onChange={(e) => { setVehicle({ ...vehicle, model: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>Año<input type="number" min="1886" max="2100" value={vehicle.modelYear} placeholder="2022" onChange={(e) => { setVehicle({ ...vehicle, modelYear: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>Placa<input value={vehicle.licensePlate} placeholder="ABC-1234" onChange={(e) => { setVehicle({ ...vehicle, licensePlate: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
            <label>VIN / Chasis<input value={vehicle.vin} placeholder="Número de chasis" onChange={(e) => { setVehicle({ ...vehicle, vin: e.target.value }); setSavedResult(null); setComparison(null); }} /></label>
          </div>
        </section>

        <div className="section-heading">
          <div><h2>Registro fotográfico</h2><p>Seleccione varias tomas en cada inspección y asígneles la misma zona para compararlas.</p></div>
          <div className="selection-progress"><span>{assignedCount} de {allPhotos.length} fotografías clasificadas</span><div className="progress-track"><span style={{ width: `${allPhotos.length ? Math.min(100, (assignedCount / allPhotos.length) * 100) : 0}%` }} /></div></div>
        </div>

        <div className="inspection-grid">
          {renderInspection("baseline", baseline)}
          <div className="comparison-connector"><ArrowLeftRight size={17} /><span>VS</span></div>
          {renderInspection("current", current)}
        </div>

        {notice && (
          <div className={`notice ${savedResult ? "notice-success" : ""}`} role="status">
            {savedResult ? <CheckCircle2 size={17} /> : <Info size={17} />}
            <span>{notice}</span><button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={15} /></button>
          </div>
        )}

        <section className="matching-section">
          <div className="matching-heading">
            <div className="matching-icon"><ArrowLeftRight size={18} /></div>
            <div><h2>Zonas listas para comparar</h2><p>Solo se analizarán las zonas que tengan una fotografía en ambas inspecciones.</p></div>
            <span className="match-count">{matchedZones.size} {matchedZones.size === 1 ? "zona" : "zonas"}</span>
          </div>
          {matchedZones.size ? (
            <div className="matched-list">
              {ZONES.filter((zone) => matchedZones.has(zone.value)).map((zone) => (
                <span className="matched-chip" key={zone.value}><Check size={13} />{zone.label}</span>
              ))}
            </div>
          ) : (
            <div className="empty-match"><AlertCircle size={17} /><span>Seleccione y clasifique al menos una misma toma en ambas inspecciones.</span></div>
          )}
        </section>

        <section className="ai-info">
          <div className="ai-symbol"><Sparkles size={19} /></div>
          <div><strong>Análisis con Claude Vision</strong><p>Primero se guardan los originales y sus metadatos. El análisis de daños será el siguiente paso.</p></div>
          <span className="coming-soon">SIGUIENTE ETAPA</span>
        </section>

        {comparison && (
          <section className="matching-section ai-results">
            <div className="matching-heading">
              <div className="matching-icon"><Sparkles size={18} /></div>
              <div>
                <h2>Resultado del análisis</h2>
                <p>{comparison.result === "NEW_DAMAGE" ? "Se detectaron posibles daños nuevos." : comparison.result === "NO_CHANGE" ? "No se identificaron daños nuevos visibles." : "No fue posible llegar a una conclusión fiable."}</p>
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
                <h3>Hallazgos para revisión humana</h3>
                {comparison.findings.map((finding) => (
                  <article className="ai-finding" key={finding.id}>
                    <strong>{finding.finding_type} · {ZONES.find((item) => item.value === finding.zone)?.label ?? finding.zone}</strong>
                    <span>{finding.location_description}</span>
                    <p>{finding.description}</p>
                    <small>Severidad: {finding.severity} · Confianza estimada: {Math.round(finding.confidence * 100)}% · Requiere revisión humana</small>
                  </article>
                ))}
              </div>
            )}
            <p className="ai-disclaimer">La IA puede equivocarse. La confianza no está calibrada y todos los hallazgos requieren revisión humana. Modelo: {comparison.model} · Tokens: {comparison.usage.inputTokens} entrada / {comparison.usage.outputTokens} salida.</p>
          </section>
        )}

        <footer className="page-actions">
          <span className="local-disclaimer">
            {savedResult ? <CheckCircle2 size={14} /> : <Info size={14} />}
            {savedResult ? `${savedResult.images.length} imágenes guardadas en Supabase` : "Aún no se han guardado los datos ni las imágenes."}
          </span>
          <div className="action-buttons">
            <button className="save-button" onClick={() => void saveInspections()} disabled={!canSave}>
              <Save size={17} /> {saving ? "Guardando..." : savedResult ? "Guardado" : "Guardar inspecciones"}
            </button>
            <button className="compare-button" disabled title="El procesamiento con IA se implementará después de completar el guardado.">
              <Sparkles size={17} /> Comparar con IA <span className="button-soon">Próximamente</span>
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
