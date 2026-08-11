import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus, ChevronLeft, ChevronRight, CreditCard, X, Trash2, Wallet, User, LayoutGrid, Pencil, Check,
  TrendingUp, TrendingDown, Calendar, Flame, Star, Search, List, Eye, EyeOff, Target,
} from "lucide-react";

// ---------- design tokens ----------
const THEMES = {
  ledger: {
    name: "Ledger verde", page: "#EDEADD", paper: "#F7F4E9", ink: "#20301F", inkSoft: "#54604C",
    panel: "#22352A", panelSoft: "#2E4436", brass: "#B08D3E", brassSoft: "#D8C078", rust: "#A4472B", line: "#CDC6AC",
  },
  navy: {
    name: "Azul marinho & ouro", page: "#E7EAF1", paper: "#F3F5F9", ink: "#16233F", inkSoft: "#4C5A73",
    panel: "#16233F", panelSoft: "#0A1526", brass: "#B8912E", brassSoft: "#D4AF37", rust: "#B5453A", line: "#C7CEDD",
  },
  bordeaux: {
    name: "Bordô", page: "#F1E7E4", paper: "#FAF3F1", ink: "#3D1F24", inkSoft: "#6B4A4E",
    panel: "#3D1F24", panelSoft: "#552C33", brass: "#C77A6B", brassSoft: "#E3B3A8", rust: "#8E3B2E", line: "#DCC7C2",
  },
  graphite: {
    name: "Grafite & teal", page: "#E9EBEA", paper: "#F5F6F5", ink: "#22292B", inkSoft: "#535C5E",
    panel: "#22292B", panelSoft: "#31393B", brass: "#4FA8A0", brassSoft: "#9ED4CE", rust: "#B5543F", line: "#CBD1D0",
  },
  clay: {
    name: "Terracota", page: "#F3EAE0", paper: "#FAF5EF", ink: "#5A3A2E", inkSoft: "#836357",
    panel: "#5A3A2E", panelSoft: "#734B3B", brass: "#D9895F", brassSoft: "#EDBFA1", rust: "#963B27", line: "#E0CFC2",
  },
  violet: {
    name: "Ardósia & violeta", page: "#ECEAF2", paper: "#F6F5FA", ink: "#2B2740", inkSoft: "#5A5470",
    panel: "#2B2740", panelSoft: "#3C3656", brass: "#8E7CC3", brassSoft: "#C6BAE6", rust: "#A8465A", line: "#D3CFE3",
  },
};
const THEME_IDS = Object.keys(THEMES);
function getTheme(id) { return THEMES[id] || THEMES.ledger; }

const CATEGORY_COLORS = {
  "Alimentação": "#B08D3E",
  "Transporte": "#5C7A5A",
  "Lazer": "#8A5A44",
  "Casa": "#3F6350",
  "Saúde": "#A4472B",
  "Compras": "#7A5C8A",
  "Outros": "#8C8468",
};
const CATEGORY_ESSENTIAL = {
  "Alimentação": true, "Transporte": true, "Lazer": false, "Casa": true,
  "Saúde": true, "Compras": false, "Outros": false,
};
const DEFAULT_CATEGORIES = Object.entries(CATEGORY_COLORS).map(([name, color]) => ({ name, color, essential: CATEGORY_ESSENTIAL[name] ?? true }));
const CATEGORY_PALETTE = ["#B08D3E", "#5C7A5A", "#8A5A44", "#3F6350", "#A4472B", "#7A5C8A", "#8C8468", "#4F7A8A", "#A67C52", "#6B7A3F"];
function nextCategoryColor(existing) {
  return CATEGORY_PALETTE[existing.length % CATEGORY_PALETTE.length];
}
function categoryColor(categories, name) {
  return categories.find((c) => c.name === name)?.color || "#8C8468";
}

const POCKET_PALETTE = ["#B08D3E", "#5B8AC7", "#7A5C8A", "#5C7A5A", "#C77A6B", "#4FA8A0", "#D9895F", "#8E7CC3"];
function nextPocketColor(existing) {
  return POCKET_PALETTE[existing.length % POCKET_PALETTE.length];
}

// Datas comemorativas — não são feriados (não folga), mas importam pro
// bolso porque costumam vir com gasto extra (presentes, jantar etc).
const COMMEMORATIVE_DATES_FIXED = [
  { month: 2, day: 14, name: "Dia dos Namorados (internacional)" },
  { month: 4, day: 23, name: "Dia de São Jorge" },
  { month: 6, day: 12, name: "Dia dos Namorados" },
  { month: 6, day: 24, name: "Dia de São João" },
  { month: 10, day: 12, name: "Dia das Crianças" },
  { month: 10, day: 31, name: "Halloween" },
  { month: 11, day: 15, name: "Black Friday (aprox.)" },
  { month: 12, day: 24, name: "Véspera de Natal" },
  { month: 12, day: 31, name: "Véspera de Ano Novo" },
];

// Retorna a data do 2º domingo de um mês (usado pro Dia das Mães e dos Pais)
function nthSunday(year, month, n) {
  const first = new Date(year, month - 1, 1);
  const firstSunday = 1 + ((7 - first.getDay()) % 7);
  return new Date(year, month - 1, firstSunday + (n - 1) * 7);
}

const HOLIDAYS_FIXED = [
  { month: 1, day: 1, name: "Ano Novo" },
  { month: 4, day: 21, name: "Tiradentes" },
  { month: 5, day: 1, name: "Dia do Trabalho" },
  { month: 9, day: 7, name: "Independência do Brasil" },
  { month: 10, day: 12, name: "Nossa Senhora Aparecida" },
  { month: 11, day: 2, name: "Finados" },
  { month: 11, day: 15, name: "Proclamação da República" },
  { month: 11, day: 20, name: "Consciência Negra" },
  { month: 12, day: 25, name: "Natal" },
];

