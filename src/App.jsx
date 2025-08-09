import React, { useEffect, useMemo, useState } from "react";

// Croatian Phrase Coach – single-file React app
// Flashcards + Spaced repetition + TTS + Import/Export

/** @typedef {{
  id: string,
  hr: string,
  en: string,
  cat: string,
  note?: string,
  createdAt?: number,
  srs?: { ease: number; interval: number; due: number; reps: number; lapses: number }
}} Card */

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

// LocalStorage helpers
const LS_KEY = "croatian-phrase-coach-v1";
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

// Spaced repetition (SM‑2 lite)
function review(card, quality /* 0..5 */) {
  const s = card.srs ?? { ease: 2.5, interval: 1, due: 0, reps: 0, lapses: 0 };
  let { ease, interval, reps, lapses } = s;
  if (quality < 3) {
    reps = 0;
    lapses += 1;
    interval = 1;
  } else {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }
    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ease = clamp(ease, 1.3, 2.8);
    reps += 1;
  }
  const jitter = 0.05 + Math.random() * 0.1; // add 5–15% randomness
  const nextMs = interval * (24 * 60 * 60 * 1000) * (1 + jitter);
  return {
    ...card,
    srs: { ease, interval, reps, lapses, due: now() + nextMs },
  };
}

// Seed data
const SEED = [
  { id: uid(), hr: "Bok!", en: "Hi!", cat: "Greetings" },
  { id: uid(), hr: "Dobar dan", en: "Good day", cat: "Greetings" },
  { id: uid(), hr: "Dobro jutro", en: "Good morning", cat: "Greetings" },
  { id: uid(), hr: "Dobra večer", en: "Good evening", cat: "Greetings" },
  { id: uid(), hr: "Laku noć", en: "Good night", cat: "Greetings" },
  { id: uid(), hr: "Hvala", en: "Thank you", cat: "Politeness" },
  { id: uid(), hr: "Molim", en: "Please/You're welcome", cat: "Politeness" },
  { id: uid(), hr: "Oprostite", en: "Excuse me / Sorry", cat: "Politeness" },
  { id: uid(), hr: "Kako si?", en: "How are you? (informal)", cat: "Greetings" },
  { id: uid(), hr: "Kako ste?", en: "How are you? (formal)", cat: "Greetings" },
  { id: uid(), hr: "Dobro sam", en: "I'm well", cat: "Small Talk" },
  { id: uid(), hr: "Ne razumijem", en: "I don't understand", cat: "Basics" },
  { id: uid(), hr: "Govorite li engleski?", en: "Do you speak English?", cat: "Basics" },
  { id: uid(), hr: "Možete li govoriti sporije?", en: "Can you speak more slowly?", cat: "Basics" },
  { id: uid(), hr: "Kako se zoveš?", en: "What's your name?", cat: "Small Talk" },
  { id: uid(), hr: "Zovem se...", en: "My name is...", cat: "Small Talk" },
  { id: uid(), hr: "Drago mi je", en: "Nice to meet you", cat: "Small Talk" },
  { id: uid(), hr: "Gdje je...", en: "Where is...", cat: "Travel" },
  { id: uid(), hr: "Koliko košta?", en: "How much is it?", cat: "Shopping" },
  { id: uid(), hr: "To je preskupo", en: "That's too expensive", cat: "Shopping" },
  { id: uid(), hr: "Može popust?", en: "Can I get a discount?", cat: "Shopping" },
  { id: uid(), hr: "Račun, molim", en: "The bill, please", cat: "Food & Drink" },
  { id: uid(), hr: "Voda bez plina", en: "Still water", cat: "Food & Drink" },
  { id: uid(), hr: "Voda s plinom", en: "Sparkling water", cat: "Food & Drink" },
  { id: uid(), hr: "Bez mlijeka", en: "Without milk", cat: "Food & Drink" },
  { id: uid(), hr: "Gdje je WC?", en: "Where is the bathroom?", cat: "Travel" },
  { id: uid(), hr: "Ulaznica", en: "Ticket", cat: "Travel" },
  { id: uid(), hr: "Autobus", en: "Bus", cat: "Travel" },
  { id: uid(), hr: "Lijevo / Desno", en: "Left / Right", cat: "Travel" },
  { id: uid(), hr: "Pomoć!", en: "Help!", cat: "Emergency" },
  { id: uid(), hr: "Zovite policiju!", en: "Call the police!", cat: "Emergency" },
  { id: uid(), hr: "Trebam liječnika", en: "I need a doctor", cat: "Emergency" },
  { id: uid(), hr: "Alergična sam na...", en: "I'm allergic to...", cat: "Emergency" },
  { id: uid(), hr: "Jedna karta za...", en: "One ticket to...", cat: "Travel" },
  { id: uid(), hr: "Koliko je sati?", en: "What time is it?", cat: "Basics" },
  { id: uid(), hr: "Može račun?", en: "Can I get the check?", cat: "Food & Drink" },
  { id: uid(), hr: "Gdje je trajekt?", en: "Where is the ferry?", cat: "Travel" },
  { id: uid(), hr: "Plaža", en: "Beach", cat: "Travel" },
  { id: uid(), hr: "Luka", en: "Port/Harbor", cat: "Travel" },
  { id: uid(), hr: "Koliko daleko?", en: "How far?", cat: "Travel" },
];

