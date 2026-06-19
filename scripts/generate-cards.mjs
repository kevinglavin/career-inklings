// Inklings card-art generator.
// Generates clean, UI-free occupation character art via the OpenAI image API
// and writes correctly-named PNGs straight into the right pack folder.
//
// Usage:
//   node scripts/generate-cards.mjs <pack> <id|all> [more ids...]
// Examples:
//   node scripts/generate-cards.mjs minecraft i1        # one card (test)
//   node scripts/generate-cards.mjs minecraft all       # whole pack
//   node scripts/generate-cards.mjs minecraft r1 r2 r3  # a few cards
//
// API key: prefer the OPENAI_API_KEY environment variable (recommended — keeps the secret
// out of any file in this Dropbox-synced folder); falls back to .env.local if not set.
// Optional env: QUALITY=low|medium|high (default medium), CONCURRENCY=3

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---- Load API key from .env.local ----
function loadEnv() {
  const env = {};
  try {
    const text = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch { /* ignore */ }
  return env;
}
const ENV = loadEnv();
// Environment variable wins; .env.local is only a fallback.
const API_KEY = process.env.OPENAI_API_KEY || ENV.OPENAI_API_KEY;
if (!API_KEY || API_KEY === 'PLACEHOLDER_API_KEY') {
  console.error('No OPENAI_API_KEY found. Set it as an environment variable (recommended) or in .env.local'); process.exit(1);
}
const QUALITY = process.env.QUALITY || 'medium';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3', 10);

// ---- Pack styles (from the master brief) ----
const PACK_STYLES = {
  anime: 'high-quality Japanese anime style: clean linework, cel shading, expressive faces, vibrant colors, dynamic but readable poses, modern anime aesthetic',
  minecraft: 'a colorful low-poly voxel art style: original characters and simple scenery built from cubic blocks with clean flat-shaded textures, bright and playful. An original generic voxel look — do NOT replicate any specific game; avoid signature grass-block ground, dirt textures, mobs, or recognizable franchise elements',
  pokemon: 'a polished, detailed, big-eyed anime / digital illustration style: vibrant saturated colors, expressive friendly character, crisp clean rendering, appealing and cute',
  roblox: 'a chunky blocky toy-figure style: original characters built from smooth rounded plastic-like blocks with friendly minimal features and bright colors, like collectible toy figurines. An original generic blocky-toy look — do NOT replicate any specific game avatar, its default face, or recognizable franchise elements',
  'league-of-legends': 'a painterly splash-art-inspired style: high-detail digital illustration, dramatic lighting, a rich jewel-toned palette, dynamic heroic poses, ornate stylized costuming reimagined for the occupation. Completely original — no franchise champions or named characters',
  'career-hero': "a polished 3D 'hero' render like a premium video-game character: dramatic cinematic rim lighting, glossy high-detail surfaces, vibrant colors with blue, orange and teal accents, clean, confident and aspirational, slightly stylized heroic proportions",
  fortnite: 'a high-detail, polished AAA 3D hero-shooter character render (like a modern team-based hero shooter): a dynamic, energetic action pose, vibrant saturated colors, rich material and gear detail, stylized-realistic proportions and expressive heroic faces, cinematic and epic but bright and colorful. Completely original — no franchise skins or characters',
};
const PACK_FOLDERS = {
  anime: 'Anime', minecraft: 'Minecraft', pokemon: 'Pokemon', roblox: 'Roblox',
  'league-of-legends': 'League of Legends', 'career-hero': 'Career Hero', fortnite: 'Fortnite Characters',
};

// ---- The 60 occupations + diversity matrix ----
// `scene` = wardrobe/props/setting (from the brief). `who` = a deliberate,
// counter-stereotyped demographic so the deck represents diverse people.
const OCCUPATIONS = [
  // REALISTIC
  { id: 'r1',  file: 'r-chef.png',                title: 'chef',               scene: "wearing chef's whites and a toque, holding a pan or chef's knife, in a professional kitchen", who: 'a Black woman in her 30s' },
  { id: 'r2',  file: 'r-firefighter.png',         title: 'firefighter',        scene: 'wearing turnout gear and a helmet, carrying a hose or axe, by a fire engine or station', who: 'a Latina woman with an athletic build' },
  { id: 'r3',  file: 'r-park-naturalist.png',     title: 'park naturalist',    scene: 'wearing a ranger uniform and hat, binoculars around the neck, in a forest or park', who: 'a man with light brown skin who uses a forearm crutch' },
  { id: 'r4',  file: 'r-pilot.png',               title: 'airline pilot',      scene: 'wearing a pilot uniform with cap, holding a flight headset, by a cockpit or on the tarmac', who: 'a South Asian woman wearing a hijab' },
  { id: 'r5',  file: 'r-police-officer.png',      title: 'police officer',     scene: 'wearing a duty uniform with badge and radio, confident stance, on a city street', who: 'an East Asian man in his 40s' },
  { id: 'r6',  file: 'r-truck-driver.png',        title: 'truck driver',       scene: 'wearing a work jacket, cap and gloves, standing by a truck cab on a highway or loading dock', who: 'a white woman in her 50s' },
  { id: 'r7',  file: 'r_carpenter.png',           title: 'carpenter',          scene: 'wearing a work apron with safety glasses on the head and a tool belt, holding a tape measure or saw, in a workshop', who: 'a woman with dark brown skin and locs' },
  { id: 'r8',  file: 'r_electrician.png',         title: 'electrician',        scene: 'wearing work coveralls and a hard hat, carrying wire strippers or a multimeter, by an electrical panel', who: 'a Middle Eastern man' },
  { id: 'r9',  file: 'r_farmer.png',              title: 'farmer',             scene: 'wearing overalls, work boots and a straw hat, holding produce or near farm equipment, in a field', who: 'an older Indigenous (Native American) man' },
  { id: 'r10', file: 'r_mechanic.png',            title: 'auto mechanic',      scene: 'wearing grease-marked coveralls, holding a wrench, by an open car hood in a garage', who: 'a Black woman with short natural hair' },
  // INVESTIGATIVE
  { id: 'i1',  file: 'i-biologist.png',           title: 'biologist',          scene: 'wearing a lab coat with goggles on the forehead, holding a specimen jar or microscope slide, in a laboratory', who: 'a young woman with dark brown skin and curly hair' },
  { id: 'i2',  file: 'i-chemist.png',             title: 'chemist',            scene: 'wearing a lab coat and splash goggles, holding a beaker or flask, in a chemistry lab', who: 'a Southeast Asian man with a prosthetic right hand' },
  { id: 'i3',  file: 'i-computer_programmer.png', title: 'computer programmer',scene: 'wearing a casual hoodie or t-shirt with headphones around the neck, holding a laptop, at a desk with monitors', who: 'a Latino man with a larger build' },
  { id: 'i4',  file: 'i-economist.png',           title: 'economist',          scene: 'wearing business casual with glasses, holding charts or a tablet with graphs, in an office', who: 'a Black man in his 50s with gray hair' },
  { id: 'i5',  file: 'i-geologist.png',           title: 'geologist',          scene: 'wearing a field vest and hiking boots, holding a rock hammer and rock sample, in a rocky landscape', who: 'a South Asian woman' },
  { id: 'i6',  file: 'i-mathematician.png',       title: 'mathematician',      scene: 'wearing smart casual with a sweater, holding chalk or a marker, by a chalkboard with equations', who: 'a young East Asian woman' },
  { id: 'i7',  file: 'i-medical-scientist.png',   title: 'medical scientist',  scene: 'wearing a lab coat and gloves, working with test tubes or a microscope, in a research lab', who: 'a Middle Eastern woman wearing a hijab' },
  { id: 'i8',  file: 'i-pharmacist.png',          title: 'pharmacist',         scene: 'wearing a white pharmacist coat, holding a prescription bottle, by pharmacy shelves', who: 'a Black man' },
  { id: 'i9',  file: 'i-psychologist.png',        title: 'psychologist',       scene: 'wearing professional but approachable clothing, holding a notepad and pen, in a comfortable therapy room', who: 'a white man wearing a hearing aid' },
  { id: 'i10', file: 'i_doctor.png',              title: 'doctor',             scene: 'wearing a white coat with stethoscope, holding a medical chart, in a hospital or clinic', who: 'a Latina woman' },
  // ARTISTIC
  { id: 'a1',  file: 'a-actor.png',               title: 'stage actor',        scene: 'wearing a theatrical costume, in an expressive pose, on a stage with a spotlight', who: 'a Black man' },
  { id: 'a2',  file: 'a-art-teacher.png',         title: 'art teacher',        scene: 'wearing a paint-splattered apron, holding brushes and a palette, in an art classroom with easels', who: 'a non-binary person with androgynous presentation, light skin and colorful hair' },
  { id: 'a3',  file: 'a-dancer.png',              title: 'dancer',             scene: 'wearing dance attire, in a dynamic dance pose, in a dance studio with mirrors', who: 'an East Asian man' },
  { id: 'a4',  file: 'a-fashion-designer.png',    title: 'fashion designer',   scene: 'wearing a stylish outfit, holding fabric swatches or sketching on a pad, in a design studio with mannequins', who: 'a South Asian man' },
  { id: 'a5',  file: 'a-film-director.png',       title: 'film director',      scene: "holding a megaphone or clapperboard, on a film set with camera equipment", who: 'a woman with light brown skin who uses a wheelchair' },
  { id: 'a6',  file: 'a-graphic-designer.png',    title: 'graphic designer',   scene: 'wearing trendy casual clothes, holding a drawing tablet and stylus, in a design studio with screens', who: 'a young white woman' },
  { id: 'a7',  file: 'a-interior-designer.png',   title: 'interior designer',  scene: 'wearing a chic professional outfit, holding color swatches and floor plans, in a stylish room', who: 'a Black man' },
  { id: 'a8',  file: 'a-musician.png',            title: 'musician',           scene: 'wearing a stage outfit, holding a guitar or at a microphone, in a music studio or stage', who: 'a Latina woman' },
  { id: 'a9',  file: 'a-photographer.png',        title: 'photographer',       scene: 'wearing a vest with pockets, a camera around the neck and holding a second camera, in an outdoor scenic setting', who: 'an older white woman' },
  { id: 'a10', file: 'a-writer.png',              title: 'writer',             scene: 'wearing cozy casual clothes, holding a journal and pen, in a library or writing nook', who: 'a Middle Eastern man' },
  // SOCIAL
  { id: 's1',  file: 's-counselor.png',                     title: 'school counselor',            scene: 'wearing professional but warm clothing, holding a clipboard, in a school office with posters', who: 'a Latino man' },
  { id: 's2',  file: 's-physical-therapist.png',            title: 'physical therapist',          scene: 'wearing scrubs or athletic wear, holding exercise bands or a therapy ball, in a rehab gym', who: 'an athletic Black woman' },
  { id: 's3',  file: 's-social-worker.png',                 title: 'social worker',               scene: 'wearing professional casual clothing, carrying a folder or briefcase, at a community center', who: 'an East Asian man' },
  { id: 's4',  file: 's-speech-language-pathologist.png',   title: 'speech-language pathologist', scene: 'wearing professional clothing, holding speech therapy cards, in a therapy room', who: 'a young white woman' },
  { id: 's5',  file: 's-rehabilitation-counselor.png',      title: 'rehabilitation counselor',    scene: 'wearing business casual with a warm expression, holding a tablet, in a welcoming office', who: 'a South Asian woman who uses a wheelchair' },
  { id: 's6',  file: 's-nurse.png',                         title: 'registered nurse',            scene: 'wearing scrubs with a stethoscope, holding a medical chart, in a hospital ward', who: 'a Black man' },
  { id: 's7',  file: 's-teacher.png',                       title: 'elementary school teacher',   scene: 'wearing cheerful professional clothes, holding a picture book or apple, in a colorful classroom', who: 'a Middle Eastern man' },
  { id: 's8',  file: 's-childcare-worker.png',              title: 'childcare worker',            scene: 'wearing comfortable casual clothes, holding toys or craft supplies, in a daycare or playroom', who: 'a young white man' },
  { id: 's9',  file: 's-occupational-therapist.png',        title: 'occupational therapist',      scene: 'wearing scrubs or professional clothes, holding adaptive equipment, in a therapy room', who: 'a Latina woman' },
  { id: 's10', file: 's-clergy.png',                        title: 'member of the clergy',        scene: 'wearing simple non-denominational clerical vestments, holding a book, in a community setting', who: 'an East Asian woman' },
  // ENTERPRISING
  { id: 'e1',  file: 'e-business-executive.png',          title: 'business executive',         scene: 'wearing a sharp suit, confident stance, holding a briefcase, in a corporate office with a city view', who: 'a Black woman' },
  { id: 'e2',  file: 'e-sales-manager.png',              title: 'sales manager',              scene: 'wearing business attire, energetic pose, holding a tablet or clicker, on a sales floor', who: 'a South Asian man' },
  { id: 'e3',  file: 'e-lawyer.png',                     title: 'lawyer',                     scene: 'wearing a suit, carrying a legal briefcase and holding documents, on courthouse steps or in a law office', who: 'a woman wearing a hijab' },
  { id: 'e4',  file: 'e-entrepreneur.png',              title: 'entrepreneur',               scene: 'wearing smart casual, energetic stance, holding a phone and coffee, in a startup office', who: 'a young Latino man' },
  { id: 'e5',  file: 'e-financial-advisor.png',         title: 'financial advisor',          scene: 'wearing business professional attire, holding financial charts, in a clean modern office', who: 'an East Asian woman' },
  { id: 'e6',  file: 'e-public-relations-specialist.png',title: 'public relations specialist',scene: 'wearing polished business attire, holding a phone and press folder, by an event or media backdrop', who: 'a Black man' },
  { id: 'e7',  file: 'e-car-salesperson.png',           title: 'car salesperson',            scene: 'wearing a dealership blazer with a blank name badge, gesturing toward a car, in a showroom', who: 'a white woman' },
  { id: 'e8',  file: 'e-motivational-speaker.png',      title: 'motivational speaker',       scene: 'wearing a sharp outfit with a wireless mic headset, confident speaking pose, on a stage with audience silhouettes', who: 'a man with a prosthetic leg' },
  { id: 'e9',  file: 'e-politician.png',                title: 'politician',                 scene: 'wearing a formal suit with a plain lapel pin, confident gesture at a podium, by flags or a government building', who: 'an Indigenous woman' },
  { id: 'e10', file: 'e-property-manager.png',          title: 'property manager',           scene: 'wearing business casual, holding keys and a clipboard, by an apartment or property exterior', who: 'an older Middle Eastern man' },
  // CONVENTIONAL
  { id: 'c1',  file: 'c-accountant.png',                title: 'accountant',                 scene: 'wearing business attire with glasses, holding a ledger or calculator, at an office desk with documents', who: 'a Black man with glasses' },
  { id: 'c2',  file: 'c-financial-analyst.png',         title: 'financial analyst',          scene: 'wearing business professional attire, holding a tablet with charts, in a modern office with screens', who: 'a South Asian woman' },
  { id: 'c3',  file: 'c-paralegal.png',                 title: 'paralegal',                  scene: 'wearing business casual, carrying legal files and a laptop, in a law office with bookshelves', who: 'a Latino man' },
  { id: 'c4',  file: 'c-medical-records-technician.png',title: 'medical records technician', scene: 'wearing professional attire or light scrubs, at a computer with records, in a medical office', who: 'a white woman with a larger build who uses a wheelchair' },
  { id: 'c5',  file: 'c-court-clerk.png',               title: 'court clerk',                scene: 'wearing professional attire, holding legal documents with a gavel nearby, in a courtroom', who: 'an older East Asian man' },
  { id: 'c6',  file: 'c-loan-officer.png',              title: 'loan officer',               scene: 'wearing business professional attire, at a desk reviewing documents, in a bank office', who: 'a Black woman' },
  { id: 'c7',  file: 'c-office-administration.png',     title: 'office administrator',       scene: 'wearing smart business casual, holding a planner or organizing files, in a busy office', who: 'a man with light brown skin' },
  { id: 'c8',  file: 'c-tax-preparer.png',             title: 'tax preparer',               scene: 'wearing business casual with glasses, surrounded by documents and a calculator, in a neat office', who: 'an older white man with glasses' },
  { id: 'c9',  file: 'c-payroll-clerk.png',            title: 'payroll clerk',              scene: 'wearing office attire, at a computer with spreadsheets visible, in an office cubicle', who: 'a Southeast Asian woman' },
  { id: 'c10', file: 'c-librarian.png',                title: 'librarian',                  scene: 'wearing smart casual with glasses, holding a stack of books, in a library with tall bookshelves', who: 'a man with brown skin and glasses' },
];

// Packs whose subject is an original creature mascot (not a human).
const CREATURE_PACKS = new Set(['pokemon']);
// Packs that get a high-detail, bright, dynamic AAA "hero-shooter" look.
const HERO_PACKS = new Set(['fortnite']);
const CREATURE_TYPES = ['fox-like', 'cat-like', 'round dragon-like', 'bunny-like', 'frog-like', 'owl-like', 'bear-cub-like', 'lizard-like', 'red-panda-like', 'otter-like', 'hedgehog-like', 'axolotl-like'];
const CREATURE_COLORS = ['teal and lime', 'soft purple and pink', 'warm orange and cream', 'sky blue and lemon', 'mossy green and gold', 'coral and white', 'lavender and mint', 'sunny yellow and chestnut', 'aqua and magenta', 'peach and turquoise', 'rose and cream', 'indigo and sky blue'];

function subjectFor(occ, packId, index) {
  if (CREATURE_PACKS.has(packId)) {
    const t = CREATURE_TYPES[index % CREATURE_TYPES.length];
    const c = CREATURE_COLORS[(index * 5 + 2) % CREATURE_COLORS.length];
    return `an original cute made-up creature mascot — a ${c} ${t} critter with big expressive eyes, a friendly fantasy monster that is NOT a human and does NOT resemble any existing video game, anime, or franchise creature`;
  }
  return occ.who;
}

// "3D Heroes" pack — premium original hero-skin key art (per the user's detailed brief).
function buildHeroPrompt(occ, who) {
  return [
    `Create an original full-body stylized 3D hero character based on a ${occ.title}, designed like cinematic promotional key art for a modern action-adventure game — a PREMIUM ORIGINAL PLAYABLE HERO SKIN, NOT a person wearing an upgraded work uniform. The character is ${who}.`,
    `Premium playable avatar / collectible action figure: heroic, polished proportions — broad shoulders, athletic build, long legs, oversized custom gloves and boots, a strong bold readable silhouette. An expressive face with a warm, genuine, HAPPY SMILE — friendly, likeable, upbeat, approachable and cool. Confident and aspirational, but NEVER serious, stern, smug, intimidating, scary, dangerous, angry, or mischievous.`,
    `Take recognizable ${occ.title} clothing (${occ.scene}) and REMIX it into a fashion-forward, layered, memorable hero-class costume: ASYMMETRICAL custom gear and harness, tactical straps, utility pouches, protective gear, profession-specific tools clipped neatly onto the belt and gear (not held like weapons), a bold original graphic emblem (an abstract symbol or icon shape — NEVER letters, numbers or words), and a controlled color palette built around ONE dominant accent color. Designed and iconic — not a literal, symmetrical work uniform.`,
    `Give the character ONE friendly signature prop — the profession's real tool — used to happily DO the job, creating cheerful motion and spectacle, frozen mid-action. The effect MUST accurately fit the profession and never misrepresent it: a firefighter sprays a friendly arc of blue-white water and mist (absolutely NO fire or flames anywhere); a chef happily tosses colorful food, sauce and sparks from the pan. NEVER a weapon, NEVER a blade or tool pointed at anyone, nothing menacing or dangerous.`,
    `Pose: a fun, dynamic, upbeat full-body stance, low-angle camera looking slightly upward, character centered and dominant, one hand on the signature prop; a detailed but blurred profession-related background, shallow depth of field, so the character stays the focus.`,
    `Visual style: polished stylized 3D high-quality game-character KEY-ART render, clean shapes, bright saturated colors with strong controlled accents, cheerful cinematic lighting, crisp rim light, soft global illumination, glossy-but-textured materials (subtle fabric, brushed metal, leather/plastic gear, light wear). Vertical poster format, full body head to toe, not cropped.`,
    `Mood: cheerful, friendly, fun, warm, energetic, aspirational and heroic — NOT serious, stern, dark, edgy, gritty, threatening, or dangerous; NOT a realistic photo, flat 2D cartoon, or soft children's-movie look.`,
    `Completely original and brand-safe: no text, logos, watermarks, recognizable characters, copied outfits, franchise objects, weapons, knives or blades held in hand, aggressive poses, or scary/angry/stern expressions; no imitation of any existing game. Avoid distorted hands, tiny feet, cluttered background, dull or muddy colors.`,
  ].join(' ');
}

function buildPrompt(style, occ, packId, index) {
  const who = subjectFor(occ, packId, index);
  if (HERO_PACKS.has(packId)) return buildHeroPrompt(occ, who);
  return [
    `An original career-exploration character illustration in ${style}.`,
    `The character is ${who}, shown as a friendly, approachable ${occ.title}, ${occ.scene}.`,
    `One single full-body character only, centered, shown head to toe with no cropped body parts, filling most of the frame, with a simple occupation-appropriate background.`,
    `Bright, vibrant and cheerful, with soft even lighting and rich saturated colors — never dark, dim, gloomy or moody; keep the whole scene well-lit even for stages or labs. Subtle warm rim lighting, polished high-quality render, aspirational and appealing to teenagers.`,
    `Absolutely no text, words, letters, numbers, labels, logos, watermarks, signatures, borders, or user-interface elements anywhere in the image.`,
  ].join(' ');
}

async function generateImage(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: QUALITY, n: 1 }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`OpenAI ${res.status}: ${body.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return Buffer.from(data.data[0].b64_json, 'base64');
}

async function withRetry(fn, tries = 4) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (e.status && ![429, 500, 502, 503, 504].includes(e.status)) throw e;
      const wait = 3000 * (i + 1);
      console.warn(`  retry in ${wait}ms (${e.status || e.message})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function runPool(items, worker, concurrency) {
  let idx = 0;
  async function next() {
    const i = idx++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
}

// Default order when generating every pack (run with: all-packs).
const ALL_PACKS = ['minecraft', 'anime', 'pokemon', 'roblox', 'league-of-legends', 'career-hero', 'fortnite'];
const SKIP_EXISTING = process.env.FORCE !== '1'; // resumable by default; FORCE=1 regenerates

async function generatePack(pack, idArgs) {
  const style = PACK_STYLES[pack];
  const folderName = PACK_FOLDERS[pack];
  if (!style || !folderName) {
    console.error(`Unknown pack "${pack}". Options: ${Object.keys(PACK_STYLES).join(', ')}`);
    return { ok: 0, fail: 0, skip: 0 };
  }
  const wantAll = idArgs.length === 0 || idArgs[0] === 'all';
  const targets = wantAll ? OCCUPATIONS : OCCUPATIONS.filter(o => idArgs.includes(o.id));

  const outDir = join(ROOT, 'public', 'images', 'occupations', folderName);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n=== Pack: ${pack} (${folderName}) | ${targets.length} target(s) | quality=${QUALITY} | concurrency=${CONCURRENCY} ===`);
  let ok = 0, fail = 0, skip = 0;
  await runPool(targets, async (occ) => {
    const outPath = join(outDir, occ.file);
    if (SKIP_EXISTING && existsSync(outPath)) { skip++; console.log(`  • skip ${occ.id.padEnd(4)} ${occ.file} (exists)`); return; }
    try {
      const buf = await withRetry(() => generateImage(buildPrompt(style, occ, pack, OCCUPATIONS.indexOf(occ))));
      writeFileSync(outPath, buf);
      ok++;
      console.log(`  ✓ ${occ.id.padEnd(4)} ${occ.file}  (${occ.who})`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${occ.id.padEnd(4)} ${occ.file}  -> ${e.message}`);
    }
  }, CONCURRENCY);
  console.log(`--- ${pack}: ${ok} generated, ${skip} skipped, ${fail} failed ---`);
  return { ok, fail, skip };
}

async function main() {
  const [, , packArg, ...idArgs] = process.argv;
  if (!packArg) { console.error(`Usage: node scripts/generate-cards.mjs <pack|all-packs> [id|all ...]`); process.exit(1); }
  const packs = packArg === 'all-packs' ? ALL_PACKS : [packArg];
  const totals = { ok: 0, fail: 0, skip: 0 };
  for (const p of packs) {
    const r = await generatePack(p, idArgs);
    totals.ok += r.ok; totals.fail += r.fail; totals.skip += r.skip;
  }
  console.log(`\n===== TOTAL: ${totals.ok} generated, ${totals.skip} skipped, ${totals.fail} failed across ${packs.length} pack(s) =====`);
}

main();
