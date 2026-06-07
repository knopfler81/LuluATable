/* ============================================================
   script.js — Lulu à Table
   · Hamburger mobile
   · Chargement menu depuis Google Sheets CSV public
   · Tabs Entrées / Plats
   · Scroll reveal
   ============================================================ */

// ── CONFIG ──────────────────────────────────────────────────
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1E99PukGZ1lsFJZOdp22a_oXiutqFUny0Ey2eB_dAn5E/export?format=csv&gid=0';

const MENU_FALLBACK = [
  { categorie: 'Entrées', nom: 'Œuf parfait', description: 'Duxelles de morilles, crème de lard, mouillette briochée', prix: '' },
  { categorie: 'Entrées', nom: 'Ravioles à la truffe', description: 'Crème truffée, pesto de poireaux, copeaux de parmesan', prix: '' },
  { categorie: 'Entrées', nom: "Velouté d'asperge et roquette", description: 'Magret de canard séché, foie gras poêlé', prix: '' },
  { categorie: 'Entrées', nom: 'Tartare de rouget & gambas', description: 'Fraise, avocat, sésame', prix: '' },
  { categorie: 'Entrées', nom: 'Rougail de boudin noir', description: "Homard rôti, crème d'échalote", prix: '' },
  { categorie: 'Plats chauds', nom: "Poulpe confit à l'huile d'olive", description: "Ail et orange, risotto à l'ail", prix: '' },
  { categorie: 'Plats chauds', nom: 'Escarboeuf', description: "Filet de bœuf charolais, fricassé d'escargots, écrasé de pomme de terre aux olives verts", prix: '' },
  { categorie: 'Plats chauds', nom: "Épaule d'agneau confite", description: 'Sauce whisky/miel, écrasé de pomme de terre aux olives noires', prix: '' },
  { categorie: 'Plats chauds', nom: 'Filet mignon basse température', description: 'Bisque de homard et chorizo, écrasé de pommes de terre aux poivrons rouge confit', prix: '' },
  { categorie: 'Plats chauds', nom: 'Mi-cuit de thon', description: "Croûte d'herbes fraîches et umami d'oignons et ail, brunoise de ratatouille, vinaigrette à manger à la Grenade", prix: '' },
];

// ── HAMBURGER ───────────────────────────────────────────────
function initHamburger() {
  const btn     = document.getElementById('hamburger');
  const overlay = document.getElementById('nav-mobile');
  if (!btn || !overlay) return;

  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fermer au clic sur un lien
  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── TABS ────────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}
window.switchTab = switchTab;

// ── PARSING CSV ──────────────────────────────────────────────
function splitCSVLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { cols.push(cur); cur = ''; }
    else { cur += c; }
  }
  cols.push(cur);
  return cols;
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  }).filter(r => r.nom && r.nom.trim());
}

// ── RENDU MENU ───────────────────────────────────────────────
function renderMenu(items) {
  const byCategory = {};
  items.forEach(item => {
    const cat = item.categorie || 'Autres';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  const isEntrees = k => /entr/i.test(k);
  const isPlats   = k => /plat|chaud/i.test(k);
  const keys = Object.keys(byCategory);

  injectItems('menu-entrees', keys.filter(isEntrees), byCategory);
  injectItems('menu-plats',   keys.filter(isPlats),   byCategory);
}

function injectItems(containerId, keys, byCategory) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!keys.length) {
    el.innerHTML = '<p class="menu-loading">Section à venir</p>';
    return;
  }
  el.innerHTML = keys.map(cat => `
    <div class="menu-grid">
      ${byCategory[cat].map(item => `
        <div class="menu-item">
          <div class="menu-nom">${item.nom}</div>
          ${item.description ? `<div class="menu-desc">${item.description}</div>` : ''}
          ${item.prix        ? `<div class="menu-prix">${item.prix} €</div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ── CHARGEMENT SHEET ─────────────────────────────────────────
async function loadMenu() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error('Sheets indisponible');
    const csv = await res.text();
    const items = parseCSV(csv);
    renderMenu(items.length ? items : MENU_FALLBACK);
  } catch (err) {
    console.warn('Google Sheets inaccessible — données intégrées utilisées.', err);
    renderMenu(MENU_FALLBACK);
  }
}

// ── SCROLL REVEAL ────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  loadMenu();
  initReveal();
});
