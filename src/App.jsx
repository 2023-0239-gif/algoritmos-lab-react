import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exercises, parseValues } from './exercises.js';

const iconPaths = {
  ArrowLeft: <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
  ArrowRight: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  BookOpen: <><path d="M12 7v14"/><path d="M3 18V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13"/><path d="M3 18a3 3 0 0 0 3 3h15"/><path d="M3 7h18"/></>,
  Check: <path d="m5 12 4 4L19 6"/>,
  ChevronRight: <path d="m9 18 6-6-6-6"/>,
  CircleHelp: <><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
  Code2: <><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/><path d="m14.5 4-5 16"/></>,
  Search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  Settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8L6.3 12.2l1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.7Z"/></>,
  Moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
  Sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  Sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/></>,
  X: <><path d="m18 6-12 12"/><path d="m6 6 12 12"/></>,
};
const Icon = ({ name, size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;

const categories = ['Todos', ...new Set(exercises.map((exercise) => exercise.category))];
const initial = (exercise) => Object.fromEntries(exercise.fields.map((field) => [field.name, field.type === 'workers' ? [{ hours: '', rate: '' }] : field.placeholder || '']));
const format = (value) => typeof value === 'number' ? new Intl.NumberFormat('es-DO', { maximumFractionDigits: 4 }).format(value) : value;
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [values, setValues] = useState(() => initial(exercises[0]));
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [workerRows, setWorkerRows] = useState([{ hours: '', rate: '' }]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('algoritmoslab-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const selectedPanelRef = useRef(null);
  const visible = useMemo(() => {
    const search = normalize(query.trim());
    return exercises.filter((exercise) => (category === 'Todos' || exercise.category === category) && normalize(`${exercise.title} ${exercise.description} ${exercise.category} ${exercise.id}`).includes(search));
  }, [category, query]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('algoritmoslab-theme', theme); } catch { /* El tema sigue disponible durante esta visita. */ }
  }, [theme]);

  useEffect(() => {
    if (selected) selectedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected]);

  const openExercise = (exercise) => {
    setSelected(exercise);
    setValues(initial(exercise));
    setWorkerRows([{ hours: '', rate: '' }]);
    setResults(null);
    setError('');
  };
  const update = (name, value) => { setValues((current) => ({ ...current, [name]: value })); setResults(null); setError(''); };
  const reset = () => { setValues(initial(selected)); setWorkerRows([{ hours: '', rate: '' }]); setResults(null); setError(''); };
  const run = (event) => {
    event.preventDefault();
    try {
      const raw = { ...values };
      const staffField = selected.fields.find((field) => field.type === 'workers');
      if (staffField) {
        const staff = workerRows.map((row) => ({ hours: Number(row.hours), rate: Number(row.rate) }));
        if (staff.some((row) => row.hours < 0 || row.rate < 0 || !Number.isFinite(row.hours + row.rate) || row.hours === 0 || row.rate === 0)) throw new Error('Completa horas y tarifa con valores positivos para cada trabajador.');
        raw[staffField.name] = staff;
      }
      const parsed = parseValues(selected, raw);
      setResults(selected.run(parsed));
      setError('');
    } catch (exception) {
      setResults(null);
      setError(exception.message || 'No se pudo realizar el cálculo.');
    }
  };

  return <div className="app-shell">
    <header className="topbar"><a href="#inicio" className="brand" onClick={() => { setSelected(null); setQuery(''); }}><span className="brand-icon"><Icon name="Code2" size={19} /></span><span>Algoritmos<span className="brand-soft">Lab</span></span></a><div className="topbar-note"><span className="rd-flag" role="img" aria-label="República Dominicana"><i/><i/><i/><i/></span><span className="local-note">Hecho en RD</span><span className="topbar-divider">·</span>30 mini aplicaciones <span className="topbar-divider">·</span> React interactivo</div><div className="header-actions"><a className="top-link" href="#catalogo">Explorar <Icon name="ArrowRight" size={15}/></a><div className="options-wrap"><button className="options-button" type="button" aria-expanded={optionsOpen} aria-controls="options-menu" onClick={() => setOptionsOpen((open) => !open)}><Icon name="Settings" size={16}/><span>Opciones</span></button>{optionsOpen && <div className="options-menu" id="options-menu"><div className="options-heading"><div><b>Opciones</b><small>Personaliza tu experiencia</small></div><button type="button" className="options-close" onClick={() => setOptionsOpen(false)} aria-label="Cerrar opciones"><Icon name="X" size={15}/></button></div><div className="theme-option"><span className="theme-icon"><Icon name={theme === 'dark' ? 'Moon' : 'Sun'} size={17}/></span><span className="theme-copy"><b>Tema oscuro</b><small>Usar colores oscuros en la página</small></span><button className={`theme-switch ${theme === 'dark' ? 'on' : ''}`} type="button" role="switch" aria-checked={theme === 'dark'} aria-label="Cambiar tema oscuro" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}><span/></button></div><div className="options-footer">Tu preferencia se guarda en este dispositivo.</div></div>}</div></div></header>

    <main id="inicio">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Icon name="Sparkles" size={14}/> APRENDER HACIENDO</div><h1>La lógica cobra<br/><span>vida aquí.</span></h1><p>¡Dale! Explora los ejercicios, cambia los datos y mira cómo responde cada mini programa. Aprender también es probar a tu manera.</p><a href="#catalogo" className="primary-link">Explorar aplicaciones <Icon name="ArrowRight" size={17}/></a></div>
        <div className="hero-art" aria-hidden="true"><div className="art-window"><div className="art-dots"><i/><i/><i/></div><div className="art-code"><span>const</span> idea = <b>aprender</b>();<br/><span>for</span> (cada ejercicio) &#123;<br/><em>&nbsp;&nbsp;probar();</em><br/><em>&nbsp;&nbsp;descubrir();</em><br/>&#125;<br/><label>✓ resultado: ¡funciona!</label></div></div><div className="art-orbit orbit-one">&lt;/&gt;</div><div className="art-orbit orbit-two">✳</div><div className="hero-badge"><strong>30</strong><span>retos<br/>listos</span></div></div>
        <div className="hero-foot"><span>Una colección de ejercicios de C#</span><span className="hero-foot-line"/><span>Reimaginados para la web con React</span></div>
      </section>

      <section className="catalog" id="catalogo">
        <div className="section-heading"><div><div className="eyebrow dark"><Icon name="BookOpen" size={14}/> TU ESPACIO DE PRÁCTICA</div><h2>{selected ? 'Elige otra aplicación' : '¿Qué quieres probar?'}</h2><p>Encuentra un ejercicio por nombre, tema o número.</p></div><div className="count-pill"><b>{visible.length}</b> de 30 aplicaciones</div></div>
        <div className="catalog-layout">
          <aside className="sidebar"><label className="search-label" htmlFor="exercise-search">Buscar aplicaciones</label><div className="searchbox"><Icon name="Search" size={17}/><input id="exercise-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. salario, geometría…"/><kbd>/</kbd></div><div className="filter-title">TEMAS</div><nav className="category-list" aria-label="Filtrar por tema">{categories.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}><span>{item}</span><span className="category-count">{item === 'Todos' ? exercises.length : exercises.filter((e) => e.category === item).length}</span></button>)}</nav><div className="tip-card"><Icon name="CircleHelp" size={17}/><b>¿Cómo se usa?</b><span>Elige un reto, completa los datos y pulsa «Ejecutar» para ver el resultado al instante.</span></div></aside>
          <div className="catalog-main">
            {selected && <div className="selected-exercise" ref={selectedPanelRef}><div className="active-app-banner"><span className="active-pulse"/><span>MINI PROGRAMA ABIERTO</span><b>EJERCICIO {String(selected.id).padStart(2, '0')}</b></div><button className="back-button" onClick={() => { setSelected(null); setResults(null); setError(''); }}><Icon name="ArrowLeft" size={15}/> Volver al catálogo</button><div className="exercise-panel"><div className="exercise-panel-head"><div className="exercise-icon">{selected.icon}</div><div><div className="exercise-meta">APLICACIÓN {String(selected.id).padStart(2, '0')} <span>·</span> {selected.category}</div><h3>{selected.title}</h3></div><button className="close-button" onClick={() => setSelected(null)} aria-label="Cerrar"><Icon name="X" size={18}/></button></div><p className="exercise-description">{selected.description}</p>
                <form onSubmit={run} className="exercise-form">
                  {selected.fields.map((field) => <div className="field" key={field.name}><label htmlFor={field.name}>{field.label}</label>
                    {field.type === 'workers' ? <div className="worker-list">{workerRows.map((row, index) => <div className="worker-row" key={index}><span>#{index + 1}</span><input aria-label={`Horas trabajador ${index + 1}`} type="number" min="0" step="any" placeholder="Horas" value={row.hours} onChange={(event) => setWorkerRows((current) => current.map((item, i) => i === index ? { ...item, hours: event.target.value } : item))}/><input aria-label={`Tarifa trabajador ${index + 1}`} type="number" min="0" step="any" placeholder="Pago / hora" value={row.rate} onChange={(event) => setWorkerRows((current) => current.map((item, i) => i === index ? { ...item, rate: event.target.value } : item))}/>{workerRows.length > 1 && <button type="button" className="remove-row" onClick={() => setWorkerRows((current) => current.filter((_, i) => i !== index))} aria-label="Quitar trabajador"><Icon name="X" size={15}/></button>}</div>)}<button type="button" className="add-row" onClick={() => setWorkerRows((current) => [...current, { hours: '', rate: '' }])}>+ Agregar trabajador</button></div>
                      : field.type === 'textarea' || field.multiline ? <textarea id={field.name} rows={field.exactCount > 10 ? 5 : 3} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.placeholder} required={Boolean(field.exactCount)}/>
                      : field.type === 'pairs' ? <textarea id={field.name} rows={field.exactCount > 5 ? 6 : 4} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.placeholder} required={Boolean(field.exactCount)}/>
                      : <input id={field.name} type="number" step={field.integer ? '1' : 'any'} min={field.min} max={field.max} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.placeholder} required/>}
                    {field.exactCount && <small>Separa los valores con coma o salto de línea. Se necesitan {field.exactCount}.</small>}
                    {field.type === 'pairs' && <small>Un par por línea, separado por coma. {field.exactCount ? `Se necesitan ${field.exactCount} pares.` : 'Usa 0 como primer valor para terminar si aplica.'}</small>}
                    {field.multiline && <small>Una palabra o frase por línea, en el orden indicado.</small>}
                    {field.type === 'textarea' && !field.exactCount && <small>Separa cada valor con coma o salto de línea.</small>}
                  </div>)}
                  {selected.fields.length === 0 && <div className="instant-note"><Icon name="Sparkles" size={16}/> Este ejercicio no necesita datos. ¡Ejecútalo para ver el resultado!</div>}
                  {error && <div className="form-error" role="alert">{error}</div>}
                  <div className="form-actions"><button className="run-button" type="submit"><span>Ejecutar</span><Icon name="ArrowRight" size={16}/></button><button className="reset-button" type="button" onClick={reset}>Limpiar</button></div>
                </form>
                {results && <div className="results-box" aria-live="polite"><div className="results-title"><span><Icon name="Check" size={16}/></span><div><b>Resultado</b><small>El ejercicio se ejecutó correctamente</small></div></div><div className="result-list">{results.map(([label, value], index) => <div className={index === results.length - 1 ? 'result-row result-highlight' : 'result-row'} key={`${label}-${index}`}><span>{label}</span><strong>{format(value)}</strong></div>)}</div></div>}
              </div></div>}
            {visible.length ? <div className="exercise-grid">{visible.map((exercise) => <button className={`exercise-card ${selected?.id === exercise.id ? 'is-selected' : ''}`} aria-pressed={selected?.id === exercise.id} key={exercise.id} onClick={() => openExercise(exercise)}><span className="card-top"><span className="card-icon">{exercise.icon}</span><span className="card-number">{selected?.id === exercise.id ? 'ABIERTO' : String(exercise.id).padStart(2, '0')}</span></span><span className="card-category">{exercise.category}</span><b className="card-title">{exercise.title}</b><span className="card-description">{exercise.description}</span><span className="card-open">{selected?.id === exercise.id ? 'Programa activo' : 'Abrir aplicación'} <Icon name="ChevronRight" size={15}/></span></button>)}</div> : <div className="empty-state"><Icon name="Search" size={24}/><b>No encontramos ese ejercicio</b><span>Prueba otra palabra o selecciona otro tema.</span><button onClick={() => { setQuery(''); setCategory('Todos'); }}>Ver los 30 ejercicios</button></div>}
          </div>
        </div>
      </section>
      <section className="learning-strip"><div className="learning-icon"><Icon name="Sparkles" size={18}/></div><div><b>Aprender también es experimentar.</b><span>Cada aplicación es una forma distinta de practicar decisiones, ciclos y cálculos.</span></div><span className="learning-count">{exercises.length} ejercicios</span></section>
    </main>
    <footer className="footer"><a className="brand" href="#inicio"><span className="brand-icon"><Icon name="Code2" size={18}/></span><span>Algoritmos<span className="brand-soft">Lab</span></span></a><span className="student-signature"><strong>Leuri Galva</strong><small>Matrícula 2023-0239</small></span><span>Desde RD, para aprender, probar y volver a intentar.</span><span>Ejercicios interactivos en React</span></footer>
  </div>;
}

