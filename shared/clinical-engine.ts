import { cannabinoids, type Cannabinoid, conditionProfiles, type ConditionProfile } from "./ligand-pathway-data";

export interface PatientGenetics {
  comt: 'Val/Val' | 'Val/Met' | 'Met/Met'; // Val/Val = fast dopamine clearance (handle THC better), Met/Met = slow (anxious with THC)
  cyp2d6: 'Poor' | 'Intermediate' | 'Normal' | 'Ultrarapid'; // THC/CBD metabolism
  cyp2c9: 'Poor' | 'Intermediate' | 'Normal'; // THC clearance
}

export interface PatientConditions {
  weightKg: number;
  severityScore: number; // 1-10
  conditions: string[];
}

export interface WeeklyEnhancementReport {
  date: string;
  adjustments: {
    target: string; // e.g., 'CNR1', 'FAAH', '2-AG'
    weightModifier: number; // e.g., 1.15 for +15%
    rationale: string;
  }[];
}

// Terpenes and Entourage Effect
export interface Terpene {
  id: string;
  name: string;
  effects: string[];
  synergies: string[]; // Cannabinoid IDs it synergizes with
}

export const terpenes: Record<string, Terpene> = {
  Myrcene: { id: 'Myrcene', name: 'Myrcene', effects: ['Sedative', 'Muscle Relaxant', 'Pain Relief'], synergies: ['THC', 'CBD', 'CBN'] },
  Limonene: { id: 'Limonene', name: 'Limonene', effects: ['Uplifting', 'Anti-anxiety', 'Antidepressant'], synergies: ['CBD', 'CBG'] },
  Linalool: { id: 'Linalool', name: 'Linalool', effects: ['Anti-anxiety', 'Sedative', 'Pain Relief'], synergies: ['THC', 'CBD'] },
  Pinene: { id: 'Pinene', name: 'Alpha-Pinene', effects: ['Focus', 'Bronchodilator', 'Memory Enhancer'], synergies: ['THC', 'CBD'] },
  Caryophyllene: { id: 'Caryophyllene', name: 'Beta-Caryophyllene', effects: ['Anti-inflammatory', 'CB2 Agonist'], synergies: ['CBD', 'CBG'] },
};

// Calculate Dose / Titration
export interface TitrationSchedule {
  dayRange: string;
  doseMg: number;
  frequency: string;
  notes: string;
}

export function generateTitrationSchedule(
  patient: PatientConditions, 
  genetics: PatientGenetics | null,
  cannabinoidId: string
): TitrationSchedule[] {
  // Base dose logic: 0.1mg/kg for mild, 0.2mg/kg for mod, 0.3mg/kg for severe (Starting)
  let baseMultiplier = patient.severityScore <= 3 ? 0.05 : patient.severityScore <= 7 ? 0.1 : 0.15;
  
  // Genetic adjustments
  if (genetics) {
    if (cannabinoidId.includes('THC')) {
      if (genetics.cyp2c9 === 'Poor' || genetics.cyp2d6 === 'Poor') baseMultiplier *= 0.5; // Start much lower
      if (genetics.comt === 'Met/Met') baseMultiplier *= 0.7; // Prone to anxiety, lower THC start
    }
  }

  const startingDose = Math.max(1, Math.round(patient.weightKg * baseMultiplier));
  const targetDose = startingDose * 3; // Typically titrate up to 3x starting dose

  return [
    { dayRange: "Days 1-3", doseMg: startingDose, frequency: "Once daily (evening)", notes: "Assess tolerance" },
    { dayRange: "Days 4-7", doseMg: startingDose, frequency: "Twice daily", notes: "If well tolerated" },
    { dayRange: "Days 8-14", doseMg: Math.round(startingDose * 1.5), frequency: "Twice daily", notes: "Increase dose" },
    { dayRange: "Days 15+", doseMg: Math.round(targetDose / 2), frequency: "Twice daily", notes: "Target maintenance dose" },
  ];
}

// Apply Weekly Enhancements to IC Values
export function getAdjustedIcValue(baseIc: number, targetSymbol: string, enhancements: WeeklyEnhancementReport): number {
  const adjustment = enhancements.adjustments.find(a => a.target === targetSymbol);
  if (adjustment) {
    return Number((baseIc * adjustment.weightModifier).toFixed(4));
  }
  return baseIc;
}

// Entourage Synergy Score
export function calculateEntourageScore(selectedCannabinoids: string[], selectedTerpenes: string[]): number {
  let score = 100;
  let synergiesFound = 0;
  
  selectedTerpenes.forEach(tId => {
    const terp = terpenes[tId];
    if (terp) {
      selectedCannabinoids.forEach(cId => {
        if (terp.synergies.includes(cId)) {
          synergiesFound++;
        }
      });
    }
  });

  // Each synergy point adds 15 to the base 100 score
  score += (synergiesFound * 15);
  return score;
}
