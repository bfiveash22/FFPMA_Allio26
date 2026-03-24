// ECS Assessment and Clinical Endocannabinoid Deficiency (CECD) Engine

export interface EcsSymptom {
  id: string;
  category: 'Neurological' | 'Gastrointestinal' | 'Immunological' | 'Psychiatric' | 'Pain';
  question: string;
  severity: number; // 0-10 user input
  weight: number; // Importance in CECD scoring
}

export interface EcsLabMarkers {
  anandamideTone: number; // ng/mL
  faahLevel: number; // Enzyme activity metric
  omega6To3Ratio: number; // Optimal is ~4:1 or lower
  hsCRP: number; // Systemic inflammation
}

export const cecdQuestionnaire: EcsSymptom[] = [
  { id: 'migraine', category: 'Neurological', question: 'Frequency and severity of migraines or treatment-resistant headaches?', severity: 0, weight: 1.5 },
  { id: 'fibromyalgia', category: 'Pain', question: 'Presence of widespread hyperalgesia (fibromyalgia-like symptoms)?', severity: 0, weight: 1.5 },
  { id: 'ibs', category: 'Gastrointestinal', question: 'Irritable bowel symptoms (cramping, erratic motility)?', severity: 0, weight: 1.5 },
  { id: 'sleep', category: 'Neurological', question: 'Difficulty initiating or maintaining sleep?', severity: 0, weight: 1.0 },
  { id: 'anxiety', category: 'Psychiatric', question: 'Chronic background anxiety or hyper-arousal?', severity: 0, weight: 1.2 },
  { id: 'inflammation', category: 'Immunological', question: 'Slow recovery from injury or chronic low-grade inflammation?', severity: 0, weight: 1.0 },
];

export interface EcsAssessmentResult {
  cecdScore: number; // 0-100 indicating likelihood of Clinical Endocannabinoid Deficiency
  labScore: number; // 0-100 objective functioning
  combinedHealthScore: number; // 0-100 overall ECS tone
  recommendations: string[];
}

export function calculateEcsHealth(
  symptoms: Record<string, number>, // Map of symptom id to severity 0-10
  labs?: EcsLabMarkers
): EcsAssessmentResult {
  
  // 1. Calculate subjective CECD score based on symptoms
  let totalSymptomWeight = 0;
  let weightedSymptomSum = 0;
  
  cecdQuestionnaire.forEach(q => {
    const severity = symptoms[q.id] || 0;
    weightedSymptomSum += severity * q.weight;
    totalSymptomWeight += 10 * q.weight; // Max possible for this question
  });
  
  // 0 means healthy, 100 means high deficiency
  const cecdRiskPercentage = Math.round((weightedSymptomSum / totalSymptomWeight) * 100);

  // 2. Calculate objective Lab Score if available
  let labScore = 100; // Default optimal
  let recommendations: string[] = [];

  if (labs) {
    // Penalize for low AEA tone
    if (labs.anandamideTone < 0.5) {
      labScore -= 20;
      recommendations.push("Low Anandamide Tone: Consider CB1 partial agonists (THC) and FAAH inhibitors (CBD).");
    }
    // Penalize for high FAAH (breaks down AEA too fast)
    if (labs.faahLevel > 50) {
      labScore -= 15;
      recommendations.push("Elevated FAAH Activity: CBD recommended to inhibit FAAH and preserve natural anandamide.");
    }
    // Penalize for poor Omega ratio (precursors for endocannabinoids)
    if (labs.omega6To3Ratio > 10) {
      labScore -= 20;
      recommendations.push("Poor Omega 6:3 Ratio: Increase Omega-3s (EPA/DHA) to provide building blocks for natural endocannabinoids.");
    }
    // Penalize for high inflammation
    if (labs.hsCRP > 3.0) {
      labScore -= 15;
      recommendations.push("Systemic Inflammation: CB2 agonists (CBG, beta-caryophyllene) recommended to modulate immune response.");
    }
  } else {
    recommendations.push("Consider lab testing for Anandamide, FAAH, and Omega ratios for objective ECS profiling.");
  }

  // 3. Combined Score (Lower is worse ECS health)
  // cecdRisk is 0-100 (100 = bad). We invert it: 100 - cecdRisk = subjective health
  const subjectiveHealth = 100 - cecdRiskPercentage;
  
  // Weight subjective 60% and objective 40% (if labs exist)
  const combinedHealthScore = labs 
    ? Math.round((subjectiveHealth * 0.6) + (labScore * 0.4))
    : subjectiveHealth;

  if (combinedHealthScore < 40) {
    recommendations.unshift("High likelihood of Clinical Endocannabinoid Deficiency (CECD). Full spectrum supplementation recommended.");
  } else if (combinedHealthScore < 70) {
    recommendations.unshift("Moderate ECS dysregulation. Targeted cannabinoid therapy recommended.");
  } else {
    recommendations.unshift("ECS tone is optimal. Maintain with lifestyle interventions and intermittent support.");
  }

  return {
    cecdScore: cecdRiskPercentage, // 100 = full deficiency
    labScore: labs ? labScore : 0, // 100 = perfect labs
    combinedHealthScore, // 100 = perfect health
    recommendations
  };
}
