/**
 * "Ads for Good" & Community Impact Co-Sponsorship Service
 * Ratified in COUNCIL-2026-013
 * 
 * Provides pure, zero-tracking, client-side utilities for routing
 * ad attention value-exchange rewards toward verified civic causes.
 */

export const COMMUNITY_IMPACT_STORAGE_KEY = 'adme_community_impact_v1';
export const COMMUNITY_IMPACT_EVENT = 'adme:community-impact-change';

export type ImpactSplitMode = 'perks_only' | 'balanced' | 'cause_only';

export interface CommunityCause {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  category: 'environment' | 'hunger' | 'education' | 'animals';
  icon: string;
  targetGoal: number;
  currentProgress: number;
  unit: string;
  unitEs: string;
  sponsorBrand: string;
  conversionRate: number; // points required per 1 unit of impact
}

export interface ImpactContribution {
  id: string;
  causeId: string;
  causeTitle: string;
  pointsContributed: number;
  impactUnits: number;
  unitLabel: string;
  timestamp: number;
  certificateId: string;
}

export interface CommunityImpactState {
  splitMode: ImpactSplitMode;
  selectedCauseId: string;
  totalPointsDonated: number;
  contributions: ImpactContribution[];
}

export const COMMUNITY_CAUSES_REGISTRY: CommunityCause[] = [
  {
    id: 'urban-tree-canopy',
    title: 'Urban Reforestation & Shade Canopy',
    titleEs: 'Siembra Urbana y Reforestación',
    description: 'Plant native shade trees in urban heat corridors to restore biodiversity and lower city temperatures.',
    descriptionEs: 'Planta árboles nativos en corredores urbanos para restaurar la biodiversidad y reducir las temperaturas de la ciudad.',
    category: 'environment',
    icon: '🌱',
    targetGoal: 1000,
    currentProgress: 642,
    unit: 'trees planted',
    unitEs: 'árboles sembrados',
    sponsorBrand: 'The Green Kitchen',
    conversionRate: 25,
  },
  {
    id: 'neighborhood-meals',
    title: 'Warm Meals for Local Shelters',
    titleEs: 'Comidas Calientes para Albergues',
    description: 'Provide fresh, balanced nutritional meals to community kitchens and emergency shelter networks.',
    descriptionEs: 'Provee comidas frescas y balanceadas a comedores comunitarios y redes de albergues de emergencia.',
    category: 'hunger',
    icon: '🍲',
    targetGoal: 2500,
    currentProgress: 1840,
    unit: 'meals funded',
    unitEs: 'comidas financiadas',
    sponsorBrand: 'Valor Brews',
    conversionRate: 15,
  },
  {
    id: 'youth-stem-coding',
    title: 'Youth Robotics & Coding Labs',
    titleEs: 'Laboratorios de Robótica y Código para Jóvenes',
    description: 'Fund open-access coding workshops and robotics toolkits for public school students.',
    descriptionEs: 'Financia talleres de código y kits de robótica de acceso abierto para estudiantes de escuelas públicas.',
    category: 'education',
    icon: '💻',
    targetGoal: 500,
    currentProgress: 320,
    unit: 'lab hours',
    unitEs: 'horas de laboratorio',
    sponsorBrand: 'CyberPulse Security',
    conversionRate: 50,
  },
  {
    id: 'paws-rescue',
    title: 'Community Animal Rescue & Care',
    titleEs: 'Rescate y Cuidado Animal Comunitario',
    description: 'Support emergency medical care, vaccines, and foster supplies for rescued pets.',
    descriptionEs: 'Apoya atención médica veterinaria de emergencia, vacunas y suministros de acogida para animales rescatados.',
    category: 'animals',
    icon: '🐾',
    targetGoal: 800,
    currentProgress: 512,
    unit: 'care kits',
    unitEs: 'kits de cuidado',
    sponsorBrand: 'Nomad Motors',
    conversionRate: 20,
  },
];

export const DEFAULT_COMMUNITY_IMPACT_STATE: CommunityImpactState = {
  splitMode: 'balanced', // Default to 50/50 Dual Benefit
  selectedCauseId: 'urban-tree-canopy',
  totalPointsDonated: 0,
  contributions: [],
};

/**
 * Calculates the split between personal rewards points and cause contribution.
 */
export function calculateImpactSplit(
  points: number,
  mode: ImpactSplitMode
): { perksPoints: number; causePoints: number } {
  if (points <= 0) {
    return { perksPoints: 0, causePoints: 0 };
  }

  switch (mode) {
    case 'perks_only':
      return { perksPoints: points, causePoints: 0 };
    case 'cause_only':
      return { perksPoints: 0, causePoints: points };
    case 'balanced':
    default: {
      const perks = Math.ceil(points / 2);
      const cause = Math.floor(points / 2);
      return { perksPoints: perks, causePoints: cause };
    }
  }
}

/**
 * Calculates tangible impact units generated from contributed points.
 */
export function calculateImpactUnits(points: number, conversionRate: number): number {
  if (points <= 0 || conversionRate <= 0) return 0;
  if (points >= conversionRate) {
    return Math.floor(points / conversionRate);
  }
  return Number((points / conversionRate).toFixed(1));
}

/**
 * Deterministically generates an anonymous client-side certificate ID.
 */
export function generateDeterministicCertificateId(
  causeId: string,
  timestamp: number,
  points: number
): string {
  const prefix = causeId.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const timeHash = Math.abs(timestamp % 100000).toString().padStart(5, '0');
  return `IMP-${prefix}-${timeHash}-${points}P`;
}

/**
 * Finds a cause by its unique ID.
 */
export function getCauseById(causeId: string): CommunityCause | undefined {
  return COMMUNITY_CAUSES_REGISTRY.find((c) => c.id === causeId);
}

/**
 * Reads the persistent Community Impact state from localStorage.
 */
export function loadCommunityImpactState(): CommunityImpactState {
  if (typeof window === 'undefined') {
    return DEFAULT_COMMUNITY_IMPACT_STATE;
  }
  try {
    const raw = localStorage.getItem(COMMUNITY_IMPACT_STORAGE_KEY);
    if (!raw) return DEFAULT_COMMUNITY_IMPACT_STATE;
    const parsed = JSON.parse(raw);
    return {
      splitMode: parsed.splitMode || DEFAULT_COMMUNITY_IMPACT_STATE.splitMode,
      selectedCauseId: parsed.selectedCauseId || DEFAULT_COMMUNITY_IMPACT_STATE.selectedCauseId,
      totalPointsDonated: Number(parsed.totalPointsDonated) || 0,
      contributions: Array.isArray(parsed.contributions) ? parsed.contributions : [],
    };
  } catch {
    return DEFAULT_COMMUNITY_IMPACT_STATE;
  }
}

/**
 * Persists Community Impact state and broadcasts custom event.
 */
export function saveCommunityImpactState(state: CommunityImpactState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMMUNITY_IMPACT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-blocking storage exception
  }

  if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(COMMUNITY_IMPACT_EVENT, { detail: state })
    );
  }
}