function getEasterDate(year) {
  // Meeus/Jones/Butcher algorithm
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getHolidaysForYear(year) {
  const fixed = HOLIDAYS_FIXED.map((h) => ({ date: new Date(year, h.month - 1, h.day), name: h.name, kind: "feriado" }));
  const easter = getEasterDate(year);
  const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  const movable = [
    { date: addDays(easter, -2), name: "Sexta-feira Santa", kind: "feriado" },
  ];
  const commemorative = [
    ...COMMEMORATIVE_DATES_FIXED.map((h) => ({ date: new Date(year, h.month - 1, h.day), name: h.name, kind: "data" })),
    { date: nthSunday(year, 5, 2), name: "Dia das Mães", kind: "data" },
    { date: nthSunday(year, 8, 2), name: "Dia dos Pais", kind: "data" },
  ];
  return [...fixed, ...movable, ...commemorative].sort((a, b) => a.date - b.date);
}

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const fontFace = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    .font-display { font-family: 'Fraunces', serif; }
    .font-body { font-family: 'IBM Plex Sans', sans-serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; }
  `}</style>
);

const CURRENCIES = {
  BRL: { symbol: "R$", locale: "pt-BR", label: "Real (R$)" },
  USD: { symbol: "US$", locale: "en-US", label: "Dólar (US$)" },
  EUR: { symbol: "€", locale: "de-DE", label: "Euro (€)" },
  GBP: { symbol: "£", locale: "en-GB", label: "Libra (£)" },
};
const CURRENCY_CODES = Object.keys(CURRENCIES);

const PAYMENT_METHODS = ["Cartão de crédito", "Pix", "Dinheiro", "Débito", "Boleto"];

function money(n, code = "BRL") {
  const c = CURRENCIES[code] || CURRENCIES.BRL;
  return (n || 0).toLocaleString(c.locale, { style: "currency", currency: code });
}

function monthKey(y, m) { return `${y}-${String(m + 1).padStart(2, "0")}`; }

// Returns YYYY-MM-DD using the date's LOCAL calendar day, unlike
// Date.prototype.toISOString() which converts to UTC first and can shift
// the date by a day depending on the user's timezone (e.g. late evening in
// Brazil, UTC-3, would already be "tomorrow" in UTC).
function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Given a calendar year/month being viewed and a card's closing day, returns
// the [start, end] dates (as YYYY-MM-DD strings) of that card's billing
// cycle for that month. Example: closingDay=3 → cycle runs from the 4th of
// the previous month through the 3rd of this month.
function getCycleBounds(year, month, closingDay) {
  const end = new Date(year, month, closingDay);
  const start = new Date(year, month - 1, closingDay + 1);
  const toISO = (d) => toLocalISO(d);
  return { start: toISO(start), end: toISO(end) };
}

// Given a real date and a card's closing day, returns the {year, month}
// (calendar-month index) whose billing cycle currently contains that date.
// If today is past the closing day, the current cycle is "next month".
function getCycleMonthForDate(date, closingDay) {
  let year = date.getFullYear();
  let month = date.getMonth();
  if (date.getDate() > closingDay) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return { year, month };
}

const DEFAULT_PROFILE = { name: "Minha conta", theme: "navy", primaryPocketId: null, investmentGoal: 0, createdAt: toLocalISO(new Date()) };

// ---------- storage helpers ----------
async function loadData() {
  const result = { pockets: [], transactions: [], profile: DEFAULT_PROFILE, categories: DEFAULT_CATEGORIES, bills: [] };
  try {
    const p = await window.storage.get("finances:pockets");
    if (p && p.value) result.pockets = JSON.parse(p.value);
  } catch (e) { /* no data yet */ }
  try {
    const t = await window.storage.get("finances:transactions");
    if (t && t.value) result.transactions = JSON.parse(t.value);
  } catch (e) { /* no data yet */ }
  try {
    const pr = await window.storage.get("finances:profile");
    if (pr && pr.value) result.profile = { ...DEFAULT_PROFILE, ...JSON.parse(pr.value) };
  } catch (e) { /* no data yet */ }
  try {
    const c = await window.storage.get("finances:categories");
    if (c && c.value) result.categories = JSON.parse(c.value);
  } catch (e) { /* no data yet */ }
  try {
    const b = await window.storage.get("finances:bills");
    if (b && b.value) result.bills = JSON.parse(b.value);
  } catch (e) { /* no data yet */ }
  return result;
}
async function savePockets(pockets) {
  try { await window.storage.set("finances:pockets", JSON.stringify(pockets)); }
  catch (e) { console.error("Erro ao salvar bolsos", e); }
}
async function saveTransactions(transactions) {
  try { await window.storage.set("finances:transactions", JSON.stringify(transactions)); }
  catch (e) { console.error("Erro ao salvar transações", e); }
}
async function saveProfile(profile) {
  try { await window.storage.set("finances:profile", JSON.stringify(profile)); }
  catch (e) { console.error("Erro ao salvar perfil", e); }
}
async function saveCategories(categories) {
  try { await window.storage.set("finances:categories", JSON.stringify(categories)); }
  catch (e) { console.error("Erro ao salvar categorias", e); }
}
async function saveBills(bills) {
  try { await window.storage.set("finances:bills", JSON.stringify(bills)); }
  catch (e) { console.error("Erro ao salvar contas", e); }
}

// ---------- main app ----------
export default function FinancesApp() {
  const [loading, setLoading] = useState(true);
  const [pockets, setPockets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const primaryPocketId = profile.primaryPocketId;
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [bills, setBills] = useState([]);
  const [showAddBill, setShowAddBill] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [view, setView] = useState("dashboard"); // "dashboard" | "profile"
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showAddTx, setShowAddTx] = useState(false);
  const [quickAddType, setQuickAddType] = useState(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [txConfig, setTxConfig] = useState({ allowedTypes: null, lockPaymentMethod: false });
  const [fabOpen, setFabOpen] = useState(false);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [quotes, setQuotes] = useState({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [extraQuoteCodes, setExtraQuoteCodes] = useState([]);

  const fetchQuotes = useCallback((codes) => {
    if (codes.length === 0) return;
    setQuotesLoading(true);
    setQuotesError("");
    const pairs = codes.map((c) => `${c}-BRL`).join(",");
    fetch(`https://economia.awesomeapi.com.br/json/last/${pairs}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) throw new Error(data.message);
        setQuotes((prev) => ({ ...prev, ...data }));
      })
      .catch(() => setQuotesError("Não consegui buscar as cotações agora. Tenta de novo."))
      .finally(() => setQuotesLoading(false));
  }, []);

  useEffect(() => {
    fetchQuotes(["USD", "EUR", "BTC"]);
  }, [fetchQuotes]);

  function searchQuote() {
    const code = quoteSearch.trim().toUpperCase();
    if (!code) return;
    fetchQuotes([code]);
    setExtraQuoteCodes((prev) => (prev.includes(code) ? prev : [...prev, code]));
    setQuoteSearch("");
  }

  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "expense" | "income" | "investment"
  const [showAddPocket, setShowAddPocket] = useState(false);
  const [editingPocket, setEditingPocket] = useState(null);
  const [activePocketId, setActivePocketId] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPockets, setSelectedPockets] = useState([]);
  const [valuesHidden, setValuesHidden] = useState(false);
  const [weekAnchorISO, setWeekAnchorISO] = useState(() => toLocalISO(new Date()));
  const [selectedDayISO, setSelectedDayISO] = useState(() => toLocalISO(new Date()));
  const [holidayIndex, setHolidayIndex] = useState(0);

  const holidaysThisMonth = useMemo(() => {
    const realToday = new Date();
    const holidays = getHolidaysForYear(realToday.getFullYear());
    return holidays.filter((h) => h.date.getMonth() === realToday.getMonth());
  }, []);

  const nextHoliday = useMemo(() => {
    const realToday = new Date();
    const todayStart = new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate());
    const candidates = [
      ...getHolidaysForYear(realToday.getFullYear()),
      ...getHolidaysForYear(realToday.getFullYear() + 1),
    ];
    return candidates.find((h) => h.date >= todayStart) || null;
  }, []);

  useEffect(() => {
    if (holidaysThisMonth.length <= 1) return;
    const id = setInterval(() => {
      setHolidayIndex((i) => (i + 1) % holidaysThisMonth.length);
    }, 6000);
    return () => clearInterval(id);
  }, [holidaysThisMonth.length]);
  const COLORS = useMemo(() => getTheme(profile.theme), [profile.theme]);
  const perforatedStyle = {
    backgroundImage: `radial-gradient(circle, ${COLORS.page} 2px, transparent 2.5px)`,
    backgroundSize: "14px 14px",
    backgroundPosition: "0 0",
  };

  useEffect(() => {
    loadData().then(({ pockets, transactions, profile, categories, bills }) => {
      setPockets(pockets);
      setTransactions(transactions);
      setProfile(profile);
      setCategories(categories);
      setBills(bills);
      if (pockets.length && !activePocketId) setActivePocketId(pockets[0].id);
      setLoading(false);
    });
  }, []);

  const currentKey = monthKey(year, month);
  const primaryPocket = pockets.find((p) => p.id === primaryPocketId) || null;
  const activeCycle = primaryPocket?.closingDay
    ? getCycleBounds(year, month, primaryPocket.closingDay)
    : null;

  const isCurrentMonth = activeCycle
    ? (toLocalISO(today) >= activeCycle.start && toLocalISO(today) <= activeCycle.end)
    : (month === today.getMonth() && year === today.getFullYear());

  useEffect(() => {
    if (loading || !primaryPocket?.closingDay) return;
    const todayISO = toLocalISO(today);
    const cycle = getCycleBounds(year, month, primaryPocket.closingDay);
    if (todayISO < cycle.start || todayISO > cycle.end) {
      const { year: cy, month: cm } = getCycleMonthForDate(today, primaryPocket.closingDay);
      setYear(cy);
      setMonth(cm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryPocketId, primaryPocket?.closingDay, loading]);

  const monthTx = useMemo(() => {
    if (activeCycle) {
      return transactions.filter((t) => t.date >= activeCycle.start && t.date <= activeCycle.end);
    }
    return transactions.filter((t) => t.date.slice(0, 7) === currentKey);
  }, [transactions, currentKey, activeCycle]);

  const totalsByCurrency = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => {
      if (t.type === "income" || t.type === "investment") return;
      const c = t.currency || "BRL";
      map[c] = (map[c] || 0) + Number(t.amount);
    });
    return map;
  }, [monthTx]);

  const incomeByCurrency = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => {
      if (t.type !== "income") return;
      const c = t.currency || "BRL";
      map[c] = (map[c] || 0) + Number(t.amount);
    });
    return map;
  }, [monthTx]);

  const currenciesInUse = useMemo(() => {
    const set = new Set(pockets.map((p) => p.currency || "BRL"));
    Object.keys(totalsByCurrency).forEach((c) => set.add(c));
    return Array.from(set);
  }, [pockets, totalsByCurrency]);

  const pocketFilteredMonthTx = useMemo(() => {
    if (selectedPockets.length === 0) return monthTx;
    return monthTx.filter((t) => selectedPockets.includes(t.pocketId));
  }, [monthTx, selectedPockets]);

  const byCategoryByCurrency = useMemo(() => {
    const map = {};
    pocketFilteredMonthTx.forEach((t) => {
      if (t.type === "income" || t.type === "investment") return;
      const c = t.currency || "BRL";
      if (!map[c]) map[c] = {};
      map[c][t.category] = (map[c][t.category] || 0) + Number(t.amount);
    });
    const result = {};
    Object.entries(map).forEach(([c, cats]) => {
      result[c] = Object.entries(cats).map(([name, value]) => ({ name, value }));
    });
    return result;
  }, [pocketFilteredMonthTx]);

  function spentForPocket(pocketId) {
    const pocket = pockets.find((p) => p.id === pocketId);
    if (pocket && pocket.closingDay) {
      const { start, end } = getCycleBounds(year, month, pocket.closingDay);
      return transactions
        .filter((t) => t.pocketId === pocketId && t.type !== "income" && t.type !== "investment" && t.date >= start && t.date <= end)
        .reduce((s, t) => s + Number(t.amount), 0);
    }
    return monthTx.filter((t) => t.pocketId === pocketId && t.type !== "income" && t.type !== "investment")
      .reduce((s, t) => s + Number(t.amount), 0);
  }

  const primaryCurrency = Object.keys(totalsByCurrency)[0] || (pockets[0]?.currency) || "BRL";

  const essentialBreakdown = useMemo(() => {
    let essential = 0, superfluous = 0;
    monthTx.forEach((t) => {
      if (t.type === "income" || t.type === "investment") return;
      if ((t.currency || "BRL") !== primaryCurrency) return;
      const cat = categories.find((c) => c.name === t.category);
      const isEssential = cat ? cat.essential !== false : true;
      if (isEssential) essential += Number(t.amount);
      else superfluous += Number(t.amount);
    });
    const total = essential + superfluous;
    return { essential, superfluous, total, essentialPct: total > 0 ? (essential / total) * 100 : 0 };
  }, [monthTx, categories, primaryCurrency]);

  const totalLimit = primaryPocket
    ? Number(primaryPocket.limit || 0)
    : pockets.filter((p) => (p.currency || "BRL") === primaryCurrency).reduce((s, p) => s + Number(p.limit || 0), 0);
  const totalSpentPrimary = primaryPocket
    ? spentForPocket(primaryPocket.id)
    : (totalsByCurrency[primaryCurrency] || 0);
  const overallPct = totalLimit > 0 ? Math.min(100, (totalSpentPrimary / totalLimit) * 100) : null;
  const overallRemaining = totalLimit - totalSpentPrimary;
  const overallCurrency = primaryPocket ? (primaryPocket.currency || "BRL") : primaryCurrency;

  const totalIncomePrimary = incomeByCurrency[primaryCurrency] || 0;
  const profitPrimary = totalIncomePrimary - (totalsByCurrency[primaryCurrency] || 0);
  const hasIncomeThisPeriod = Object.keys(incomeByCurrency).length > 0;

  const investedThisPeriod = monthTx
    .filter((t) => t.type === "investment" && (t.currency || "BRL") === primaryCurrency)
    .reduce((s, t) => s + Number(t.amount), 0);
  const investedAllTime = transactions
    .filter((t) => t.type === "investment" && (t.currency || "BRL") === primaryCurrency)
    .reduce((s, t) => s + Number(t.amount), 0);

  const investedLastMonth = (() => {
    let pm = month - 1, py = year;
    if (pm < 0) { pm = 11; py -= 1; }
    const pKey = monthKey(py, pm);
    return transactions
      .filter((t) => t.type === "investment" && t.date.slice(0, 7) === pKey && (t.currency || "BRL") === primaryCurrency)
      .reduce((s, t) => s + Number(t.amount), 0);
  })();
  const investmentTrend = investedLastMonth > 0
    ? Math.round(((investedThisPeriod - investedLastMonth) / investedLastMonth) * 100)
    : null;

  const recentInvestments = transactions
    .filter((t) => t.type === "investment")
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const filteredMonthTx = useMemo(() => {
    if (selectedCategories.length === 0) return pocketFilteredMonthTx;
    return pocketFilteredMonthTx.filter((t) => selectedCategories.includes(t.category));
  }, [pocketFilteredMonthTx, selectedCategories]);

  const totalOut = filteredMonthTx
    .filter((t) => t.type === "expense" && t.paymentMethod && t.paymentMethod !== "Cartão de crédito")
    .filter((t) => (t.currency || "BRL") === primaryCurrency)
    .reduce((s, t) => s + Number(t.amount), 0);

  function togglePocketFilter(id) {
    setSelectedPockets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
  const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const weekChart = useMemo(() => {
    const anchor = new Date(weekAnchorISO + "T00:00:00");
    const dow = anchor.getDay();
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - dow);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      const iso = toLocalISO(d);
      const total = transactions
        .filter((t) => t.date === iso && t.type !== "income" && t.type !== "investment" && (t.currency || "BRL") === primaryCurrency)
        .reduce((s, t) => s + Number(t.amount), 0);
      days.push({ label: WEEKDAY_LABELS[i], dayNum: d.getDate(), date: iso, total });
    }
    const weekTotal = days.reduce((s, d) => s + d.total, 0);
    return { days, weekTotal };
  }, [transactions, weekAnchorISO, primaryCurrency]);

  const todayISO = toLocalISO(today);

  function goToDate(iso) {
    setSelectedDayISO(iso);
    setWeekAnchorISO(iso);
    const d = new Date(iso + "T00:00:00");
    if (primaryPocket?.closingDay) {
      const { year: cy, month: cm } = getCycleMonthForDate(d, primaryPocket.closingDay);
      setYear(cy);
      setMonth(cm);
    } else {
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }

  function shiftWeek(delta) {
    const selD = new Date(selectedDayISO + "T00:00:00");
    selD.setDate(selD.getDate() + delta * 7);
    goToDate(toLocalISO(selD));
  }

  const selectedDayLabel = (() => {
    const sel = new Date(selectedDayISO + "T00:00:00");
    const diffDays = Math.round((sel - new Date(todayISO + "T00:00:00")) / 86400000);
    const dateStr = sel.toLocaleDateString("pt-BR");
    if (diffDays === 0) return `hoje: ${dateStr}`;
    if (diffDays === -1) return `ontem: ${dateStr}`;
    if (diffDays === 1) return `amanhã: ${dateStr}`;
    return `${WEEKDAY_NAMES[sel.getDay()]}: ${dateStr}`;
  })();

  const daysLeftInMonth = useMemo(() => {
    const todayISO = toLocalISO(today);
    if (activeCycle) {
      if (todayISO < activeCycle.start || todayISO > activeCycle.end) return null;
      const [ey, em, ed] = activeCycle.end.split("-").map(Number);
      const endDate = new Date(ey, em - 1, ed);
      return Math.round((endDate - new Date(todayISO)) / 86400000);
    }
    if (!isCurrentMonth) return null;
    const lastDay = new Date(year, month + 1, 0).getDate();
    return lastDay - today.getDate();
  }, [isCurrentMonth, year, month, activeCycle]);

  const biggestExpense = useMemo(() => {
    const expenses = monthTx.filter((t) => t.type !== "income" && t.type !== "investment");
    if (expenses.length === 0) return null;
    return expenses.reduce((max, t) => (Number(t.amount) > Number(max.amount) ? t : max), expenses[0]);
  }, [monthTx]);

  const monthTrend = useMemo(() => {
    let pm = month - 1, py = year;
    if (pm < 0) { pm = 11; py -= 1; }
    const pKey = monthKey(py, pm);
    const prevTotal = transactions
      .filter((t) => t.date.slice(0, 7) === pKey && t.type !== "income" && t.type !== "investment" && (t.currency || "BRL") === primaryCurrency)
      .reduce((s, t) => s + Number(t.amount), 0);
    const curTotal = totalsByCurrency[primaryCurrency] || 0;
    if (prevTotal === 0) return null;
    const pct = Math.round(((curTotal - prevTotal) / prevTotal) * 100);
    return pct;
  }, [transactions, month, year, primaryCurrency, totalsByCurrency]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function shiftMonth(delta) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  }

  function goToToday() {
    const todayISOStr = toLocalISO(today);
    setSelectedDayISO(todayISOStr);
    setWeekAnchorISO(todayISOStr);
    if (primaryPocket?.closingDay) {
      const { year: cy, month: cm } = getCycleMonthForDate(today, primaryPocket.closingDay);
      setYear(cy);
      setMonth(cm);
    } else {
      setMonth(today.getMonth());
      setYear(today.getFullYear());
    }
    setShowMonthPicker(false);
  }

  function updateProfile(patch) {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
  }

  function setPrimaryPocket(id) {
    updateProfile({ primaryPocketId: id });
  }

  function addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed || categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    const next = [...categories, { name: trimmed, color: nextCategoryColor(categories), essential: true }];
    setCategories(next);
    saveCategories(next);
  }

  function deleteCategory(name) {
    const next = categories.filter((c) => c.name !== name);
    setCategories(next);
    saveCategories(next);
    setSelectedCategories((prev) => prev.filter((c) => c !== name));
  }

  function toggleCategoryEssential(name) {
    const next = categories.map((c) => (c.name === name ? { ...c, essential: !c.essential } : c));
    setCategories(next);
    saveCategories(next);
  }

  function addBill(bill) {
    const next = [...bills, bill];
    setBills(next);
    saveBills(next);
  }

  function updateBill(id, patch) {
    const next = bills.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBills(next);
    saveBills(next);
  }

  function deleteBill(id) {
    const next = bills.filter((b) => b.id !== id);
    setBills(next);
    saveBills(next);
  }

  function toggleBillPaid(id, monthKeyStr) {
    const next = bills.map((b) => {
      if (b.id !== id) return b;
      const paidMonths = b.paidMonths || [];
      const isPaid = paidMonths.includes(monthKeyStr);
      return { ...b, paidMonths: isPaid ? paidMonths.filter((m) => m !== monthKeyStr) : [...paidMonths, monthKeyStr] };
    });
    setBills(next);
    saveBills(next);
  }

  function clearAllData() {
    setPockets([]);
    setTransactions([]);
    savePockets([]);
    saveTransactions([]);
    setActivePocketId(null);
  }

  function exportData() {
    const backup = {
      exportedAt: new Date().toISOString(),
      app: "Finances",
      version: 1,
      pockets,
      transactions,
      categories,
      bills,
      profile,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = toLocalISO(new Date());
    a.href = url;
    a.download = `finances-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(file, onDone) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== "object" || data.app !== "Finances") {
          onDone({ ok: false, message: "Esse arquivo não parece ser um backup do Finances." });
          return;
        }
        const nextPockets = Array.isArray(data.pockets) ? data.pockets : [];
        const nextTransactions = Array.isArray(data.transactions) ? data.transactions : [];
        const nextCategories = Array.isArray(data.categories) && data.categories.length ? data.categories : DEFAULT_CATEGORIES;
        const nextBills = Array.isArray(data.bills) ? data.bills : [];
        const nextProfile = data.profile && typeof data.profile === "object" ? { ...DEFAULT_PROFILE, ...data.profile } : DEFAULT_PROFILE;

        setPockets(nextPockets);
        setTransactions(nextTransactions);
        setCategories(nextCategories);
        setBills(nextBills);
        setProfile(nextProfile);
        savePockets(nextPockets);
        saveTransactions(nextTransactions);
        saveCategories(nextCategories);
        saveBills(nextBills);
        saveProfile(nextProfile);
        setActivePocketId(nextPockets[0]?.id || null);

        onDone({ ok: true, message: `Backup restaurado: ${nextTransactions.length} lançamentos, ${nextPockets.length} bolsos.` });
      } catch (err) {
        onDone({ ok: false, message: "Não consegui ler esse arquivo. Confere se é o .json certo." });
      }
    };
    reader.readAsText(file);
  }

  function addPocket(pocket) {
    const withColor = { ...pocket, color: pocket.color || nextPocketColor(pockets) };
    const next = [...pockets, withColor];
    setPockets(next);
    savePockets(next);
    if (!activePocketId) setActivePocketId(withColor.id);
    if (!primaryPocketId) setPrimaryPocket(withColor.id);
  }

  function updatePocket(id, patch) {
    const next = pockets.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setPockets(next);
    savePockets(next);
  }

  function deletePocket(id) {
    const next = pockets.filter((p) => p.id !== id);
    setPockets(next);
    savePockets(next);
    const nextTx = transactions.filter((t) => t.pocketId !== id);
    setTransactions(nextTx);
    saveTransactions(nextTx);
    if (activePocketId === id) setActivePocketId(next[0]?.id || null);
  }

  function addTransaction(txOrList) {
    const list = Array.isArray(txOrList) ? txOrList : [txOrList];
    const next = [...transactions, ...list];
    setTransactions(next);
    saveTransactions(next);
  }

  function deleteTransaction(id) {
    const next = transactions.filter((t) => t.id !== id);
    setTransactions(next);
    saveTransactions(next);
  }

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center" style={{ background: COLORS.page }}>
        <p className="font-body text-sm" style={{ color: COLORS.inkSoft }}>Abrindo seu razão financeiro…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-body relative overflow-hidden" style={{ background: COLORS.page, color: COLORS.ink }}>
      {fontFace}

      {/* ambient background blobs */}
      <div className="fixed pointer-events-none" style={{ width: 260, height: 260, borderRadius: "50%", top: -60, right: -60, background: COLORS.panel, filter: "blur(70px)", opacity: 0.35 }} />
      <div className="fixed pointer-events-none" style={{ width: 220, height: 220, borderRadius: "50%", top: "35%", left: -80, background: COLORS.brassSoft, filter: "blur(80px)", opacity: 0.25 }} />
      <div className="fixed pointer-events-none" style={{ width: 240, height: 240, borderRadius: "50%", bottom: -80, right: "15%", background: COLORS.panelSoft, filter: "blur(75px)", opacity: 0.3 }} />

      {/* header */}
      <div
        className={`px-5 pt-5 relative ${view === "profile" ? "pb-3" : "pb-6"}`}
        style={{ background: `radial-gradient(circle at 20% 20%, ${COLORS.panel}, ${COLORS.panelSoft} 65%)` }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="font-display text-xl tracking-tight leading-tight" style={{ color: COLORS.paper }}>Finances</p>
            <button
              onClick={() => setView(view === "profile" ? "dashboard" : "profile")}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display text-sm"
              style={{ background: COLORS.brass, color: COLORS.paper }}
            >
              {profile.name.trim().charAt(0).toUpperCase() || "?"}
            </button>
          </div>
          {view === "profile" && (
            <p className="text-xs" style={{ color: `${COLORS.paper}80` }}>conta, tema e preferências</p>
          )}

          <p key={holidayIndex} className="text-[10px] mb-2 truncate" style={{ color: `${COLORS.paper}55` }}>
            {holidaysThisMonth.length > 0
              ? (() => {
                  const h = holidaysThisMonth[holidayIndex % holidaysThisMonth.length];
                  return `${h.date.getDate()} — ${h.name} (${h.kind === "feriado" ? "feriado" : "data comemorativa"})`;
                })()
              : nextHoliday
                ? `próximo: ${nextHoliday.date.getDate()}/${String(nextHoliday.date.getMonth() + 1).padStart(2, "0")} — ${nextHoliday.name}`
                : ""}
          </p>

          {view === "dashboard" && (
          <div className="relative mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={goToToday} className="flex items-center gap-1.5" aria-label="Ir pra hoje">
                  <Calendar size={12} color={COLORS.brassSoft} />
                  <span className="font-mono text-xs" style={{ color: COLORS.brassSoft }}>
                    {selectedDayLabel}
                  </span>
                </button>
                {selectedDayISO !== todayISO && (
                  <button onClick={goToToday}
                    className="text-[10px] font-medium rounded-full px-2 py-0.5"
                    style={{ background: COLORS.brass, color: COLORS.paper }}>
                    atual
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowMonthPicker((v) => !v)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
                aria-label="Buscar outro mês"
              >
                <Search size={13} color={COLORS.paper} />
              </button>
            </div>

            {showMonthPicker && (
              <div
                className="absolute left-0 right-0 mt-2 rounded-2xl p-4 z-20 shadow-lg"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: `1px solid ${COLORS.brassSoft}55` }}
              >
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <p className="text-[10px] mb-1" style={{ color: `${COLORS.paper}80` }}>mês</p>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      style={{ ...getInputStyle(COLORS), padding: "0.5rem 0.6rem", fontSize: "0.85rem", width: "100%" }}
                    >
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: `${COLORS.paper}80` }}>ano</p>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      style={{ ...getInputStyle(COLORS), padding: "0.5rem 0.6rem", fontSize: "0.85rem", width: 90 }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="w-full rounded-full py-2 text-xs font-medium"
                  style={{ background: COLORS.brass, color: COLORS.paper }}
                >
                  Ver este mês
                </button>
              </div>
            )}
          </div>
          )}
        </div>

      </div>

      {view === "dashboard" && (
      <div className="max-w-4xl mx-auto px-5 pb-24">

        {/* total + trend + average + days left + week dots, all in one card */}
        <div className="rounded-2xl p-4 mt-2 mb-3" style={{ background: `linear-gradient(135deg, ${COLORS.panel}, ${COLORS.panelSoft})` }}>
          {daysLeftInMonth !== null && (
            <div className="flex items-center gap-1.5 mb-3 rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Calendar size={12} color={COLORS.brassSoft} />
              <p className="font-mono text-[10px]" style={{ color: `${COLORS.paper}D0` }}>
                {activeCycle
                  ? `faltam ${daysLeftInMonth} ${daysLeftInMonth === 1 ? "dia" : "dias"} pra fatura do ${primaryPocket.name} fechar`
                  : `faltam ${daysLeftInMonth} ${daysLeftInMonth === 1 ? "dia" : "dias"} pro fim do mês`}
              </p>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px]" style={{ color: `${COLORS.paper}80` }}>total do mês</p>
              <p className="font-display text-2xl mt-0.5" style={{ color: COLORS.paper }}>
                {valuesHidden ? "••••••" : money(totalsByCurrency[primaryCurrency] || 0, primaryCurrency)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <p className="text-[10px]" style={{ color: `${COLORS.paper}80` }}>média/dia</p>
                {monthTrend !== null && (
                  monthTrend <= 0
                    ? <TrendingDown size={12} color="#8FBF8A" />
                    : <TrendingUp size={12} color={COLORS.brassSoft} />
                )}
              </div>
              <p className="font-mono text-sm mt-0.5" style={{ color: COLORS.paper }}>
                {valuesHidden ? "••••" : money((totalsByCurrency[primaryCurrency] || 0) / today.getDate(), primaryCurrency)}
              </p>
            </div>
          </div>

          {hasIncomeThisPeriod && (
            <div className="flex items-center justify-between mt-2.5 rounded-lg px-2.5 py-2" style={{ background: "rgba(92,122,90,0.18)" }}>
              <p className="text-[10px]" style={{ color: "#A8D2A4" }}>
                receitas: <span className="font-mono">{valuesHidden ? "••••" : money(totalIncomePrimary, primaryCurrency)}</span>
              </p>
              <p className="text-[10px] font-mono" style={{ color: profitPrimary >= 0 ? "#A8D2A4" : COLORS.rust }}>
                lucro: {valuesHidden ? "••••" : money(profitPrimary, primaryCurrency)}
              </p>
            </div>
          )}

          {overallPct !== null && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <p className="text-[10px]" style={{ color: `${COLORS.paper}90` }}>
                  você já gastou <span className="font-mono" style={{ color: COLORS.brassSoft }}>{Math.round(overallPct)}%</span> do seu limite
                  {primaryPocket ? ` de ${valuesHidden ? "••••" : money(totalLimit, overallCurrency)} (${primaryPocket.name})` : ""}
                </p>
                <p className="font-mono text-[10px]" style={{ color: `${COLORS.paper}90` }}>
                  {valuesHidden ? "••••" : (overallRemaining >= 0 ? `faltam ${money(overallRemaining, overallCurrency)}` : `estourou ${money(Math.abs(overallRemaining), overallCurrency)}`)}
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: overallRemaining < 0 ? COLORS.rust : (primaryPocket?.color || COLORS.brass) }} />
              </div>
            </div>
          )}

          {activeCycle && (() => {
            const startD = new Date(activeCycle.start);
            const endD = new Date(activeCycle.end);
            const totalDays = Math.round((endD - startD) / 86400000) + 1;
            const elapsed = Math.min(totalDays, Math.max(0, Math.round((today - startD) / 86400000) + 1));
            const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
            return (
              <div className="mt-3">
                <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primaryPocket.color || COLORS.brassSoft }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[9px]" style={{ color: `${COLORS.paper}70` }}>
                    {activeCycle.start.split("-").reverse().join("/")}
                  </span>
                  <span className="text-[9px]" style={{ color: `${COLORS.paper}70` }}>
                    ciclo do {primaryPocket.name}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: `${COLORS.paper}70` }}>
                    {activeCycle.end.split("-").reverse().join("/")}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-1 mt-3">
            <button onClick={() => shiftWeek(-1)} aria-label="Semana anterior" className="p-1 flex-shrink-0">
              <ChevronLeft size={14} color={`${COLORS.paper}80`} />
            </button>
            <div className="flex-1 flex justify-between items-center">
              {weekChart.days.map((d, i) => {
                const isSelected = d.date === selectedDayISO;
                const isToday = d.date === todayISO;
                return (
                  <button key={i} onClick={() => goToDate(d.date)} className="flex flex-col items-center gap-1 py-1">
                    <span className="font-mono text-[8px]" style={{ color: `${COLORS.paper}55` }}>{d.label}</span>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] transition-all"
                      style={{
                        background: isSelected ? (primaryPocket?.color || COLORS.brass) : (isToday ? "rgba(255,255,255,0.15)" : "transparent"),
                        color: isSelected ? "#fff" : COLORS.paper,
                        border: isToday && !isSelected ? `1px solid ${COLORS.brassSoft}` : "none",
                      }}
                    >
                      {d.dayNum}
                    </span>
                    <span className="w-1 h-1 rounded-full"
                      style={{ background: d.total > 0 ? (primaryPocket?.color || COLORS.brass) : "transparent" }} />
                  </button>
                );
              })}
            </div>
            <button onClick={() => shiftWeek(1)} aria-label="Próxima semana" className="p-1 flex-shrink-0">
              <ChevronRight size={14} color={`${COLORS.paper}80`} />
            </button>
          </div>
          <button onClick={() => setValuesHidden((v) => !v)} className="w-full flex items-center justify-center gap-1.5 mt-1">
            {valuesHidden
              ? <EyeOff size={11} color={`${COLORS.paper}50`} />
              : <Eye size={11} color={`${COLORS.paper}50`} />}
            <span className="font-mono text-[9px]" style={{ color: `${COLORS.paper}50` }}>
              {valuesHidden ? "ver todos os valores" : "ocultar todos os valores"}
            </span>
          </button>
          <p className="font-mono text-[10px] mt-1 text-center" style={{ color: COLORS.brassSoft }}>
            total desta semana: {valuesHidden ? "••••" : money(weekChart.weekTotal, primaryCurrency)}
          </p>

          <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid rgba(255,255,255,0.1)` }}>
            <div>
              <p className="text-[9px]" style={{ color: `${COLORS.paper}70` }}>gasto (cartão)</p>
              <p className="font-mono text-xs" style={{ color: COLORS.paper }}>{valuesHidden ? "••••" : money(totalsByCurrency[primaryCurrency] || 0, primaryCurrency)}</p>
            </div>
            <div>
              <p className="text-[9px]" style={{ color: `${COLORS.paper}70` }}>entrou</p>
              <p className="font-mono text-xs" style={{ color: "#A8D2A4" }}>{valuesHidden ? "••••" : money(totalIncomePrimary, primaryCurrency)}</p>
            </div>
            <div>
              <p className="text-[9px]" style={{ color: `${COLORS.paper}70` }}>saiu (fora)</p>
              <p className="font-mono text-xs" style={{ color: COLORS.paper }}>{valuesHidden ? "••••" : money(totalOut, primaryCurrency)}</p>
            </div>
            <div>
              <p className="text-[9px]" style={{ color: `${COLORS.paper}70` }}>investido</p>
              <p className="font-mono text-xs" style={{ color: "#8FBFE8" }}>{valuesHidden ? "••••" : money(investedThisPeriod, primaryCurrency)}</p>
            </div>
          </div>
        </div>

        {(() => {
          const realCurrentKey = monthKey(today.getFullYear(), today.getMonth());
          const overdueBills = bills.filter((b) => {
            const paid = (b.paidMonths || []).includes(realCurrentKey);
            const daysUntil = b.dueDay - today.getDate();
            return !paid && daysUntil < 0;
          });
          const overLimitPockets = pockets.filter((p) => spentForPocket(p.id) > p.limit);
          const hasAlerts = overdueBills.length > 0 || overLimitPockets.length > 0;

          return (
            <>
              {/* alertas urgentes */}
              {hasAlerts && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: `${COLORS.rust}14`, border: `1px solid ${COLORS.rust}44` }}>
                  <p className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: COLORS.rust }}>precisa de atenção</p>
                  <div className="space-y-1.5">
                    {overdueBills.map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <Flame size={13} style={{ color: COLORS.rust }} />
                        <p className="text-xs" style={{ color: COLORS.rust }}>
                          "{b.name}" venceu dia {b.dueDay} e ainda não foi paga
                        </p>
                      </div>
                    ))}
                    {overLimitPockets.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Flame size={13} style={{ color: COLORS.rust }} />
                        <p className="text-xs" style={{ color: COLORS.rust }}>
                          {p.name} estourou o limite em {money(spentForPocket(p.id) - p.limit, p.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* quanto pode gastar — hero */}
              {overallPct !== null && (
                <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: COLORS.paper, border: `1.5px solid ${overallRemaining >= 0 ? COLORS.line : COLORS.rust}` }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.inkSoft }}>quanto ainda dá pra gastar</p>
                  <p className="font-display text-4xl" style={{ color: overallRemaining >= 0 ? COLORS.ink : COLORS.rust }}>
                    {money(overallRemaining, overallCurrency)}
                  </p>
                  {daysLeftInMonth > 0 && overallRemaining > 0 && (
                    <p className="text-xs mt-1" style={{ color: COLORS.inkSoft }}>
                      ou {money(overallRemaining / daysLeftInMonth, overallCurrency)}/dia até o fim do ciclo
                    </p>
                  )}
                </div>
              )}
            </>
          );
        })()}

        <>
            {/* pockets grid */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.inkSoft }}>bolsos e cartões</p>
              <button onClick={() => setShowAddPocket(true)} className="text-[11px] font-medium" style={{ color: COLORS.brass }}>
                + novo bolso
              </button>
            </div>

            {pockets.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center mb-4" style={{ borderColor: COLORS.line }}>
                <Wallet size={22} className="mx-auto mb-2" style={{ color: COLORS.inkSoft }} />
                <p className="text-sm mb-3" style={{ color: COLORS.inkSoft }}>Nenhum bolso ainda. Crie um cartão ou bolso para começar a registrar gastos.</p>
                <button
                  onClick={() => setShowAddPocket(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                  style={{ background: COLORS.brass, color: COLORS.paper }}
                >
                  <Plus size={14} /> criar bolso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {pockets.map((p) => {
                  const spent = spentForPocket(p.id);
                  const pct = p.limit > 0 ? Math.min(100, (spent / p.limit) * 100) : 0;
                  const over = spent > p.limit;
                  const remaining = p.limit - spent;
                  const r = 26, circumference = 2 * Math.PI * r;
                  const active = selectedPockets.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePocketFilter(p.id)}
                      className="rounded-2xl p-3 flex flex-col items-center gap-1.5 relative text-center cursor-pointer"
                      style={{ background: COLORS.paper, border: `1px solid ${active ? (p.color || COLORS.brass) : (p.id === primaryPocketId ? p.color || COLORS.brass : COLORS.line)}`, boxShadow: active ? `0 0 0 2px ${p.color || COLORS.brass}33` : "none" }}
                    >
                      <div className="absolute top-1.5 left-1.5 flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setEditingPocket(p); }} aria-label="Editar bolso"
                          className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                          <Pencil size={10} style={{ color: COLORS.inkSoft }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deletePocket(p.id); }} aria-label="Remover bolso"
                          className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                          <Trash2 size={10} style={{ color: COLORS.inkSoft }} />
                        </button>
                      </div>
                      {p.id === primaryPocketId && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: p.color || COLORS.brass }}>
                          <Star size={9} color="#fff" fill="#fff" />
                        </span>
                      )}
                      <svg width="58" height="58" viewBox="0 0 58 58" className="mt-2">
                        <circle cx="29" cy="29" r={r} fill="none" stroke={COLORS.line} strokeWidth="6" />
                        <circle cx="29" cy="29" r={r} fill="none" stroke={over ? COLORS.rust : (p.color || COLORS.brass)} strokeWidth="6"
                          strokeDasharray={circumference} strokeDashoffset={circumference - (pct / 100) * circumference}
                          strokeLinecap="round" transform="rotate(-90 29 29)" />
                        <text x="29" y="33" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace" fill={COLORS.ink}>
                          {Math.round(pct)}%
                        </text>
                      </svg>
                      <p className="text-xs font-medium truncate w-full">{p.name}</p>
                      <p className="font-mono text-[10px]" style={{ color: over ? COLORS.rust : COLORS.inkSoft }}>
                        {over ? `estourou ${money(Math.abs(remaining), p.currency)}` : `faltam ${money(remaining, p.currency)}`}
                      </p>
                      {p.closingDay && (
                        <p className="text-[9px]" style={{ color: COLORS.inkSoft }}>
                          fecha {p.closingDay} · melhor dia: {p.closingDay === 31 ? 1 : p.closingDay + 1}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectedPockets.length > 0 && (
              <button onClick={() => setSelectedPockets([])} className="text-[11px] font-medium mb-3 block" style={{ color: COLORS.brass }}>
                limpar filtro de cartão
              </button>
            )}

            {/* contas a pagar */}
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: COLORS.inkSoft }}>contas a pagar</p>
            {bills.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center mb-4" style={{ borderColor: COLORS.line }}>
                <p className="text-xs" style={{ color: COLORS.inkSoft }}>Nenhuma conta cadastrada. Adicione luz, aluguel, boletos etc.</p>
              </div>
            ) : (
              <div className="rounded-2xl p-2 mb-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
                {bills
                  .slice()
                  .sort((a, b) => a.dueDay - b.dueDay)
                  .map((b) => {
                    const paid = (b.paidMonths || []).includes(currentKey);
                    const daysUntil = isCurrentMonth ? b.dueDay - today.getDate() : null;
                    const realPaid = (b.paidMonths || []).includes(monthKey(today.getFullYear(), today.getMonth()));
                    const overdue = !realPaid && (b.dueDay - today.getDate()) < 0;
                    return (
                      <div key={b.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ background: overdue ? `${COLORS.rust}14` : "transparent" }}>
                        <button
                          onClick={() => toggleBillPaid(b.id, currentKey)}
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: paid ? "#5C7A5A" : "transparent", border: `1.5px solid ${paid ? "#5C7A5A" : COLORS.line}` }}
                          aria-label={paid ? "Marcar como não paga" : "Marcar como paga"}
                        >
                          {paid && <Check size={12} color="#fff" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate" style={{ textDecoration: paid ? "line-through" : "none", color: paid ? COLORS.inkSoft : COLORS.ink }}>
                            {b.name}
                          </p>
                          <p className="text-[10px]" style={{ color: overdue ? COLORS.rust : COLORS.inkSoft }}>
                            {overdue ? `venceu dia ${b.dueDay}` : `vence dia ${b.dueDay}`}
                            {isCurrentMonth && !paid && daysUntil >= 0 ? ` · faltam ${daysUntil} ${daysUntil === 1 ? "dia" : "dias"}` : ""}
                          </p>
                        </div>
                        <span className="font-mono text-xs flex-shrink-0" style={{ color: COLORS.ink }}>{money(b.amount, b.currency)}</span>
                        <button onClick={() => setEditingBill(b)} aria-label="Editar conta" className="flex-shrink-0">
                          <Pencil size={12} style={{ color: COLORS.inkSoft }} />
                        </button>
                        <button onClick={() => deleteBill(b.id)} aria-label="Remover conta" className="flex-shrink-0">
                          <Trash2 size={12} style={{ color: COLORS.inkSoft }} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* investimentos */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.inkSoft }}>investimentos</p>
              <button onClick={() => setShowGoalEdit(true)} className="text-[11px] font-medium" style={{ color: COLORS.brass }}>
                {profile.investmentGoal > 0 ? "editar meta" : "+ definir meta"}
              </button>
            </div>

            {profile.investmentGoal > 0 ? (
              <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={13} color={COLORS.brass} />
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>meta de investimento</p>
                  {investmentTrend !== null && (
                    <span className="ml-auto flex items-center gap-1">
                      {investmentTrend >= 0
                        ? <TrendingUp size={11} color="#5C7A5A" />
                        : <TrendingDown size={11} color={COLORS.rust} />}
                      <span className="text-[10px]" style={{ color: investmentTrend >= 0 ? "#5C7A5A" : COLORS.rust }}>
                        {investmentTrend >= 0 ? "+" : ""}{investmentTrend}%
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
                    {valuesHidden ? "••••" : money(investedThisPeriod, primaryCurrency)}
                    <span className="font-body text-xs" style={{ color: COLORS.inkSoft }}> de {valuesHidden ? "••••" : money(profile.investmentGoal, primaryCurrency)}</span>
                  </p>
                  <span className="font-mono text-xs" style={{ color: COLORS.brass }}>
                    {Math.round(Math.min(100, (investedThisPeriod / profile.investmentGoal) * 100))}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full" style={{ background: COLORS.line }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (investedThisPeriod / profile.investmentGoal) * 100)}%`, background: COLORS.brass }} />
                </div>
                <p className="text-[10px] mt-2" style={{ color: COLORS.inkSoft }}>
                  {investedThisPeriod >= profile.investmentGoal
                    ? "meta batida esse mês! 🎉"
                    : `faltam ${valuesHidden ? "••••" : money(profile.investmentGoal - investedThisPeriod, primaryCurrency)} pra bater a meta do mês`}
                </p>

                <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                  <span className="text-[10px]" style={{ color: COLORS.inkSoft }}>total guardado</span>
                  <span className="font-mono text-[10px]" style={{ color: COLORS.ink }}>
                    {valuesHidden ? "••••" : money(investedAllTime, primaryCurrency)}
                  </span>
                </div>

                {recentInvestments.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
                    <p className="text-[10px] mb-1.5" style={{ color: COLORS.inkSoft }}>últimos investimentos</p>
                    {recentInvestments.map((t) => (
                      <div key={t.id} className="flex justify-between text-xs py-0.5">
                        <span style={{ color: COLORS.inkSoft }}>{t.description || t.category} · {t.date.split("-").reverse().join("/")}</span>
                        <span className="font-mono" style={{ color: COLORS.brass }}>{valuesHidden ? "••••" : money(t.amount, t.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: COLORS.paper, border: `1px dashed ${COLORS.line}` }}>
                <Target size={20} className="mx-auto mb-1.5" style={{ color: COLORS.inkSoft }} />
                <p className="text-xs mb-2" style={{ color: COLORS.inkSoft }}>
                  Você já guardou {valuesHidden ? "••••" : money(investedAllTime, primaryCurrency)} no total. Que tal definir uma meta mensal?
                </p>
                <button
                  onClick={() => setShowGoalEdit(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                  style={{ background: COLORS.brass, color: COLORS.paper }}
                >
                  <Plus size={14} /> definir meta
                </button>
              </div>
            )}

            {/* cotações do dia */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.inkSoft }}>cotações do dia</p>
              <button onClick={() => fetchQuotes(["USD", "EUR", "BTC", ...extraQuoteCodes])} disabled={quotesLoading}
                className="text-[11px] font-medium disabled:opacity-50" style={{ color: COLORS.brass }}>
                {quotesLoading ? "atualizando..." : "atualizar"}
              </button>
            </div>
            <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
              <div className="flex gap-2 mb-3">
                <input
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchQuote(); }}
                  placeholder="Buscar moeda (ex: GBP, JPY, ETH)"
                  style={{ ...getInputStyle(COLORS), flex: 1 }}
                />
                <button onClick={searchQuote} className="w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS.brass }}>
                  <Search size={14} color={COLORS.paper} />
                </button>
              </div>

              {quotesError && (
                <p className="text-xs mb-2" style={{ color: COLORS.rust }}>{quotesError}</p>
              )}

              {Object.keys(quotes).length === 0 && !quotesLoading && !quotesError && (
                <p className="text-xs text-center py-2" style={{ color: COLORS.inkSoft }}>Nenhuma cotação carregada ainda.</p>
              )}

              <div className="space-y-2">
                {Object.values(quotes).map((q) => {
                  const change = Number(q.pctChange);
                  const up = change >= 0;
                  return (
                    <div key={q.code} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{q.code} / BRL</p>
                        <p className="text-[10px]" style={{ color: COLORS.inkSoft }}>{q.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{money(Number(q.bid), "BRL")}</p>
                        <p className="text-[10px] font-mono" style={{ color: up ? "#5C7A5A" : COLORS.rust }}>
                          {up ? "+" : ""}{change}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] mt-3" style={{ color: COLORS.inkSoft }}>
                Cotações via AwesomeAPI, com pequeno atraso em relação ao mercado.
              </p>
            </div>

            {/* biggest expense highlight */}
            {biggestExpense && (
              <div className="flex items-center gap-2 mb-4 rounded-lg px-3 py-2.5" style={{ background: `${COLORS.rust}14`, border: `1px solid ${COLORS.rust}33` }}>
                <Flame size={14} style={{ color: COLORS.rust }} />
                <p className="text-xs" style={{ color: COLORS.rust }}>
                  maior gasto do mês: {biggestExpense.description || biggestExpense.category} · {money(biggestExpense.amount, biggestExpense.currency)}
                </p>
              </div>
            )}
          </>

        {(() => {
          const saldo = totalIncomePrimary - totalOut;

          const allTx = filteredMonthTx.filter((t) => {
            if (typeFilter === "all") return true;
            return (t.type || "expense") === typeFilter;
          });

          return (
            <>
              {/* análises — bloco secundário, agrupado e mais discreto */}
              {(essentialBreakdown.total > 0 || (byCategoryByCurrency[primaryCurrency] || []).length > 0) && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, opacity: 0.92 }}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: COLORS.inkSoft }}>análises</p>

                  {essentialBreakdown.total > 0 && (
                    <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                      <p className="text-[10px] mb-1.5" style={{ color: COLORS.inkSoft }}>fixo vs variável</p>
                      <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: COLORS.line }}>
                        <div style={{ width: `${essentialBreakdown.essentialPct}%`, background: "#5C7A5A" }} />
                        <div style={{ width: `${100 - essentialBreakdown.essentialPct}%`, background: COLORS.rust }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: "#5C7A5A" }}>
                          fixo {Math.round(essentialBreakdown.essentialPct)}%
                        </span>
                        <span className="text-[10px]" style={{ color: COLORS.rust }}>
                          variável {Math.round(100 - essentialBreakdown.essentialPct)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {(byCategoryByCurrency[primaryCurrency] || []).length > 0 && (
                    <div>
                      <p className="text-[10px] mb-1.5" style={{ color: COLORS.inkSoft }}>gastos por categoria</p>
                      {(byCategoryByCurrency[primaryCurrency] || [])
                        .slice()
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map((c, i) => {
                          const totalCat = (byCategoryByCurrency[primaryCurrency] || []).reduce((s, x) => s + x.value, 0) || 1;
                          const pct = Math.round((c.value / totalCat) * 100);
                          return (
                            <div key={i} className="mb-1.5 last:mb-0">
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span style={{ color: COLORS.inkSoft }}>{c.name}</span>
                                <span className="font-mono" style={{ color: COLORS.inkSoft }}>{pct}% · {money(c.value, primaryCurrency)}</span>
                              </div>
                              <div className="w-full h-1 rounded-full" style={{ background: COLORS.line }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: categoryColor(categories, c.name) }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* extrato completo abaixo */}
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: COLORS.inkSoft }}>extrato completo</p>

              {/* filtro por tipo */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto">
                {[
                  { id: "all", label: "Todos", color: COLORS.brass },
                  { id: "expense", label: "Despesas", color: COLORS.rust },
                  { id: "income", label: "Receitas", color: "#5C7A5A" },
                  { id: "investment", label: "Investimentos", color: "#5B8AC7" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: typeFilter === f.id ? f.color : COLORS.paper, color: typeFilter === f.id ? "#fff" : COLORS.ink, border: `1px solid ${typeFilter === f.id ? f.color : COLORS.line}` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* filtro por categoria */}
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.inkSoft }}>categorias</p>
                {selectedCategories.length > 0 && (
                  <button onClick={() => setSelectedCategories([])} className="text-[11px] font-medium" style={{ color: COLORS.brass }}>
                    limpar filtro
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 mb-4 overflow-x-auto">
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: active ? COLORS.brass : COLORS.paper, color: active ? COLORS.paper : COLORS.ink, border: `1px solid ${active ? COLORS.brass : COLORS.line}` }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* extrato único */}
              <div className="rounded-2xl p-4 mb-10" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: COLORS.inkSoft }}>
                  extrato {typeFilter !== "all" || selectedCategories.length > 0 ? "filtrado" : "do período"}
                </p>
                {allTx.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: COLORS.inkSoft }}>Nada por aqui ainda.</p>
                ) : (
                  <div className="divide-y" style={{ borderColor: COLORS.line }}>
                    {allTx
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => {
                        const pocket = pockets.find((p) => p.id === t.pocketId);
                        const isInc = t.type === "income";
                        const isInv = t.type === "investment";
                        return (
                          <div key={t.id} className="flex items-center justify-between py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isInc ? "#5C7A5A" : isInv ? "#5B8AC7" : categoryColor(categories, t.category) }} />
                              <div>
                                <p className="text-sm">{t.description || t.category}</p>
                                <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>
                                  {t.category} · {t.paymentMethod || (pocket ? pocket.name : "—")}{pocket && t.paymentMethod ? ` · ${pocket.name}` : ""} · {t.date.split("-").reverse().join("/")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm" style={{ color: isInc ? "#5C7A5A" : isInv ? "#5B8AC7" : COLORS.ink }}>
                                {isInc ? "+" : isInv ? "→" : ""}{money(t.amount, t.currency)}
                              </span>
                              <button onClick={() => deleteTransaction(t.id)} aria-label="Remover lançamento">
                                <Trash2 size={13} style={{ color: COLORS.inkSoft }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
      )}

      {view === "profile" && (
        <ProfilePage
          profile={profile}
          onSave={updateProfile}
          COLORS={COLORS}
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onToggleEssential={toggleCategoryEssential}
          stats={{
            pockets: pockets.length,
            transactions: transactions.length,
            currencies: Array.from(new Set(pockets.map((p) => p.currency || "BRL"))),
          }}
          onClearData={clearAllData}
          onExportData={exportData}
          onImportData={importData}
        />
      )}

      {/* floating add button */}
      {view === "dashboard" && (
        <div className="fixed right-4 z-40 flex flex-col items-end gap-2.5" style={{ bottom: 72 }}>
          {[
            { id: "invest", label: "Investimento", icon: TrendingUp, color: "#5B8AC7", action: () => { setQuickAddType("investment"); setDefaultPaymentMethod("Pix"); setTxConfig({ allowedTypes: ["investment"], lockPaymentMethod: true }); setShowAddTx(true); setFabOpen(false); } },
            { id: "pix", label: "Pix", icon: Wallet, color: "#5C7A5A", action: () => { setQuickAddType("expense"); setDefaultPaymentMethod("Pix"); setTxConfig({ allowedTypes: ["expense", "income"], lockPaymentMethod: false }); setShowAddTx(true); setFabOpen(false); } },
            { id: "cartao", label: "Cartão", icon: CreditCard, color: COLORS.brass, action: () => { setQuickAddType("expense"); setDefaultPaymentMethod("Cartão de crédito"); setTxConfig({ allowedTypes: ["expense"], lockPaymentMethod: true }); setShowAddTx(true); setFabOpen(false); } },
            { id: "conta", label: "Conta a pagar", icon: Calendar, color: COLORS.rust, action: () => { setShowAddBill(true); setFabOpen(false); } },
          ].map((opt, i) => (
            <button
              key={opt.id}
              onClick={opt.action}
              className="flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 shadow-lg"
              style={{
                background: opt.color, color: "#fff",
                transition: `all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) ${fabOpen ? i * 0.05 : 0}s`,
                opacity: fabOpen ? 1 : 0,
                transform: fabOpen ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
                pointerEvents: fabOpen ? "auto" : "none",
              }}
            >
              <opt.icon size={15} />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}

          <button
            onClick={() => setFabOpen((v) => !v)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: COLORS.brass }}
            aria-label={fabOpen ? "Fechar opções" : "Adicionar"}
          >
            <Plus size={24} color={COLORS.paper} style={{ transition: "transform 0.25s ease", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }} />
          </button>
        </div>
      )}

      {/* bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 flex z-40"
        style={{ background: COLORS.panel, borderTop: `1px solid ${COLORS.panelSoft}` }}
      >
        <div className="max-w-4xl mx-auto w-full flex">
          <button
            onClick={() => setView("dashboard")}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
            style={{ color: view === "dashboard" ? COLORS.brass : `${COLORS.paper}80` }}
          >
            <LayoutGrid size={18} /> início
          </button>
          <button
            onClick={() => setView("profile")}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
            style={{ color: view === "profile" ? COLORS.brass : `${COLORS.paper}80` }}
          >
            <User size={18} /> perfil
          </button>
        </div>
      </div>

      {(showAddPocket || editingPocket) && (
        <PocketModal
          COLORS={COLORS}
          initialPocket={editingPocket}
          isPrimary={editingPocket ? editingPocket.id === primaryPocketId : false}
          onTogglePrimary={setPrimaryPocket}
          onClose={() => { setShowAddPocket(false); setEditingPocket(null); }}
          onSave={(p) => {
            if (editingPocket) { updatePocket(editingPocket.id, p); setEditingPocket(null); }
            else { addPocket(p); setShowAddPocket(false); }
          }}
        />
      )}
      {showAddTx && (
        <TransactionModal
          COLORS={COLORS}
          pockets={pockets}
          categories={categories}
          defaultPocketId={primaryPocketId}
          defaultDate={toLocalISO(today)}
          defaultType={quickAddType}
          defaultPaymentMethod={defaultPaymentMethod}
          allowedTypes={txConfig.allowedTypes}
          lockPaymentMethod={txConfig.lockPaymentMethod}
          onAddCategory={addCategory}
          onAddPocket={addPocket}
          onClose={() => { setShowAddTx(false); setQuickAddType(null); setDefaultPaymentMethod(null); setTxConfig({ allowedTypes: null, lockPaymentMethod: false }); }}
          onSave={(t) => { addTransaction(t); setShowAddTx(false); setQuickAddType(null); setDefaultPaymentMethod(null); setTxConfig({ allowedTypes: null, lockPaymentMethod: false }); }}
        />
      )}
      {(showAddBill || editingBill) && (
        <BillModal
          COLORS={COLORS}
          initialBill={editingBill}
          onClose={() => { setShowAddBill(false); setEditingBill(null); }}
          onSave={(b) => {
            if (editingBill) { updateBill(editingBill.id, b); setEditingBill(null); }
            else { addBill(b); setShowAddBill(false); }
          }}
        />
      )}
      {showGoalEdit && (
        <GoalModal
          COLORS={COLORS}
          currentGoal={profile.investmentGoal}
          currency={primaryCurrency}
          onClose={() => setShowGoalEdit(false)}
          onSave={(goal) => { updateProfile({ investmentGoal: goal }); setShowGoalEdit(false); }}
        />
      )}
    </div>
  );
}

// ---------- profile page ----------
function ProfilePage({ profile, onSave, stats, onClearData, COLORS, categories, onAddCategory, onDeleteCategory, onToggleEssential, onExportData, onImportData }) {
  const [editing, setEditing] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [newCategory, setNewCategory] = useState("");
  const [importStatus, setImportStatus] = useState(null);
  const [confirmImport, setConfirmImport] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChosen(e) {
    const file = e.target.files[0];
    if (!file) return;
    setConfirmImport(file);
    e.target.value = "";
  }

  function runImport() {
    const file = confirmImport;
    setConfirmImport(null);
    onImportData(file, (result) => setImportStatus(result));
  }

  function saveName() {
    onSave({ name: nameDraft.trim() || "Minha conta" });
    setEditing(false);
  }

  function submitCategory(e) {
    e.preventDefault();
    onAddCategory(newCategory);
    setNewCategory("");
  }

  return (
    <div className="max-w-4xl mx-auto px-5 pb-28">
      <div className="relative mt-5 mb-4">
        <div className="absolute pointer-events-none" style={{
          width: 140, height: 140, borderRadius: "50%", top: -30, left: -20,
          background: COLORS.panel, filter: "blur(35px)", opacity: 0.9,
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 120, height: 120, borderRadius: "50%", top: 10, right: 10,
          background: COLORS.brassSoft, filter: "blur(40px)", opacity: 0.5,
        }} />
        <div
          className="relative rounded-2xl overflow-hidden p-5 shadow-lg"
          style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.35)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(120deg, rgba(255,255,255,0.35) 0%, transparent 45%)",
          }} />
          <div className="flex items-center gap-4 relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-display text-2xl flex-shrink-0"
              style={{ background: `${COLORS.brass}E6`, color: COLORS.paper, border: "1px solid rgba(255,255,255,0.4)" }}>
              {profile.name.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    style={{ ...getInputStyle(COLORS), padding: "0.4rem 0.6rem" }}
                    autoFocus
                  />
                  <button onClick={saveName} className="p-2 rounded-full flex-shrink-0" style={{ background: COLORS.brass }}>
                    <Check size={15} color={COLORS.paper} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  <p className="font-display text-xl" style={{ color: COLORS.ink }}>{profile.name}</p>
                  <button onClick={() => { setNameDraft(profile.name); setEditing(true); }} aria-label="Editar nome">
                    <Pencil size={14} style={{ color: COLORS.inkSoft }} />
                  </button>
                  <button
                    onClick={() => setShowThemePicker((v) => !v)}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ background: COLORS.brass, border: `2px solid ${COLORS.paper}`, boxShadow: `0 0 0 1px ${COLORS.brass}` }}
                    aria-label="Trocar cor do app"
                  />
                </div>
              )}
              <p className="text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>
                conta desde {profile.createdAt.split("-").reverse().join("/")}
              </p>
            </div>
          </div>
        </div>

        {showThemePicker && (
          <div
            className="absolute left-5 top-24 rounded-2xl p-3 z-30 shadow-lg"
            style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, minWidth: 220 }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: COLORS.inkSoft }}>tema do app</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_IDS.map((id) => {
                const t = THEMES[id];
                const selected = (profile.theme || "ledger") === id;
                return (
                  <button
                    key={id}
                    onClick={() => { onSave({ theme: id }); setShowThemePicker(false); }}
                    className="flex flex-col items-center gap-1"
                    aria-label={t.name}
                  >
                    <span
                      className="relative w-8 h-8 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${t.panelSoft}, ${t.panel})`,
                        boxShadow: selected ? `0 0 0 2px ${COLORS.paper}, 0 0 0 4px ${t.brass}` : "none",
                      }}
                    >
                      {selected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check size={13} color={t.brass} />
                        </span>
                      )}
                    </span>
                    <p className="text-[9px] text-center leading-tight" style={{ color: COLORS.inkSoft, maxWidth: 56 }}>{t.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: `radial-gradient(circle at 20% 20%, ${COLORS.panel}, ${COLORS.panelSoft} 65%)` }}>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: `${COLORS.brassSoft}33` }}>
          <div className="text-center px-1">
            <p className="font-display text-xl" style={{ color: COLORS.paper }}>{stats.pockets}</p>
            <p className="text-[10px] mt-0.5" style={{ color: `${COLORS.paper}80` }}>bolsos</p>
          </div>
          <div className="text-center px-1">
            <p className="font-display text-xl" style={{ color: COLORS.paper }}>{stats.transactions}</p>
            <p className="text-[10px] mt-0.5" style={{ color: `${COLORS.paper}80` }}>lançamentos</p>
          </div>
          <div className="text-center px-1">
            <p className="font-display text-xl truncate" style={{ color: COLORS.paper }}>
              {stats.currencies.length ? stats.currencies.join(", ") : "—"}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: `${COLORS.paper}80` }}>moedas</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.inkSoft }}>backup dos dados</p>
        <p className="text-[10px] mb-3" style={{ color: COLORS.inkSoft }}>
          Seus dados ficam salvos só neste navegador. Faça backup de vez em quando pra não perder nada
          se trocar de celular, limpar o navegador, ou algo assim.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onExportData}
            className="flex-1 rounded-full py-2.5 text-xs font-medium"
            style={{ background: COLORS.brass, color: COLORS.paper }}
          >
            ⬇ exportar backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-full py-2.5 text-xs font-medium"
            style={{ background: "transparent", color: COLORS.brass, border: `1px solid ${COLORS.brass}` }}
          >
            ⬆ importar backup
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileChosen} className="hidden" />
        </div>
        {importStatus && (
          <p className="text-[11px] mt-2" style={{ color: importStatus.ok ? "#5C7A5A" : COLORS.rust }}>
            {importStatus.message}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-4 mt-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.inkSoft }}>categorias</p>
        <p className="text-[10px] mb-3" style={{ color: COLORS.inkSoft }}>toque na palavra "fixo/variável" pra alternar</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c) => (
            <span
              key={c.name}
              className="flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5 text-xs font-medium"
              style={{ background: `${c.color}22`, color: COLORS.ink, border: `1px solid ${c.color}55` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.name}
              <button
                onClick={() => onToggleEssential(c.name)}
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: c.essential !== false ? "#5C7A5A22" : `${COLORS.rust}22`, color: c.essential !== false ? "#5C7A5A" : COLORS.rust }}
              >
                {c.essential !== false ? "fixo" : "variável"}
              </button>
              <button onClick={() => onDeleteCategory(c.name)} aria-label={`Remover ${c.name}`}>
                <X size={12} style={{ color: COLORS.inkSoft }} />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={submitCategory} className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria"
            style={{ ...getInputStyle(COLORS), flex: 1 }}
          />
          <button type="submit" className="rounded-full px-4 py-2 text-xs font-medium flex-shrink-0"
            style={{ background: COLORS.brass, color: COLORS.paper }}>
            Adicionar
          </button>
        </form>
      </div>

      {confirmImport && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(22,35,63,0.6)" }}>
          <div className="rounded-2xl w-full max-w-sm p-5" style={{ background: COLORS.paper }}>
            <p className="font-display text-lg mb-2" style={{ color: COLORS.ink }}>Restaurar backup?</p>
            <p className="text-sm mb-4" style={{ color: COLORS.inkSoft }}>
              Isso vai substituir TODOS os dados atuais do app (bolsos, lançamentos, categorias, contas) pelos dados
              do arquivo "{confirmImport.name}". Não dá pra desfazer. Tem certeza?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmImport(null)} className="flex-1 rounded-full py-2.5 text-sm font-medium"
                style={{ background: COLORS.line, color: COLORS.ink }}>
                Cancelar
              </button>
              <button onClick={runImport} className="flex-1 rounded-full py-2.5 text-sm font-medium"
                style={{ background: COLORS.rust, color: "#fff" }}>
                Sim, substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- modals ----------
function ModalShell({ title, onClose, children, COLORS }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(32,48,31,0.55)" }}>
      <div className="rounded-2xl w-full max-w-sm p-5" style={{ background: COLORS.paper }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg" style={{ color: COLORS.ink }}>{title}</p>
          <button onClick={onClose} aria-label="Fechar"><X size={18} style={{ color: COLORS.inkSoft }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PocketModal({ onClose, onSave, COLORS, initialPocket, isPrimary, onTogglePrimary }) {
  const [name, setName] = useState(initialPocket?.name || "");
  const [last4, setLast4] = useState(initialPocket?.last4 && initialPocket.last4 !== "0000" ? initialPocket.last4 : "");
  const [limit, setLimit] = useState(initialPocket ? String(initialPocket.limit) : "");
  const [currency, setCurrency] = useState(initialPocket?.currency || "BRL");
  const [closingDay, setClosingDay] = useState(initialPocket?.closingDay ? String(initialPocket.closingDay) : "");
  const [primary, setPrimary] = useState(!!isPrimary);
  const [error, setError] = useState("");
  const inputStyle = getInputStyle(COLORS);
  const isEditing = !!initialPocket;

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Dá um nome pro bolso ou cartão."); return; }
    if (!limit || Number(limit) <= 0) { setError("Preenche o limite mensal (precisa ser maior que zero)."); return; }
    const cd = closingDay ? Math.min(31, Math.max(1, Number(closingDay))) : null;
    setError("");
    const id = initialPocket?.id || String(Date.now());
    onSave({ id, name: name.trim(), last4: last4 || "0000", limit: Number(limit), currency, closingDay: cd });
    if (primary !== !!isPrimary) onTogglePrimary(primary ? id : null);
  }

  return (
    <ModalShell title={isEditing ? "Editar bolso" : "Novo bolso"} onClose={onClose} COLORS={COLORS}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome do bolso ou cartão" COLORS={COLORS}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cartão Nubank"
            className="input" style={inputStyle} />
        </Field>
        <Field label="Últimos 4 dígitos (opcional)" COLORS={COLORS}>
          <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="2222" className="input" style={inputStyle} />
        </Field>
        <Field label="Moeda" COLORS={COLORS}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            {CURRENCY_CODES.map((c) => <option key={c} value={c}>{CURRENCIES[c].label}</option>)}
          </select>
        </Field>
        <Field label={`Limite mensal (${CURRENCIES[currency].symbol})`} COLORS={COLORS}>
          <input value={limit} onChange={(e) => setLimit(e.target.value)} type="number" min="0" step="0.01"
            placeholder="1000" className="input" style={inputStyle} />
        </Field>
        <Field label="Dia de fechamento da fatura (opcional, só pra cartão de crédito)" COLORS={COLORS}>
          <input value={closingDay} onChange={(e) => setClosingDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            type="number" min="1" max="31" placeholder="Ex: 3" className="input" style={inputStyle} />
        </Field>
        {closingDay && Number(closingDay) >= 1 && Number(closingDay) <= 31 && (
          <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>
            Fecha todo dia {closingDay}. Melhor dia pra comprar: dia {Number(closingDay) === 31 ? 1 : Number(closingDay) + 1} (ganha o mês inteiro até a próxima fatura fechar).
          </p>
        )}

        <label className="flex items-center gap-2 rounded-xl p-3 cursor-pointer select-none"
          style={{ background: `${COLORS.brass}11`, border: `1px solid ${COLORS.line}` }}>
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
          <span className="text-xs" style={{ color: COLORS.ink }}>
            Usar como <strong>cartão principal</strong> (define o ciclo do mês do app inteiro, se tiver fechamento)
          </span>
        </label>

        {error && (
          <p className="text-xs" style={{ color: COLORS.rust }}>{error}</p>
        )}
        <button type="submit" className="w-full mt-2 rounded-full py-2.5 text-sm font-medium"
          style={{ background: COLORS.brass, color: COLORS.paper }}>
          {isEditing ? "Salvar alterações" : "Salvar bolso"}
        </button>
      </form>
    </ModalShell>
  );
}

function addMonthsToDate(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1 + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return toLocalISO(target);
}

function TransactionModal({ pockets, categories, defaultDate, defaultPocketId, defaultType, defaultPaymentMethod, allowedTypes, lockPaymentMethod, onAddCategory, onAddPocket, onClose, onSave, COLORS }) {
  const types = allowedTypes || ["expense", "income", "investment"];
  const [type, setType] = useState(defaultType || types[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");
  const [pocketId, setPocketId] = useState(defaultPocketId || pockets[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState(
    defaultPaymentMethod || (defaultType && defaultType !== "expense" ? "Pix" : (pockets.length ? "Cartão de crédito" : "Pix"))
  );
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewPocket, setShowNewPocket] = useState(false);
  const [newPocketName, setNewPocketName] = useState("");
  const [newPocketLimit, setNewPocketLimit] = useState("");
  const inputStyle = getInputStyle(COLORS);

  function submitNewCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    onAddCategory(name);
    setCategory(name);
    setNewCategoryName("");
    setShowNewCategory(false);
  }

  function submitNewPocket() {
    const name = newPocketName.trim();
    if (!name || !newPocketLimit) return;
    const id = String(Date.now());
    onAddPocket({ id, name, last4: "0000", limit: Number(newPocketLimit), currency: "BRL", closingDay: null });
    setPocketId(id);
    setNewPocketName("");
    setNewPocketLimit("");
    setShowNewPocket(false);
  }

  const selectedPocket = pockets.find((p) => p.id === pocketId);
  const currency = selectedPocket?.currency || "BRL";
  const n = Math.max(2, Number(installments) || 2);
  const perInstallment = isInstallment && amount ? Number(amount) / n : null;
  const isIncome = type === "income";
  const isInvestment = type === "investment";

  function submit(e) {
    e.preventDefault();
    if (!amount) return;

    if (!isInstallment || isIncome || isInvestment) {
      onSave({
        id: String(Date.now()), amount: Number(amount), category, pocketId: pocketId || null,
        paymentMethod, description, date, currency, type,
      });
      return;
    }

    const total = Number(amount);
    const groupId = String(Date.now());
    const base = Math.floor((total / n) * 100) / 100;
    const remainder = Math.round((total - base * n) * 100) / 100;
    const list = Array.from({ length: n }, (_, i) => ({
      id: `${groupId}-${i}`,
      amount: i === n - 1 ? Math.round((base + remainder) * 100) / 100 : base,
      category,
      pocketId: pocketId || null,
      paymentMethod,
      description: description ? `${description} (${i + 1}/${n})` : `Parcela ${i + 1}/${n}`,
      date: addMonthsToDate(date, i),
      currency,
      type,
      installmentGroup: groupId,
    }));
    onSave(list);
  }

  return (
    <ModalShell title={isIncome ? "Nova entrada" : isInvestment ? "Novo investimento" : "Nova saída"} onClose={onClose} COLORS={COLORS}>
      <form onSubmit={submit} className="space-y-3">
        {types.length > 1 && (
          <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${COLORS.line}` }}>
            {types.includes("expense") && (
              <button type="button" onClick={() => setType("expense")}
                className="flex-1 py-2 text-[11px] font-medium"
                style={{ background: type === "expense" ? COLORS.brass : "transparent", color: type === "expense" ? COLORS.paper : COLORS.inkSoft }}>
                saída
              </button>
            )}
            {types.includes("income") && (
              <button type="button" onClick={() => setType("income")}
                className="flex-1 py-2 text-[11px] font-medium"
                style={{ background: isIncome ? "#5C7A5A" : "transparent", color: isIncome ? "#fff" : COLORS.inkSoft }}>
                entrada
              </button>
            )}
            {types.includes("investment") && (
              <button type="button" onClick={() => setType("investment")}
                className="flex-1 py-2 text-[11px] font-medium"
                style={{ background: isInvestment ? "#5B8AC7" : "transparent", color: isInvestment ? "#fff" : COLORS.inkSoft }}>
                investimento
              </button>
            )}
          </div>
        )}

        {!lockPaymentMethod && (
        <Field label="Forma de pagamento" COLORS={COLORS}>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        )}

        <Field label="Bolso / cartão (opcional)" COLORS={COLORS}>
          <div className="flex gap-2">
            <select value={pocketId} onChange={(e) => setPocketId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">— nenhum —</option>
              {pockets.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.currency || "BRL"})</option>)}
            </select>
            <button type="button" onClick={() => setShowNewPocket((v) => !v)}
              className="w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS.brass }}>
              <Plus size={16} color={COLORS.paper} />
            </button>
          </div>
        </Field>
        {showNewPocket && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: `${COLORS.brass}11`, border: `1px solid ${COLORS.line}` }}>
            <input value={newPocketName} onChange={(e) => setNewPocketName(e.target.value)} placeholder="Nome do bolso"
              style={inputStyle} />
            <input value={newPocketLimit} onChange={(e) => setNewPocketLimit(e.target.value)} type="number" min="0" step="0.01"
              placeholder="Limite mensal (R$)" style={inputStyle} />
            <button type="button" onClick={submitNewPocket} className="w-full rounded-full py-2 text-xs font-medium"
              style={{ background: COLORS.brass, color: COLORS.paper }}>
              Criar bolso
            </button>
          </div>
        )}

        <Field label={`Valor total (${CURRENCIES[currency].symbol})`} COLORS={COLORS}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01"
            placeholder="89,90" className="input" style={inputStyle} autoFocus />
        </Field>
        <Field label="Categoria" COLORS={COLORS}>
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewCategory((v) => !v)}
              className="w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS.brass }}>
              <Plus size={16} color={COLORS.paper} />
            </button>
          </div>
        </Field>
        {showNewCategory && (
          <div className="rounded-xl p-3 flex gap-2" style={{ background: `${COLORS.brass}11`, border: `1px solid ${COLORS.line}` }}>
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria"
              style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={submitNewCategory} className="rounded-full px-3 text-xs font-medium flex-shrink-0"
              style={{ background: COLORS.brass, color: COLORS.paper }}>
              Criar
            </button>
          </div>
        )}
        <Field label="Descrição (opcional)" COLORS={COLORS}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isIncome ? "Venda da loja, salário…" : "Mercado, uber…"}
            className="input" style={inputStyle} />
        </Field>
        <Field label="Data" COLORS={COLORS}>
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={inputStyle} />
        </Field>

        {type === "expense" && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} />
            <span className="text-xs" style={{ color: COLORS.inkSoft }}>compra parcelada</span>
          </label>
        )}

        {type === "expense" && isInstallment && (
          <div className="rounded-xl p-3" style={{ background: `${COLORS.brass}11`, border: `1px solid ${COLORS.line}` }}>
            <Field label="Número de parcelas" COLORS={COLORS}>
              <input value={installments} onChange={(e) => setInstallments(e.target.value.replace(/\D/g, "").slice(0, 2))}
                type="number" min="2" max="24" className="input" style={inputStyle} />
            </Field>
            {perInstallment !== null && (
              <p className="text-[11px] mt-2" style={{ color: COLORS.inkSoft }}>
                {n}x de {money(perInstallment, currency)}, uma em cada mês a partir de {date.split("-").reverse().join("/")}.
              </p>
            )}
          </div>
        )}

        <button type="submit" className="w-full mt-2 rounded-full py-2.5 text-sm font-medium"
          style={{ background: isIncome ? "#5C7A5A" : isInvestment ? "#5B8AC7" : COLORS.brass, color: "#fff" }}>
          {isIncome ? "Adicionar entrada" : isInvestment ? "Adicionar investimento" : (isInstallment ? "Adicionar parcelas" : "Adicionar saída")}
        </button>
      </form>
    </ModalShell>
  );
}

function BillModal({ onClose, onSave, COLORS, initialBill }) {
  const [name, setName] = useState(initialBill?.name || "");
  const [amount, setAmount] = useState(initialBill ? String(initialBill.amount) : "");
  const [currency, setCurrency] = useState(initialBill?.currency || "BRL");
  const todayISO = toLocalISO(new Date());
  const [dueDate, setDueDate] = useState(initialBill?.dueDate || todayISO);
  const [error, setError] = useState("");
  const inputStyle = getInputStyle(COLORS);
  const isEditing = !!initialBill;

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Dá um nome pra essa conta."); return; }
    if (!amount || Number(amount) <= 0) { setError("Preenche o valor (precisa ser maior que zero)."); return; }
    if (!dueDate) { setError("Escolhe a data de vencimento."); return; }
    const dd = Number(dueDate.split("-")[2]);
    setError("");
    onSave({
      id: initialBill?.id || String(Date.now()),
      name: name.trim(), amount: Number(amount), currency, dueDay: dd, dueDate,
      paidMonths: initialBill?.paidMonths || [],
    });
  }

  return (
    <ModalShell title={isEditing ? "Editar conta" : "Nova conta a pagar"} onClose={onClose} COLORS={COLORS}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome da conta" COLORS={COLORS}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Luz, aluguel, internet…"
            className="input" style={inputStyle} autoFocus />
        </Field>
        <Field label="Moeda" COLORS={COLORS}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            {CURRENCY_CODES.map((c) => <option key={c} value={c}>{CURRENCIES[c].label}</option>)}
          </select>
        </Field>
        <Field label={`Valor (${CURRENCIES[currency].symbol})`} COLORS={COLORS}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01"
            placeholder="150" className="input" style={inputStyle} />
        </Field>
        <Field label="Data de vencimento" COLORS={COLORS}>
          <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" style={inputStyle} />
        </Field>
        <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>
          Essa conta se repete todo mês, sempre no dia {dueDate ? Number(dueDate.split("-")[2]) : "—"}. Se passar dessa data sem marcar como paga, ela aparece em atraso. Você marca como paga direto na lista do painel.
        </p>
        {error && (
          <p className="text-xs" style={{ color: COLORS.rust }}>{error}</p>
        )}
        <button type="submit" className="w-full mt-2 rounded-full py-2.5 text-sm font-medium"
          style={{ background: COLORS.brass, color: COLORS.paper }}>
          {isEditing ? "Salvar alterações" : "Salvar conta"}
        </button>
      </form>
    </ModalShell>
  );
}

function GoalModal({ onClose, onSave, COLORS, currentGoal, currency }) {
  const [goal, setGoal] = useState(currentGoal > 0 ? String(currentGoal) : "");
  const inputStyle = getInputStyle(COLORS);

  function submit(e) {
    e.preventDefault();
    onSave(Number(goal) || 0);
  }

  return (
    <ModalShell title="Meta de investimento" onClose={onClose} COLORS={COLORS}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={`Quanto você quer investir por mês (${CURRENCIES[currency].symbol})`} COLORS={COLORS}>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} type="number" min="0" step="0.01"
            placeholder="500" className="input" style={inputStyle} autoFocus />
        </Field>
        <p className="text-[11px]" style={{ color: COLORS.inkSoft }}>
          Isso mostra uma barrinha de progresso na seção de investimentos, comparando com o que você já guardou no mês. Deixa em branco ou zero pra remover a meta.
        </p>
        <button type="submit" className="w-full mt-2 rounded-full py-2.5 text-sm font-medium"
          style={{ background: "#5B8AC7", color: "#fff" }}>
          Salvar meta
        </button>
      </form>
    </ModalShell>
  );
}

function Field({ label, children, COLORS }) {
  return (
    <label className="block">
      <span className="text-xs" style={{ color: COLORS.inkSoft }}>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function getInputStyle(COLORS) {
  return {
    width: "100%",
    border: `1px solid ${COLORS.line}`,
    borderRadius: "0.75rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    background: "#FFFFFF",
    color: COLORS.ink,
    outline: "none",
  };
}
