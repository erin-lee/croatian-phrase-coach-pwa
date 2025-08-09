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
const LS_KEY = "croatian-phrase-coach-v2";
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
  { id: uid(), hr: "Pramac", en: "Bow", cat: "Sailing" },
  { id: uid(), hr: "Krma", en: "Stern", cat: "Sailing" },
  { id: uid(), hr: "Sidro", en: "Anchor", cat: "Sailing" },
  { id: uid(), hr: "Podigni jedro", en: "Raise the sail", cat: "Sailing" },
  { id: uid(), hr: "Spusti jedro", en: "Lower the sail", cat: "Sailing" },
  { id: uid(), hr: "Zaveži konop", en: "Tie the rope", cat: "Sailing" },
  { id: uid(), hr: "Odveži konop", en: "Untie the rope", cat: "Sailing" },
  { id: uid(), hr: "Upomoć!", en: "Help!", cat: "Sailing" },
  { id: uid(), hr: "Čovjek u moru!", en: "Man overboard!", cat: "Sailing" },
  { id: uid(), hr: "Pozovi obalnu stražu!", en: "Call the coast guard!", cat: "Sailing" },
  { id: uid(), hr: "Treba nam medicinska pomoć.", en: "We need medical assistance.", cat: "Sailing" },
  { id: uid(), hr: "Oluja dolazi.", en: "A storm is coming", cat: "Sailing" },
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
  
  // Initialize state from URL params
  const initializeFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlCategory = params.get('category');
    
    return {
      mode: ['flashcards', 'quiz', 'manage'].includes(urlMode) ? urlMode : 'quiz',
      category: urlCategory || 'All'
    };
  };
  
  const [mode, setMode] = useState(() => initializeFromURL().mode);
  const [quizIdx, setQuizIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(() => initializeFromURL().category);
  const [front, setFront] = useState("hr"); // which side is front
  const [importErr, setImportErr] = useState("");
  const [toast, setToast] = useState(null);
  const { speak } = useCroatianVoice();

  useEffect(() => saveState({ cards }), [cards]);

  // Update URL when mode or category changes
  const updateURL = (newMode = mode, newCategory = cat) => {
    const params = new URLSearchParams();
    if (newMode !== 'quiz') params.set('mode', newMode);
    if (newCategory !== 'All') params.set('category', newCategory);
    
    const newSearch = params.toString();
    const newURL = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
    window.history.replaceState({}, '', newURL);
  };

  // Custom setters that update URL
  const setModeWithURL = (newMode) => {
    setMode(newMode);
    updateURL(newMode, cat);
  };

  const setCategoryWithURL = (newCategory) => {
    setCat(newCategory);
    updateURL(mode, newCategory);
  };

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

  function showToast(message, type = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 2000);
  }

  function resetToSeed() {
    const confirmed = window.confirm(
      'Are you sure you want to reset all phrases to the original seed data? This will delete all your custom phrases and reset all spaced repetition progress. This action cannot be undone.'
    );
    if (confirmed) {
      setCards(seedWithSRS(SEED));
      showToast('Reset to original seed phrases completed!', 'success');
    }
  }

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
          <h1>Bok! Croatian 🇭🇷</h1>
          <p>Learn Croatian Like a Local • Flashcards • Spaced Repetition • TTS</p>
        </div>
      </section>

      <div className="max-w-5xl" style={{ margin: '0 auto', padding: '1rem 1.5rem' }}>
        <header className="nav">
          <button onClick={() => setModeWithURL("flashcards")} className={btn(mode === "flashcards")}>Flashcards</button>
          <button onClick={() => setModeWithURL("quiz")} className={btn(mode === "quiz")}>Quiz</button>
          <button onClick={() => setModeWithURL("manage")} className={btn(mode === "manage")}>Manage</button>
        </header>

        <hr className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Croatian or English" style={inp()} />
          <select value={cat} onChange={e => setCategoryWithURL(e.target.value)} style={inp()}>
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
            pool={filtered}
            front={front}
            onGrade={gradeCard}
            speak={speak}
          />
        )}

        {mode === "quiz" && (
          <Quiz
            pool={filtered}
            idx={quizIdx}
            setIdx={setQuizIdx}
            front={front}
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
            showToast={showToast}
            onResetToSeed={resetToSeed}
          />
        )}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function FlashcardStudy({ pool, front, onGrade, speak }) {
  const [answered, setAnswered] = useState(new Set());
  const [results, setResults] = useState(new Map());
  const [cardChoices, setCardChoices] = useState(new Map());
  
  if (!pool.length) return <EmptyState text="No cards match your filter."/>;

  function generateChoices(targetCard) {
    const others = pool.filter(c => c.id !== targetCard.id).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...others, targetCard].sort(() => Math.random() - 0.5);
  }

  // Generate choices only once when pool changes or for new cards
  useEffect(() => {
    const newChoicesMap = new Map();
    pool.forEach(card => {
      // Keep existing choices if card already has them, otherwise generate new ones
      if (cardChoices.has(card.id)) {
        newChoicesMap.set(card.id, cardChoices.get(card.id));
      } else {
        newChoicesMap.set(card.id, generateChoices(card));
      }
    });
    setCardChoices(newChoicesMap);
  }, [pool.map(c => c.id).join(',')]); // Only regenerate when card IDs change

  function pick(card, selectedChoice) {
    if (answered.has(card.id)) return; // Already answered
    
    speak(selectedChoice.hr);
    const correct = front === "hr" ? selectedChoice.en === card.en : selectedChoice.hr === card.hr;
    
    setAnswered(prev => new Set([...prev, card.id]));
    setResults(prev => new Map([...prev, [card.id, { selectedChoice, correct }]]));
    onGrade(card, correct ? 4 : 1);
  }

  function getButtonStyle(card, choice) {
    const result = results.get(card.id);
    if (!result) return buttonBase({ textAlign: 'center' });
    
    const isSelected = result.selectedChoice.id === choice.id;
    const isCorrect = front === "hr" ? choice.en === card.en : choice.hr === card.hr;
    
    if (isSelected) {
      return {
        ...buttonBase({ textAlign: 'center' }),
        background: result.correct ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
        border: result.correct ? '2px solid #00ff00' : '2px solid #ff0000',
        color: result.correct ? '#00ff00' : '#ff0000'
      };
    } else if (isCorrect && result.selectedChoice.id !== choice.id) {
      // Show correct answer in green if user picked wrong
      return {
        ...buttonBase({ textAlign: 'center' }),
        background: 'rgba(0, 255, 0, 0.1)',
        border: '2px solid rgba(0, 255, 0, 0.5)',
        color: 'rgba(0, 255, 0, 0.8)'
      };
    }
    
    return {
      ...buttonBase({ textAlign: 'center' }),
      opacity: 0.6
    };
  }

  return (
    <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
      {pool.map(card => {
        const prompt = front === "hr" ? card.hr : card.en;
        const choices = cardChoices.get(card.id) || [];
        
        return (
          <div key={card.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'var(--neon-yellow)',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease, text-shadow 0.2s ease',
                    textShadow: '0 0 8px rgba(255, 224, 102, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => speak(card.hr)}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#fff066';
                    e.target.style.textShadow = '0 0 12px rgba(255, 224, 102, 0.8), 0 0 20px rgba(255, 224, 102, 0.4)';
                    const volumeIcon = e.target.querySelector('.volume-icon');
                    if (volumeIcon) volumeIcon.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--neon-yellow)';
                    e.target.style.textShadow = '0 0 8px rgba(255, 224, 102, 0.6)';
                    const volumeIcon = e.target.querySelector('.volume-icon');
                    if (volumeIcon) volumeIcon.style.opacity = '0';
                  }}
                >
                  {prompt}
                  <svg 
                    className="volume-icon"
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      opacity: '0',
                      transition: 'opacity 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon>
                    <path d="M19.07,4.93a10,10 0 0,1 0,14.14M15.54,8.46a5,5 0 0,1 0,7.07"></path>
                  </svg>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--neon-pink)' }}>{card.cat}</span>
              </div>
            </div>

            {card.note && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--neon-blue)' }}>{card.note}</p>}

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => pick(card, choice)}
                  style={getButtonStyle(card, choice)}
                >
                  {front === "hr" ? choice.en : choice.hr}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function Quiz({ pool, idx, setIdx, front, speak }) {
  const [selected, setSelected] = useState(null);
  
  if (!pool.length) return <EmptyState text="No cards to quiz."/>;
  const target = pool[idx % pool.length];
  const prompt = front === "hr" ? target.hr : target.en;

  const opts = useMemo(() => {
    const others = pool.filter(c => c.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...others, target].sort(() => Math.random() - 0.5);
  }, [target, pool]);

  function selectOption(c) {
    setSelected(c);
    speak(c.hr);
  }

  function confirm() {
    if (!selected) return;
    setSelected(null);
    setTimeout(() => setIdx(idx + 1), 300);
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div
          onClick={() => speak(target.hr)}
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--neon-yellow)',
            cursor: 'pointer',
            transition: 'color 0.2s ease, text-shadow 0.2s ease',
            textShadow: '0 0 8px rgba(255, 224, 102, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#fff066';
            e.target.style.textShadow = '0 0 12px rgba(255, 224, 102, 0.8), 0 0 20px rgba(255, 224, 102, 0.4)';
            const volumeIcon = e.target.querySelector('.volume-icon');
            if (volumeIcon) volumeIcon.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'var(--neon-yellow)';
            e.target.style.textShadow = '0 0 8px rgba(255, 224, 102, 0.6)';
            const volumeIcon = e.target.querySelector('.volume-icon');
            if (volumeIcon) volumeIcon.style.opacity = '0';
          }}
        >
          {prompt}
          <svg 
            className="volume-icon"
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{
              opacity: '0',
              transition: 'opacity 0.2s ease',
              flexShrink: 0
            }}
          >
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon>
            <path d="M19.07,4.93a10,10 0 0,1 0,14.14M15.54,8.46a5,5 0 0,1 0,7.07"></path>
          </svg>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {opts.map(c => (
          <button
            key={c.id}
            onClick={() => selectOption(c)}
            style={{
              ...buttonBase({ textAlign: 'center' }),
              ...(selected?.id === c.id ? {
                border: '2px solid var(--neon-pink)',
                background: 'rgba(255, 63, 164, 0.2)',
                color: 'var(--neon-pink)'
              } : {})
            }}
          >
            {front === "hr" ? c.en : c.hr}
          </button>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button 
            onClick={confirm}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, var(--neon-pink), #ff6bc7)',
              color: '#000',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.3px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(255, 63, 164, 0.4), 0 0 30px rgba(255, 63, 164, 0.2), 0 3px 10px rgba(0, 0, 0, 0.2)',
              textTransform: 'uppercase',
              transition: 'transform 0.1s ease, box-shadow 0.2s ease',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 0 20px rgba(255, 63, 164, 0.5), 0 0 35px rgba(255, 63, 164, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 0 15px rgba(255, 63, 164, 0.4), 0 0 30px rgba(255, 63, 164, 0.2), 0 3px 10px rgba(0, 0, 0, 0.2)';
            }}
          >
            Confirm Answer
          </button>
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 14, color: 'var(--neon-pink)' }}>
        Question {(idx % pool.length) + 1} / {pool.length}
      </div>
    </div>
  );
}

