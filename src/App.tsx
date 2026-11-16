import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeftRight, Camera, Check, CheckCircle2,
  ChevronDown, Clock3, Info, Layers3, Plus, ShieldCheck, Sparkles,
  Trash2, UploadCloud, X,
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
  const [notice, setNotice] = useState("");
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
  const comparisonReady = matchedZones.size > 0;

  function updateSide(side: Side, updater: (photos: Photo[]) => Photo[]) {
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
            <p>Seleccione las fotografías de ambas inspecciones. La IA analizará las mismas zonas para identificar posibles novedades.</p>
          </div>
          <div className="secure-note"><ShieldCheck size={17} /><span>Imágenes privadas<br /><strong>Acceso protegido</strong></span></div>
        </section>

        <section className="vehicle-summary">
          <div className="vehicle-thumb"><Camera size={25} /></div>
          <div className="vehicle-info">
            <span className="summary-label">VEHÍCULO EN INSPECCIÓN</span>
            <strong>Vehículo de prueba</strong>
            <span>Complete las fotografías para iniciar la comparación</span>
          </div>
          <div className="vehicle-meta"><span>VIN</span><strong>Por registrar</strong></div>
          <div className="vehicle-meta"><span>ESTADO</span><strong className="draft-state"><i /> Borrador</strong></div>
        </section>

        <div className="section-heading">
          <div><h2>Registro fotográfico</h2><p>Seleccione varias tomas en cada inspección y asígneles la misma zona para compararlas.</p></div>
          <div className="selection-progress"><span>{assignedCount} fotografías clasificadas</span><div className="progress-track"><span style={{ width: `${Math.min(100, (assignedCount / 8) * 100)}%` }} /></div></div>
        </div>

        <div className="inspection-grid">
          {renderInspection("baseline", baseline)}
          <div className="comparison-connector"><ArrowLeftRight size={17} /><span>VS</span></div>
          {renderInspection("current", current)}
        </div>

        {notice && (
          <div className="notice" role="status">
            <Info size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={15} /></button>
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
          <div><strong>Análisis con Claude Vision</strong><p>La comparación identificará posibles rayones, abolladuras, grietas y cambios visibles. Los resultados requerirán revisión humana.</p></div>
          <span className="coming-soon">SIGUIENTE ETAPA</span>
        </section>

        <footer className="page-actions">
          <span className="local-disclaimer"><Info size={14} /> Prototipo local: las imágenes aún no se han guardado.</span>
          <button className="compare-button" disabled={!comparisonReady} title="Disponible cuando se implemente la API backend">
            <Sparkles size={17} /> Comparar con IA <span className="button-soon">Próximamente</span>
          </button>
        </footer>
      </main>

      <input ref={baselineInput} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addFiles("baseline", event.target.files)} />
      <input ref={currentInput} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addFiles("current", event.target.files)} />
    </div>
  );
}

export default App;
