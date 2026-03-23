import { db } from "../db";
import { trainingModules, trainingTracks, trainingModuleSections, trainingModuleKeyPoints } from "@shared/schema";

const ivTrainingModules = [
  // DAY 1: PHLEBOTOMY FUNDAMENTALS
  {
    id: "ivt-101-phlebotomy-safety",
    title: "1. Introduction to Phlebotomy & Safety",
    slug: "ivt-101-phlebotomy-safety",
    description: "Master the foundational skills of phlebotomy, professional characteristics (Compassion, Integrity, Accountability), standard precautions, hand hygiene, and strict HIPAA compliance.",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
    category: "IV Therapy",
    sortOrder: 1,
    duration: "45 min",
    difficulty: "beginner" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-102-anatomy-physiology",
    title: "2. Anatomy & Physiology - Circulatory System",
    slug: "ivt-102-anatomy-physiology",
    description: "In-depth overview of blood components (Plasma, RBCs, WBCs, Platelets) and vessel architecture. Learn why the Median Cubital vein is the primary target and how to differentiate arteries from veins.",
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800",
    category: "IV Therapy",
    sortOrder: 2,
    duration: "60 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-103-venipuncture-equipment",
    title: "3. Venipuncture Equipment & Techniques",
    slug: "ivt-103-venipuncture-equipment",
    description: "Mastery of 15-30 degree needle insertion, needle gauge selection (higher gauge = smaller needle), tourniquet timing (< 1 minute), and critical safety mechanism activation.",
    imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e97?w=800",
    category: "IV Therapy",
    sortOrder: 3,
    duration: "60 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-104-order-of-draw",
    title: "4. Order of Draw & Specimen Handling",
    slug: "ivt-104-order-of-draw",
    description: "Crucial protocols for tube collection sequences (Yellow/Blood Cultures first, Light Blue, Red, SST, Green, Lavender, Gray). Learn how to prevent hemolysis and specimen rejection.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800",
    category: "IV Therapy",
    sortOrder: 4,
    duration: "45 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-105-pediatric-geriatric",
    title: "5. Pediatric & Geriatric Considerations",
    slug: "ivt-105-pediatric-geriatric",
    description: "Specialized venipuncture techniques for fragile veins, pediatric distraction strategies, and geriatric communication protocols. Includes heel stick instruction for infants.",
    imageUrl: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800",
    category: "IV Therapy",
    sortOrder: 5,
    duration: "45 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["member", "doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },

  // DAY 2: IV THERAPY & EMERGENCY RESPONSE
  {
    id: "ivt-201-iv-therapy-fundamentals",
    title: "6. IV Therapy Fundamentals",
    slug: "ivt-201-iv-therapy-fundamentals",
    description: "Differentiate IV therapy (catheter remains in) vs. phlebotomy (needle withdrawn). Understand catheter types (Peripheral, Midline, Central) and fluid tonicity (Isotonic 0.9% NS).",
    imageUrl: "https://images.unsplash.com/photo-1542884748-2b87b00f3306?w=800",
    category: "IV Therapy",
    sortOrder: 6,
    duration: "50 min",
    difficulty: "intermediate" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-202-catheter-insertion",
    title: "7. IV Catheter Insertion Techniques",
    slug: "ivt-202-catheter-insertion",
    description: "Step-by-step IV catheter insertion at 10-30 degrees. Master 'flashback' identification, catheter advancement mechanics, and proper saline flushing.",
    imageUrl: "https://images.unsplash.com/photo-1584036561565-baf8f50a424f?w=800",
    category: "IV Therapy",
    sortOrder: 7,
    duration: "90 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-203-medication-administration",
    title: "8. IV Medication Administration & FFPMA Protocols",
    slug: "ivt-203-medication-administration",
    description: "Master the 5 Rights of Medication Administration. Learn the 9 elite FFPMA Clinical Protocols, including High-Dose Vitamin C, Myers' Cocktail, NAD+, and Ozonated Glycerin.",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    category: "IV Therapy",
    sortOrder: 8,
    duration: "120 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-204-monitoring-complications",
    title: "9. Monitoring & Complications",
    slug: "ivt-204-monitoring-complications",
    description: "Identify and intervene rapidly for IV complications such as Infiltration, Phlebitis, Air Embolism, Speed Shock, and Fluid Overload.",
    imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800",
    category: "IV Therapy",
    sortOrder: 9,
    duration: "60 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
  {
    id: "ivt-205-emergency-protocols",
    title: "10. FFPMA Emergency Protocols",
    slug: "ivt-205-emergency-protocols",
    description: "Triage and respond to life-threatening scenarios: Anaphylaxis (Epinephrine IM), Seizures, and Cardiac Arrest. Detailed use of the FFPMA-IR-1.0 Incident Report.",
    imageUrl: "https://images.unsplash.com/photo-1587559070757-f7e785b0ea83?w=800",
    category: "IV Therapy",
    sortOrder: 10,
    duration: "120 min",
    difficulty: "advanced" as const,
    isActive: true,
    requiresMembership: true,
    roleAccess: ["doctor", "admin", "nurse"],
    isInteractive: false,
    hasQuiz: true,
  },
];

const ivTrack = {
  id: "track-iv-certification",
  title: "FFPMA IV Therapy Practitioner Certification",
  slug: "ffpma-iv-therapy-certification",
  description: "Official FFPMA certification track. Covers Phlebotomy Fundamentals, IV Catheter Insertion, High-Dose Protocols, and Emergency Triage. Requires passing a 50-question final exam and practical assessment.",
  imageUrl: "https://images.unsplash.com/photo-1542884748-2b87b00f3306?w=800",
  totalModules: 10,
  estimatedDuration: "16 hours",
  difficulty: "advanced" as const,
  isActive: true,
  requiresMembership: true,
  roleAccess: ["member", "doctor", "admin", "nurse"],
};

export async function seedIVTraining() {
  console.log("[IV Seed] Starting FFPMA IV Therapy Certification seed...");
  
  try {
    for (const module of ivTrainingModules) {
      await db.insert(trainingModules)
        .values(module)
        .onConflictDoUpdate({
          target: trainingModules.id,
          set: {
            title: module.title,
            description: module.description,
            imageUrl: module.imageUrl,
            duration: module.duration,
            difficulty: module.difficulty,
            isInteractive: module.isInteractive,
            hasQuiz: module.hasQuiz,
          },
        });
      console.log(`[IV Seed] Upserted module: ${module.title}`);
    }

    await db.insert(trainingTracks)
      .values(ivTrack)
      .onConflictDoUpdate({
        target: trainingTracks.id,
        set: {
          title: ivTrack.title,
          description: ivTrack.description,
          totalModules: ivTrack.totalModules,
          estimatedDuration: ivTrack.estimatedDuration,
        },
      });
    console.log("[IV Seed] Upserted IV Certification track");

    return { 
      success: true, 
      modules: ivTrainingModules.length,
      message: `Seeded ${ivTrainingModules.length} IV therapy training modules`,
    };
  } catch (error: any) {
    console.error("[IV Seed] Error:", error);
    throw error;
  }
}