function Manager({ cards, allCards, onDelete, onAdd, onExport, onImport, importErr, speak, showToast, onResetToSeed }) {
  const [form, setForm] = useState({ hr: "", en: "", cat: "Custom", note: "" });
  const cats = useMemo(() => Array.from(new Set(allCards.map(c => c.cat))), [allCards]);

  function submit(e) {
    e.preventDefault();
    if (!form.hr.trim() || !form.en.trim()) return;
    onAdd({ ...form });
    setForm({ hr: "", en: "", cat: form.cat, note: "" });
  }

  function handleCopy(text) {
    navigator?.clipboard?.writeText(text).then(() => {
      showToast(`Copied "${text}" to clipboard!`);
    }).catch(() => {
      showToast('Failed to copy text', 'error');
    });
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--neon-pink)', marginBottom: 12 }}>Add a new phrase</h3>
        <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={inp()} placeholder="Croatian (HR)" value={form.hr} onChange={e => setForm({ ...form, hr: e.target.value })} />
            <input style={inp()} placeholder="English (EN)" value={form.en} onChange={e => setForm({ ...form, en: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={inp()} placeholder="Category" list="cat-list" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} />
            <datalist id="cat-list">{cats.map(c => <option key={c} value={c} />)}</datalist>
            <input style={inp()} placeholder="Note (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className={btn(true)}>Add Phrase</button>
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
              <div 
                onClick={() => speak(c.hr)} 
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  const volumeIcon = e.currentTarget.querySelector('.volume-icon');
                  if (volumeIcon) volumeIcon.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const volumeIcon = e.currentTarget.querySelector('.volume-icon');
                  if (volumeIcon) volumeIcon.style.opacity = '0';
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{c.hr} <span style={{ color: 'var(--neon-yellow)' }}>→</span> {c.en}</div>
                  <div style={{ fontSize: 12, color: 'var(--neon-blue)' }}>{c.cat} • reps {c.srs?.reps ?? 0} • ease {Number(c.srs?.ease || 2.5).toFixed(2)}</div>
                </div>
                <svg 
                  className="volume-icon"
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    opacity: '0',
                    transition: 'opacity 0.2s ease',
                    flexShrink: 0,
                    color: 'var(--neon-blue)'
                  }}
                >
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon>
                  <path d="M19.07,4.93a10,10 0 0,1 0,14.14M15.54,8.46a5,5 0 0,1 0,7.07"></path>
                </svg>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={buttonBase()} onClick={() => handleCopy(c.hr)}>Copy</button>
                <button 
                  style={{
                    ...buttonBase(),
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'auto'
                  }} 
                  onClick={() => onDelete(c.id)}
                  title="Delete phrase"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m5,6 1,14c0,1.1 0.9,2 2,2h8c1.1,0 2,-0.9 2,-2l1,-14"></path>
                    <path d="m10,11v6"></path>
                    <path d="m14,11v6"></path>
                    <path d="m9,6V4c0,-1.1 0.9,-2 2,-2h2c1.1,0 2,0.9 2,2v2"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="panel" style={{ marginTop: 16, textAlign: 'center' }}>
        <h4 style={{ fontWeight: 600, fontSize: 16, color: 'var(--neon-blue)', marginBottom: 12 }}>Danger Zone</h4>
        <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16, lineHeight: 1.5 }}>
          Reset all phrases back to the original seed data. This will delete all your custom phrases and reset all spaced repetition progress.
        </p>
        <button 
          onClick={onResetToSeed}
          style={{
            ...buttonBase(),
            border: '2px solid #ff4444',
            color: '#ff4444',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.2)';
            e.target.style.borderColor = '#ff6666';
            e.target.style.color = '#ff6666';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
            e.target.style.borderColor = '#ff4444';
            e.target.style.color = '#ff4444';
          }}
        >
          Reset to Seed Phrases
        </button>
      </div>
    </div>
  );
}

function Toast({ message, type = 'success' }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: 8,
        background: type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
        border: type === 'success' ? '2px solid rgba(0, 255, 0, 0.5)' : '2px solid rgba(255, 0, 0, 0.5)',
        color: type === 'success' ? '#00ff00' : '#ff0000',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        animation: 'fadeInOut 2s ease-in-out',
        maxWidth: '300px',
        wordBreak: 'break-word'
      }}
    >
      {message}
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
  return { padding: '8px 12px', borderRadius: 10, border: '2px solid var(--neon-blue)', background: 'rgba(0,0,0,0.2)', color: 'var(--neon-blue)', cursor: 'pointer', ...extra };
}
function inp(extra) {
  return { padding: '8px 12px', borderRadius: 10, border: '2px solid var(--neon-blue)', background: 'rgba(0,0,0,0.2)', color: 'var(--neon-blue)', ...extra };
}