function useCroatianVoice() {
  const [voices, setVoices] = useState([]);
  const croatian = useMemo(() => {
    return voices.find(v => /hr|croatian/i.test(`${v.lang} ${v.name}`)) || voices[0];
  }, [voices]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices?.() || []);
    load();
    const id = setInterval(load, 500);
    const handler = () => load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handler);
    return () => { clearInterval(id); window.speechSynthesis?.removeEventListener?.("voiceschanged", handler); };
  }, []);

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    if (croatian) u.voice = croatian;
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return { speak, croatian };
}

export default function App() {
  const [cards, setCards] = useState(() => loadState()?.cards ?? seedWithSRS(SEED));
  const [mode, setMode] = useState("flashcards"); // flashcards | manage
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [front, setFront] = useState("hr"); // which side is front
  const [importErr, setImportErr] = useState("");
  const { speak } = useCroatianVoice();

  useEffect(() => saveState({ cards }), [cards]);

  const cats = useMemo(() => ["All", ...Array.from(new Set(cards.map(c => c.cat)))], [cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(c => (cat === "All" || c.cat === cat) && (!q || `${c.hr} ${c.en}`.toLowerCase().includes(q)));
  }, [cards, cat, query]);

  const nextDue = useMemo(() => filtered.find(c => (c.srs?.due ?? 0) <= now()) || filtered[0], [filtered]);


  function seedWithSRS(list) {
    return list.map(c => ({ ...c, createdAt: now(), srs: { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 } }));
  }
  function gradeCard(card, quality) {
    const updated = review(card, quality);
    setCards(prev => prev.map(c => (c.id === card.id ? updated : c)));
  }
  function addCard(newCard) {
    setCards(prev => [{ ...newCard, id: uid(), createdAt: now(), srs: { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 } }, ...prev]);
  }
  function removeCard(id) { setCards(prev => prev.filter(c => c.id !== id)); }
  function swapSides() { setFront(front === "hr" ? "en" : "hr"); }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "croatian-phrases.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function onImportJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format: expected an array");
        const cleaned = imported.map(x => ({
          id: x.id || uid(),
          hr: String(x.hr || "").trim(),
          en: String(x.en || "").trim(),
          cat: String(x.cat || "Custom").trim(),
          note: x.note ? String(x.note) : undefined,
          createdAt: x.createdAt || now(),
          srs: x.srs || { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 },
        })).filter(x => x.hr && x.en);
        if (!cleaned.length) throw new Error("No valid cards found");
        setCards(prev => [...cleaned, ...prev]);
        setImportErr("");
      } catch (err) {
        setImportErr(err.message || "Import failed");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <section className="hero">
        <div className="sun" />
        <svg className="pyramid" viewBox="0 0 160 120">
          <polygon points="80,0 0,120 160,120" />
          <line x1="80" y1="0" x2="80" y2="120" />
          <line x1="0" y1="120" x2="80" y2="60" />
          <line x1="160" y1="120" x2="80" y2="60" />
        </svg>
        <div className="grid" />
        <div className="hero-text">
          <h1>Croatian Phrase Coach 🇭🇷</h1>
          <p>Flashcards • Spaced Repetition • TTS • Offline</p>
        </div>
      </section>

      <div className="max-w-5xl" style={{ margin: '0 auto', padding: '1rem 1.5rem' }}>
        <header className="nav">
          <button onClick={() => setMode("flashcards")} className={btn(mode === "flashcards")}>Flashcards</button>
          <button onClick={() => setMode("manage")} className={btn(mode === "manage")}>Manage</button>
        </header>

        <hr className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Croatian or English" style={inp()} />
          <select value={cat} onChange={e => setCat(e.target.value)} style={inp()}>
            {["All", ...Array.from(new Set(cards.map(c => c.cat)))].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setFront(front === "hr" ? "en" : "hr")} style={buttonBase()}>{front === "hr" ? "Front: HR → EN" : "Front: EN → HR"}</button>
          </div>
        </div>

        <hr className="divider" />

        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>Total: <b style={{ color: 'var(--neon-yellow)' }}>{cards.filter(c => (cat === "All" || c.cat === cat)).length}</b></span>
          <span>Due now: <b style={{ color: 'var(--neon-yellow)' }}>{cards.filter(c => (c.srs?.due ?? 0) <= now()).length}</b></span>
        </div>

        {mode === "flashcards" && (
          <FlashcardStudy
            card={nextDue}
            pool={filtered}
            front={front}
            onGrade={(q) => nextDue && gradeCard(nextDue, q)}
            speak={speak}
          />
        )}

        {mode === "manage" && (
          <Manager
            cards={filtered}
            allCards={cards}
            onDelete={removeCard}
            onAdd={addCard}
            onExport={exportJSON}
            onImport={onImportJSON}
            importErr={importErr}
            speak={speak}
          />
        )}
      </div>
    </div>
  );
}

