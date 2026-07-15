import type { CareerArea, CareerRegion, CareerTitle } from "../types";

export const GAME_TITLE_DISCLAIMER =
  "ShiftQuest titles are game progression rewards only; they do not represent real professional qualifications or authority.";

export const GAME_TITLE_DISCLAIMER_TR =
  "ShiftQuest unvanları yalnızca oyun içi ilerleme ödülleridir; gerçek mesleki yeterlilik veya yetki göstermez.";

export const careerTitles: CareerTitle[] = [
  { id: "engineering-intern", rank: 1, name: "Engineering Intern", nameTr: "Mühendislik Stajyeri", minimumXp: 0, description: "Begin your communication journey on campus.", color: "#38bdf8", icon: "hard-hat", unlocks: ["office-hub", "training-center"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "graduate-engineer", rank: 2, name: "Graduate Engineer", nameTr: "Yeni Mezun Mühendis", minimumXp: 300, description: "Handle routine workplace conversations with growing confidence.", color: "#22d3ee", icon: "graduation-cap", unlocks: ["meeting-room"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "junior-process-engineer", rank: 3, name: "Junior Process Engineer", nameTr: "Genç Proses Mühendisi", minimumXp: 800, description: "Connect clear English with everyday engineering contexts.", color: "#2dd4bf", icon: "git-branch", unlocks: ["production-floor"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "shift-engineer", rank: 4, name: "Shift Engineer", nameTr: "Vardiya Mühendisi", minimumXp: 1600, description: "Communicate status, handovers and observations across a shift.", color: "#a3e635", icon: "clock-3", unlocks: ["quality-lab", "safety-zone"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "production-engineer", rank: 5, name: "Production Engineer", nameTr: "Üretim Mühendisi", minimumXp: 2700, description: "Navigate nuanced cross-functional production conversations.", color: "#facc15", icon: "factory", unlocks: ["control-room"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "senior-engineer", rank: 6, name: "Senior Engineer", nameTr: "Kıdemli Mühendis", minimumXp: 4200, description: "Explain constraints and guide discussions with professional tone.", color: "#fb923c", icon: "badge-check", unlocks: ["maintenance-area"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "team-leader", rank: 7, name: "Team Leader", nameTr: "Takım Lideri", minimumXp: 6200, description: "Bring people toward clear actions and shared understanding.", color: "#f472b6", icon: "users-round", unlocks: ["advanced-scenario-pack"], disclaimer: GAME_TITLE_DISCLAIMER },
  { id: "operations-manager", rank: 8, name: "Operations Manager", nameTr: "Operasyon Yöneticisi", minimumXp: 8500, description: "Master the campus’s most demanding communication challenges.", color: "#c084fc", icon: "crown", unlocks: ["master-scenario-pack"], disclaimer: GAME_TITLE_DISCLAIMER },
];

export const careerRegions: CareerRegion[] = [
  { id: "office-hub", name: "Office Hub", nameTr: "Ofis Merkezi", description: "Requests, updates, email and workload conversations.", requiredXp: 0, position: { x: 18, y: 25 }, accentColor: "#38bdf8", icon: "building-2" },
  { id: "training-center", name: "Training Center", nameTr: "Eğitim Merkezi", description: "Career, interview and social communication practice.", requiredXp: 0, position: { x: 16, y: 70 }, accentColor: "#c084fc", icon: "graduation-cap" },
  { id: "meeting-room", name: "Meeting Room", nameTr: "Toplantı Odası", description: "Opinions, clarification and action-item missions.", requiredXp: 300, position: { x: 40, y: 18 }, accentColor: "#818cf8", icon: "presentation" },
  { id: "production-floor", name: "Production Floor", nameTr: "Üretim Sahası", description: "Shift, plan and operator communication missions.", requiredXp: 800, position: { x: 43, y: 55 }, accentColor: "#f59e0b", icon: "factory" },
  { id: "quality-lab", name: "Quality Lab", nameTr: "Kalite Laboratuvarı", description: "Quality and documentation communication missions.", requiredXp: 1600, position: { x: 66, y: 24 }, accentColor: "#2dd4bf", icon: "flask-conical" },
  { id: "safety-zone", name: "Safety Zone", nameTr: "Güvenlik Bölgesi", description: "Communication-only reporting and clarification practice.", requiredXp: 1600, position: { x: 68, y: 72 }, accentColor: "#f97316", icon: "shield-check" },
  { id: "control-room", name: "Control Room", nameTr: "Kontrol Odası", description: "Nuanced status and cross-functional briefing missions.", requiredXp: 2700, position: { x: 88, y: 38 }, accentColor: "#22d3ee", icon: "monitor-dot" },
  { id: "maintenance-area", name: "Maintenance Area", nameTr: "Bakım Alanı", description: "Advanced coordination conversations; no equipment operation lessons.", requiredXp: 4200, position: { x: 88, y: 70 }, accentColor: "#a3e635", icon: "wrench" },
];

export const careerAreaOptions: Array<{ id: CareerArea; label: string; labelTr: string; icon: string }> = [
  { id: "general", label: "General Chemical Engineering", labelTr: "Genel Kimya Mühendisliği", icon: "atom" },
  { id: "production", label: "Production", labelTr: "Üretim", icon: "factory" },
  { id: "process", label: "Process", labelTr: "Proses", icon: "git-branch" },
  { id: "quality", label: "Quality", labelTr: "Kalite", icon: "clipboard-check" },
  { id: "laboratory", label: "Laboratory", labelTr: "Laboratuvar", icon: "flask-conical" },
  { id: "pharma", label: "Pharmaceutical", labelTr: "İlaç Sektörü", icon: "pill" },
];

export const dailyGoalOptions = [5, 10, 15, 20] as const;

export const xpAwards = {
  correctAnswer: 10,
  firstTryBonus: 5,
  dailyShift: 35,
  perfectScenario: 50,
  vocabularyReview: 8,
  bossBattle: 75,
  streakDay: 15,
  roleplay: 40,
} as const;

export const getCareerTitleForXp = (xp: number): CareerTitle =>
  [...careerTitles].reverse().find((title) => xp >= title.minimumXp) ?? careerTitles[0];

export const getNextCareerTitle = (xp: number): CareerTitle | undefined =>
  careerTitles.find((title) => title.minimumXp > xp);

export const getUnlockedRegions = (xp: number): CareerRegion[] =>
  careerRegions.filter((region) => xp >= region.requiredXp);
