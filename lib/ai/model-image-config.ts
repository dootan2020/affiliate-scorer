// Model image generation configuration: poses, niche styles, prompt builder

export const POSE_TYPES = [
  "hero_fullbody",
  "portrait",
  "reaction_wow",
  "reaction_thinking",
  "cta_pointing",
  "closeup_product",
  "lifestyle",
  "fullbody_outro",
] as const;

export type PoseType = (typeof POSE_TYPES)[number];

export interface PoseDefinition {
  type: PoseType;
  label: string; // Vietnamese
  aspectRatio: "9:16" | "1:1" | "16:9";
  poseInstruction: string;
  isHero?: boolean; // hero = no reference needed
}

export const POSES: PoseDefinition[] = [
  {
    type: "hero_fullbody",
    label: "Chân dung chính",
    aspectRatio: "9:16",
    poseInstruction: "Standing confidently with relaxed posture, hands clasped gently in front, full body shot, clean studio white background",
    isHero: true,
  },
  {
    type: "portrait",
    label: "Chân dung cận",
    aspectRatio: "9:16",
    poseInstruction: "Close-up portrait from chest up, looking directly at camera, gentle warm smile, soft studio lighting, white background",
  },
  {
    type: "reaction_wow",
    label: "Phản ứng ngạc nhiên",
    aspectRatio: "9:16",
    poseInstruction: "Waist-up shot, surprised happy expression, mouth slightly open, eyes wide with excitement, one hand near cheek, bright studio lighting, white background",
  },
  {
    type: "reaction_thinking",
    label: "Suy nghĩ",
    aspectRatio: "9:16",
    poseInstruction: "Waist-up shot, thoughtful expression, one hand touching chin, slightly tilted head, looking slightly up, studio lighting, white background",
  },
  {
    type: "cta_pointing",
    label: "Kêu gọi hành động",
    aspectRatio: "9:16",
    poseInstruction: "Waist-up shot, confident smile, one hand pointing down (as if pointing to a link below), engaging eye contact with camera, studio lighting, white background",
  },
  {
    type: "closeup_product",
    label: "Cầm sản phẩm",
    aspectRatio: "1:1",
    poseInstruction: "Close-up of face and hands, holding a product near face, gentle smile, soft focus background",
  },
  {
    type: "lifestyle",
    label: "Lifestyle",
    aspectRatio: "16:9",
    poseInstruction: "Sitting comfortably, relaxed natural pose, holding a cup, warm genuine smile, looking at camera",
  },
  {
    type: "fullbody_outro",
    label: "Outro",
    aspectRatio: "9:16",
    poseInstruction: "Full body shot, standing with confident pose, one hand waving gently, warm friendly smile, studio white background",
  },
];

// ─── Niche Style Config ───

interface NicheStyle {
  gender: string;
  ageRange: string;
  skinTone: string;
  hair: string;
  outfit: string;
  environment: string;
  props: string;
  lighting: string;
}

const NICHE_STYLES: Record<string, NicheStyle> = {
  beauty_skincare: {
    gender: "woman",
    ageRange: "24 years old",
    skinTone: "bright smooth",
    hair: "long straight black hair past shoulders",
    outfit: "clean white t-shirt",
    environment: "bright bathroom vanity with soft natural daylight",
    props: "skincare bottle",
    lighting: "soft diffused studio lighting",
  },
  home_living: {
    gender: "woman",
    ageRange: "30 years old",
    skinTone: "warm natural",
    hair: "medium-length black hair, softly layered",
    outfit: "casual linen top and comfortable pants",
    environment: "modern bright living room with plants",
    props: "kitchen gadget",
    lighting: "warm natural window lighting",
  },
  fashion: {
    gender: "woman",
    ageRange: "25 years old",
    skinTone: "clear smooth",
    hair: "long styled black hair with subtle waves",
    outfit: "trendy casual outfit, layered top",
    environment: "minimalist studio or urban street background",
    props: "handbag or accessories",
    lighting: "bright fashion photography lighting",
  },
  health: {
    gender: "woman",
    ageRange: "28 years old",
    skinTone: "healthy glowing",
    hair: "black hair in a neat ponytail",
    outfit: "clean sporty athleisure top",
    environment: "bright gym or outdoor park setting",
    props: "water bottle or yoga mat",
    lighting: "bright natural daylight",
  },
  food: {
    gender: "woman",
    ageRange: "28 years old",
    skinTone: "warm natural",
    hair: "black hair tied back neatly",
    outfit: "casual top with a clean apron",
    environment: "modern bright kitchen with wooden countertops",
    props: "cooking utensil or food plate",
    lighting: "warm kitchen overhead lighting",
  },
  tech: {
    gender: "woman",
    ageRange: "27 years old",
    skinTone: "clear natural",
    hair: "shoulder-length straight black hair",
    outfit: "smart casual blouse",
    environment: "minimal desk setup with monitor and plants",
    props: "smartphone or earbuds",
    lighting: "cool balanced desk lighting",
  },
};

const DEFAULT_STYLE: NicheStyle = {
  gender: "woman",
  ageRange: "25 years old",
  skinTone: "bright natural",
  hair: "long straight black hair",
  outfit: "clean white t-shirt and light blue jeans",
  environment: "clean studio white background",
  props: "product",
  lighting: "soft professional studio lighting",
};

function normalizeKey(niche: string): string {
  return niche.toLowerCase().replace(/\s*&\s*/g, "_").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function getNicheStyle(niche: string): NicheStyle {
  return NICHE_STYLES[normalizeKey(niche)] ?? DEFAULT_STYLE;
}

// ─── Prompt Builder ───

export function buildPrompt(pose: PoseDefinition, niche: string, isReference: boolean): string {
  const s = getNicheStyle(niche);

  const identityLock = isReference
    ? "STRICT identity lock: Keep EXACT same face, hair, skin tone, age as the reference image. PRESERVE IDENTITY EXACTLY."
    : "";

  const refPrefix = isReference
    ? "Generate an image of the EXACT same person from the reference image. "
    : "";

  // For lifestyle/closeup poses, use niche-specific environment
  const useNicheEnv = pose.type === "lifestyle" || pose.type === "closeup_product";
  const envOverride = useNicheEnv ? s.environment : "";
  const propsOverride = pose.type === "closeup_product" ? s.props : "";

  // Inject props into closeup instruction
  let poseInstr = pose.poseInstruction;
  if (propsOverride && pose.type === "closeup_product") {
    poseInstr = poseInstr.replace("a product", `a ${propsOverride}`);
  }
  if (envOverride && pose.type === "lifestyle") {
    poseInstr = poseInstr.replace("holding a cup", `in ${s.environment}`);
  }

  return [
    refPrefix,
    `A Vietnamese ${s.gender}, ${s.ageRange}, ${s.skinTone} skin, natural minimal makeup, ${s.hair}.`,
    `Wearing ${s.outfit}.`,
    poseInstr + ".",
    `Style: Professional photography, ${s.lighting}, Canon EOS R5, 8K quality.`,
    identityLock,
  ].filter(Boolean).join(" ");
}