function FlashcardStudy({ card, pool, front, onGrade, speak }) {
  if (!card) return <EmptyState text="No cards match your filter."/>;
  const prompt = front === "hr" ? card.hr : card.en;
  const choices = useMemo(() => {
    const others = pool.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...others, card].sort(() => Math.random() - 0.5);
  }, [card, pool]);

  function pick(c) {
    speak(c.hr);
    const correct = front === "hr" ? c.en === card.en : c.hr === card.hr;
    onGrade(correct ? 5 : 1);
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--neon-yellow)', cursor: 'pointer' }}
              onClick={() => speak(card.hr)}
            >
              {prompt}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--neon-pink)' }}>{card.cat}</span>
          </div>
        </div>

        {card.note && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--neon-blue)' }}>{card.note}</p>}


        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {choices.map(c => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              style={buttonBase({ textAlign: 'center' })}
            >
              {front === "hr" ? c.en : c.hr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Manager({ cards, allCards, onDelete, onAdd, onExport, onImport, importErr, speak }) {
  const [form, setForm] = useState({ hr: "", en: "", cat: "Custom", note: "" });
  const cats = useMemo(() => Array.from(new Set(allCards.map(c => c.cat))), [allCards]);

  function submit(e) {
    e.preventDefault();
    if (!form.hr.trim() || !form.en.trim()) return;
    onAdd({ ...form });
    setForm({ hr: "", en: "", cat: form.cat, note: "" });
  }

  return (
    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="panel">
        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--neon-pink)' }}>Add a phrase</h3>
        <form onSubmit={submit} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <input style={inp()} placeholder="Croatian (HR)" value={form.hr} onChange={e => setForm({ ...form, hr: e.target.value })} />
          <input style={inp()} placeholder="English (EN)" value={form.en} onChange={e => setForm({ ...form, en: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={inp({ flex: 1 })} placeholder="Category" list="cat-list" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} />
            <datalist id="cat-list">{cats.map(c => <option key={c} value={c} />)}</datalist>
            <input style={inp({ flex: 1 })} placeholder="Note (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className={btn(true)}>Add</button>
            <button type="button" onClick={onExport} className={btn(false)}>Export JSON</button>
            <label style={buttonBase({ cursor: 'pointer' })}>Import JSON
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>
          {importErr && <div style={{ color: 'var(--neon-pink)', fontSize: 14 }}>{importErr}</div>}
        </form>
      </div>

      <div className="panel">
        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--neon-pink)' }}>Your phrases ({cards.length})</h3>
        <ul style={{ marginTop: 12, listStyle: 'none', padding: 0 }}>
          {cards.map(c => (
            <li key={c.id} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid rgba(0,234,255,0.2)' }}>
              <div onClick={() => speak(c.hr)} style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 600 }}>{c.hr} <span style={{ color: 'var(--neon-yellow)' }}>→</span> {c.en}</div>
                <div style={{ fontSize: 12, color: 'var(--neon-blue)' }}>{c.cat} • reps {c.srs?.reps ?? 0} • ease {Number(c.srs?.ease || 2.5).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={buttonBase()} onClick={() => navigator?.clipboard?.writeText(`${c.hr} — ${c.en}`)}>Copy</button>
                <button style={buttonBase()} onClick={() => onDelete(c.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>;
}

// Inline styles/helpers
function btn(active) {
  return `btn${active ? " btn-active" : ""}`;
}
function buttonBase(extra) {
  return { padding: '8px 12px', borderRadius: 10, border: '2px solid var(--neon-blue)', background: 'rgba(0,0,0,0.2)', color: 'var(--neon-blue)', ...extra };
}
function inp(extra) {
  return { padding: '8px 12px', borderRadius: 10, border: '2px solid var(--neon-blue)', background: 'rgba(0,0,0,0.2)', color: 'var(--neon-blue)', ...extra };
}
