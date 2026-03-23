import { db } from "./db";
import { programs } from "@shared/schema";
import { count } from "drizzle-orm";

export async function seedPrograms() {
  try {
    // Check if programs exist
    const [{ value }] = await db.select({ value: count() }).from(programs);
    
    if (value > 0) {
      console.log(`[Seed] Programs table already has ${value} records. Skipping seed.`);
      return;
    }

    console.log("[Seed] Seeding 12 premium clinical programs...");

    const seedData = [
      // IV PROGRAMS
      {
        name: "Advanced NAD+ Cellular Reset",
        slug: "advanced-nad-cellular-reset",
        type: "iv" as const,
        shortDescription: "Mitochondrial regeneration protocol infused slowly over 2-4 hours to restore cellular energy.",
        description: "A profound mitochondrial regeneration protocol infused slowly over 2-4 hours to restore cellular energy pathways, enhance cognitive clarity, and support profound longevity. NAD+ acts as a critical coenzyme in every cell, repairing DNA damage and fighting age-related cognitive decline at the source. Administration requires 250-750mg of NAD+ diluted in Normal Saline, titrated carefully to ensure maximum absorption and patient comfort.",
        imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118",
        price: "499.00",
        duration: "2-4 hours",
        isActive: true,
      },
      {
        name: "High-Dose IV Vitamin C",
        slug: "high-dose-iv-vitamin-c",
        type: "iv" as const,
        shortDescription: "A potent 25g to 70g continuous ascorbic acid infusion for severe oxidative stress.",
        description: "A potent 25g to 70g continuous ascorbic acid infusion designed to target oxidative stress, supercharge immune function, and support complex recovery phases. Administered over 1.5 to 3 hours, this protocol is heavily utilized in integrative oncology support and severe immune compromise. Includes targeted additions of Magnesium and Calcium to ensure venous comfort.",
        imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8",
        price: "249.00",
        duration: "1.5-3 hours",
        isActive: true,
      },
      {
        name: "Master Antioxidant Glutathione Push",
        slug: "master-antioxidant-glutathione",
        type: "iv" as const,
        shortDescription: "The ultimate detoxifying agent. A rapid 1,200mg IV push to neutralize free radicals.",
        description: "The ultimate detoxifying agent. A rapid 1,200mg to 2,000mg IV push designed to neutralize free radicals, alleviate asthmatic triggers, and restore youthful elasticity to cellular walls. Often administered post-infusion to cap off nutrient cascades, Glutathione binds to systemic toxins and heavy metals, escorting them safely out of the body.",
        imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69",
        price: "150.00",
        duration: "15 minutes",
        isActive: true,
      },
      {
        name: "The Original Myers' Cocktail",
        slug: "original-myers-cocktail",
        type: "iv" as const,
        shortDescription: "A comprehensive hyper-vitamin infusion alleviating fatigue, migraines, and fibromyalgia.",
        description: "A comprehensive hyper-vitamin infusion featuring high-dose B-complex, Magnesium, Zinc, and restorative trace minerals. Rapidly alleviates fatigue, migraines, and fibromyalgia while restoring systemic balance. Formulated to precisely hydrate and remineralize the body in 30 to 60 minutes.",
        imageUrl: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133",
        price: "199.00",
        duration: "45 minutes",
        isActive: true,
      },

      // PEPTIDE PROGRAMS
      {
        name: "BPC-157 Rapid Tissue Repair",
        slug: "bpc-157-rapid-tissue-repair",
        type: "peptide" as const,
        shortDescription: "A targeted regenerative protocol to accelerate the healing of tears and tendon damage.",
        description: "A targeted regenerative protocol utilizing Body Protection Compound 157. Formulated to rapidly accelerate the healing of muscle tears, tendon damage, and gastrointestinal distress. It enhances profound angiogenesis, building new blood vessel networks around injured sites, while dramatically reducing systemic inflammation.",
        imageUrl: "https://images.unsplash.com/photo-1542736667-069246bdbc6d",
        price: "299.00",
        duration: "4-6 Weeks",
        isActive: true,
      },
      {
        name: "GLOW Cosmetic Rejuvenation Stack",
        slug: "glow-cosmetic-rejuvenation",
        type: "peptide" as const,
        shortDescription: "A synergistic master blend of BPC-157, GHK-Cu, and TB-500.",
        description: "A synergistic master blend of BPC-157, GHK-Cu, and TB-500. Drives unprecedented cellular repair, collagen remodeling, and musculoskeletal recovery to enhance both function and aesthetic vitality. GHK-Cu significantly upregulates dermal elasticity and hair follicle strength, while BPC-157 and TB-500 orchestrate deep foundational recovery.",
        imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
        price: "349.00",
        duration: "4-6 Weeks",
        isActive: true,
      },
      {
        name: "Epithalon Telomere Expansion",
        slug: "epithalon-telomere-expansion",
        type: "peptide" as const,
        shortDescription: "A profound anti-aging bioregulator that stimulates telomerase production.",
        description: "A profound anti-aging synthetic bioregulator derived from the pineal gland that directly stimulates telomerase production. Actively lengthens chromosomal telomeres to slow cellular aging, optimize circadian rhythms, and protect against degenerative disease. Administered in 10-day intensive cycles every 6 months for monumental longevity gains.",
        imageUrl: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b",
        price: "399.00",
        duration: "10-Day Cycle",
        isActive: true,
      },
      {
        name: "TB-500 Systemic Recovery",
        slug: "tb-500-systemic-recovery",
        type: "peptide" as const,
        shortDescription: "Amplifies angiogenesis and vastly accelerates the healing of deep soft-tissue trauma.",
        description: "A specialized thymosin beta-4 synthetic fragment protocol. Amplifies angiogenesis, heavily reduces systemic inflammation, and vastly accelerates the healing of deep soft-tissue trauma. TB-500 is notably systemic, meaning it travels through the bloodstream to independently seek out micro-tears and connective tissue injuries regardless of injection site.",
        imageUrl: "https://images.unsplash.com/photo-1614935151651-0bea6508ad6b",
        price: "289.00",
        duration: "4-6 Weeks",
        isActive: true,
      },

      // PROTOCOL PROGRAMS
      {
        name: "Ozonated Glycerin Mega-Infusion",
        slug: "ozonated-glycerin-mega-infusion",
        type: "protocol" as const,
        shortDescription: "An advanced oxidative therapy for massive immune support and microbial eradication.",
        description: "An advanced, standalone oxidative therapy designed for massive immune support, deepest cellular detoxification, and powerful antimicrobial effects. Administered via sterile water macro-infusion running carefully over 2 to 4 hours. This hyper-oxygenates the bloodstream, eradicating anaerobic pathogens and forcing robust cellular metabolic shifts.",
        imageUrl: "https://images.unsplash.com/photo-1628595351029-c2c10dbd0e00",
        price: "499.00",
        duration: "2-4 hours",
        isActive: true,
      },
      {
        name: "Core Vitality Parasite Eradication",
        slug: "core-vitality-parasite-eradication",
        type: "protocol" as const,
        shortDescription: "A structured clearance pathway to eradicate systemic parasites and rebuild the gut.",
        description: "A structured clinical pathway utilizing targeted eradication agents to clear systemic parasites and rebuild the gastrointestinal microbiome. Blends profound anti-parasitic pharmaceutical interventions alongside binding agents to minimize die-off symptoms, ensuring a comprehensive foundational reset.",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
        price: "599.00",
        duration: "30-90 Days",
        isActive: true,
      },
      {
        name: "EDTA Heavy Metal Chelation",
        slug: "edta-heavy-metal-chelation",
        type: "protocol" as const,
        shortDescription: "A meticulously slow-drip therapy designed to bind and excrete toxic heavy metals.",
        description: "A meticulously slow-drip chelation therapy designed to bind and excrete toxic heavy metals (like lead and cadmium) from the bloodstream while powerfully supporting long-term cardiovascular health. Administered over 2 to 3 hours with a maximum dosage of 3,000mg, carefully monitored to maintain pristine mineral balances.",
        imageUrl: "https://images.unsplash.com/photo-1542438408-abb260104ef3",
        price: "350.00",
        duration: "2-3 hours",
        isActive: true,
      },
      {
        name: "Bio-Identical Hormone Optimization",
        slug: "bio-identical-hormone-optimization",
        type: "protocol" as const,
        shortDescription: "A comprehensive restorative cycle to precisely balance endocrine pathways.",
        description: "A comprehensive restorative cycle utilizing leading-edge diagnostics to precisely balance endocrine pathways, restoring metabolic vigor and youthful hormonal equilibrium. Evaluates deep baseline metrics to engineer a custom synthesis of testosterone, estrogen, or thyroid support for true biological age regression.",
        imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc",
        price: "899.00",
        duration: "Monthly",
        isActive: true,
      }
    ];

    await db.insert(programs).values(seedData);
    console.log("[Seed] Successfully seeded 12 premium clinical programs.");
  } catch (error) {
    console.error("[Seed] ERROR while seeding programs:", error);
  }
}
