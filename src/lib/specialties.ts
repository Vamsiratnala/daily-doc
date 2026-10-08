export type Specialty = {
  name: string;
  slug: string;
  icon: string;
  blurb: string;
  keywords: string[];
};

// Keyword lexicon used to map a patient's description of their problem to
// specialties. Includes a few common Hinglish/Telugu-English terms.
export const SPECIALTIES: Specialty[] = [
  {
    name: "General Physician",
    slug: "general-physician",
    icon: "🩺",
    blurb: "Fever, cold, infections and everyday health",
    keywords: ["fever", "cold", "cough", "flu", "weakness", "fatigue", "tired", "body pain", "infection", "viral", "dengue", "malaria", "typhoid", "bp", "blood pressure", "sugar", "diabetes", "checkup", "bukhar", "jwaram", "headache", "vomiting", "throat"],
  },
  {
    name: "Pediatrician",
    slug: "pediatrician",
    icon: "🧸",
    blurb: "Care for babies, children and teens",
    keywords: ["child", "baby", "kid", "infant", "newborn", "vaccination", "vaccine", "son", "daughter", "toddler", "growth", "bachcha"],
  },
  {
    name: "Dermatologist",
    slug: "dermatologist",
    icon: "✨",
    blurb: "Skin, hair and nail problems",
    keywords: ["skin", "rash", "acne", "pimple", "itch", "itching", "eczema", "psoriasis", "hair fall", "hair loss", "dandruff", "allergy", "fungal", "pigmentation", "nail", "mole"],
  },
  {
    name: "Cardiologist",
    slug: "cardiologist",
    icon: "❤️",
    blurb: "Heart health, chest pain and blood pressure",
    keywords: ["chest pain", "heart", "palpitation", "palpitations", "breathless", "hypertension", "cholesterol", "ecg", "heartbeat", "bp high", "blood pressure"],
  },
  {
    name: "Orthopedic",
    slug: "orthopedic",
    icon: "🦴",
    blurb: "Bones, joints, back and sports injuries",
    keywords: ["back pain", "knee", "joint", "fracture", "bone", "shoulder", "neck pain", "sprain", "arthritis", "spine", "ligament", "sports injury", "ankle", "kamar dard"],
  },
  {
    name: "Gynecologist",
    slug: "gynecologist",
    icon: "🌸",
    blurb: "Women's health, pregnancy and periods",
    keywords: ["period", "periods", "pregnancy", "pregnant", "pcos", "pcod", "menstrual", "fertility", "white discharge", "menopause", "uterus", "prenatal"],
  },
  {
    name: "ENT Specialist",
    slug: "ent",
    icon: "👂",
    blurb: "Ear, nose and throat",
    keywords: ["ear", "nose", "throat", "sinus", "tonsil", "tonsils", "hearing", "earache", "sore throat", "nasal", "snoring", "vertigo"],
  },
  {
    name: "Dentist",
    slug: "dentist",
    icon: "🦷",
    blurb: "Teeth, gums and oral care",
    keywords: ["tooth", "teeth", "toothache", "gum", "gums", "cavity", "dental", "braces", "root canal", "mouth ulcer", "bleeding gums", "wisdom tooth", "daant"],
  },
  {
    name: "Gastroenterologist",
    slug: "gastroenterologist",
    icon: "🫃",
    blurb: "Stomach, digestion and liver",
    keywords: ["stomach", "stomach pain", "acidity", "gas", "constipation", "diarrhea", "loose motion", "indigestion", "liver", "jaundice", "bloating", "ulcer", "pet dard", "vomiting"],
  },
  {
    name: "Psychiatrist",
    slug: "psychiatrist",
    icon: "🧠",
    blurb: "Mental health, stress, sleep and anxiety",
    keywords: ["anxiety", "depression", "stress", "sleep", "insomnia", "panic", "mood", "mental", "sad", "addiction", "ocd", "can't sleep"],
  },
  {
    name: "Ophthalmologist",
    slug: "ophthalmologist",
    icon: "👁️",
    blurb: "Eyes and vision",
    keywords: ["eye", "eyes", "vision", "blurry", "red eye", "cataract", "spectacles", "glasses", "watering eyes", "conjunctivitis", "eye pain"],
  },
  {
    name: "Neurologist",
    slug: "neurologist",
    icon: "⚡",
    blurb: "Migraine, seizures, nerves and brain",
    keywords: ["migraine", "seizure", "fits", "numbness", "tingling", "paralysis", "stroke", "tremor", "memory loss", "dizziness", "nerve"],
  },
];

export function specialtyBySlug(slug: string) {
  return SPECIALTIES.find((s) => s.slug === slug);
}

export function specialtyByName(name: string) {
  return SPECIALTIES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

/**
 * Scores each specialty against free text. Multi-word keywords count more
 * because they are more specific ("chest pain" beats "pain").
 * Returns a map of specialty name -> relevance in [0, 1].
 */
export function matchSpecialties(problem: string): Map<string, number> {
  const text = ` ${problem.toLowerCase().replace(/[^a-z0-9' ]+/g, " ")} `;
  const raw = new Map<string, number>();
  for (const s of SPECIALTIES) {
    let score = 0;
    for (const k of s.keywords) {
      if (text.includes(` ${k} `) || text.includes(` ${k}s `)) score += k.includes(" ") ? 2 : 1;
    }
    if (text.includes(` ${s.name.toLowerCase()} `)) score += 3;
    if (score > 0) raw.set(s.name, score);
  }
  const max = Math.max(0, ...raw.values());
  const out = new Map<string, number>();
  for (const [k, v] of raw) out.set(k, v / max);
  return out;
}
