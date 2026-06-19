# Inklings (CareerSwipe): Card Generation Master Brief

This supersedes the earlier brief. It covers every character pack, the full 60-card list with filenames verified against the live `constants.ts`, a ready-to-run prompt template, a style preamble for each pack, the 10 occupation batches, and an honest split of which tool does what.

---

## 0. Read this first: what actually generates the images

Claude, including the desktop app, does not generate 3D or painterly raster character art. It produces SVG, HTML, and diagrams. It has no DALL-E equivalent. The existing Fortnite pack was produced in ChatGPT with DALL-E, and that is the proven path.

So:

- The per-pack prompts in sections 4 and 5 go into an **image generator** (ChatGPT with DALL-E, or a comparable text-to-image tool). They do not go into Claude expecting Claude to draw them.
- What **Claude Desktop** can usefully do in this project is in section 6: audit each pack folder against the master file list, rename and place image files that already exist in Dropbox, and review the app. It cannot create the image pixels.

If you point Claude Desktop at these prompts expecting finished cards back, you will not get usable output. Use an image generator for the drawing, and Claude Desktop for the file work and review.

A second practical limit, learned from the Fortnite run: a single image generator reliably produces about 6 images per request. Asking for 60 in one uninterrupted pass, let alone 360 across six packs, tends to fail or collapse into a grid. **Batches of 6 are the working unit.** The prompts below use aggressive "do not stop, do not ask" language, which reduces interruptions but will not fully eliminate the need to start each batch.

---

## 1. Project context

CareerSwipe, rebranding to **Inklings** (`inklings.createyourwhy.com`), is a swipe-based career exploration prototype for teenagers, built on Holland's RIASEC model and linked to O*NET. The user swipes through 60 occupation cards and receives a three-letter Holland Code plus a radar chart. It is a proof of concept, not a validated assessment. That framing should not be softened.

Full code-level detail lives in the project file `PROJECT_HANDOVER.md` (React 19 / Vite, TypeScript, Tailwind, Framer Motion, IndexedDB plus localStorage, html2canvas plus jspdf, recharts). Where that file disagrees with this brief, this brief is current.

- Source root: `C:\Users\kevin\Dropbox\Claude\career-swipe-app`
- Deploy from PowerShell: `netlify deploy --prod --dir=dist`
- Live app to review and test: `https://careerswipe.netlify.app/`

---

## 2. Packs and folders

Each pack is a subfolder of `public/images/occupations`. **Every pack uses the same 60 filenames** (section 3). The app swaps packs by changing the subfolder in the image path, so only the artwork differs between packs, not the filenames.

Existing pack folders (exact names, confirmed in Dropbox):

- `Career Hero`
- `Anime`
- `Fortnite Characters`  (note: not "Fortnite". Has a space.)
- `Minecraft`
- `Pokemon`
- `Roblox`
- `New folder`  (created today, empty. Rename it to `League of Legends` for the new pack.)

Two of these folder names contain spaces (`Career Hero`, `Fortnite Characters`). Whatever pack-selector code references them must use the exact names, and spaces must be URL-encoded in the served paths.

Packs you asked to create: **Pokemon, Roblox, Anime, Minecraft, League of Legends, and Career Hero.** That is 6 packs at 60 cards each, 360 images. Fortnite is the one already worked through, so it is excluded. Career Hero is included because it was one of the original pack names you suggested; its folder already exists, so audit it before generating in case it is partly done.

Paths for Claude Desktop using the Dropbox connector use the `/Claude/...` form, not the Windows prefix:
`/Claude/career-swipe-app/public/images/occupations/<Pack Name>/`

---

## 3. Shared card specification

These apply to every card in every pack.

Technical:
- PNG, 1024 x 1536 pixels, 2:3 vertical portrait, high quality.

Composition:
- One full-body character only, centered, shown head to toe, no cropped body parts.
- Character fills most of the frame with some breathing room.
- Simple background that supports the occupation without distracting.

Content rules:
- No text, labels, titles, logos, watermarks, borders, or UI elements.
- Characters must be completely original. No copyrighted franchise characters, skins, champions, creatures, or studio assets (see section 7).

Anti-grid and continuous-run language (already folded into the batches):
- "Generate 6 separate images, each its own individual PNG file. Do NOT combine them into a grid, collage, or composite. Generate them one at a time as 6 separate outputs. Generate all 6 one after another without stopping, do not ask for confirmation between images, and do not pause to ask whether to continue."

### Naming convention and the full 60-card filename list

Pattern: `{riasec-letter}-{occupation-slug}.png`, kebab-case. Several existing filenames break that pattern. **Keep them exactly as written below.** If a filename does not match the `imageUrl` already stored in `constants.ts`, the app will not load that card. Anomalies are flagged.

Realistic (R)
- Chef -> `r-chef.png`
- Firefighter -> `r-firefighter.png`
- Park Naturalist -> `r-park-naturalist.png`
- Pilot -> `r-pilot.png`
- Police Officer -> `r-police-officer.png`
- Truck Driver -> `r-truck-driver.png`
- Carpenter -> `r_carpenter.png`  (underscore, not hyphen)
- Electrician -> `r_electrician.png`  (underscore)
- Farmer -> `r_farmer.png`  (underscore)
- Mechanic -> `r_mechanic.png`  (underscore)

Investigative (I)
- Biologist -> `i-biologist.png`
- Chemist -> `i-chemist.png`
- Computer Programmer -> `i-computer_programmer.png`  (hyphen then underscore)
- Economist -> `i-economist.png`
- Geologist -> `i-geologist.png`
- Mathematician -> `i-mathematician.png`
- Medical Scientist -> `i-medical-scientist.png`
- Pharmacist -> `i-pharmacist.png`
- Psychologist -> `i-psychologist.png`
- Doctor -> `i_doctor.png`  (underscore)

Artistic (A)
- Actor -> `a-actor.png`
- Art Teacher -> `a-art-teacher.png`
- Dancer -> `a-dancer.png`
- Fashion Designer -> `a-fashion-designer.png`
- Film Director -> `a-film-director.png`
- Graphic Designer -> `a-graphic-designer.png`
- Interior Designer -> `a-interior-designer.png`
- Musician -> `a-musician.png`
- Photographer -> `a-photographer.png`
- Writer -> `a-writer.png`

Social (S)
- School Counselor -> `s-counselor.png`  (filename does not say "school")
- Physical Therapist -> `s-physical-therapist.png`
- Social Worker -> `s-social-worker.png`
- Speech-Language Pathologist -> `s-speech-language-pathologist.png`
- Rehabilitation Counselor -> `s-orangutan-counselor.png`  (BUG, see note below)
- Registered Nurse -> `s-nurse.png`  (filename does not say "registered")
- Teacher (Elementary) -> `s-teacher.png`
- Childcare Worker -> `s-childcare-worker.png`
- Occupational Therapist -> `s-occupational-therapist.png`
- Clergy -> `s-clergy.png`

Enterprising (E)
- Business Executive -> `e-business-executive.png`
- Sales Manager -> `e-sales-manager.png`
- Lawyer -> `e-lawyer.png`
- Entrepreneur -> `e-entrepreneur.png`
- Financial Advisor -> `e-financial-advisor.png`
- Public Relations Specialist -> `e-public-relations-specialist.png`
- Car Salesperson -> `e-car-salesperson.png`
- Motivational Speaker -> `e-motivational-speaker.png`
- Politician -> `e-politician.png`
- Property Manager -> `e-property-manager.png`

Conventional (C)
- Accountant -> `c-accountant.png`
- Financial Analyst -> `c-financial-analyst.png`
- Paralegal -> `c-paralegal.png`
- Medical Records Technician -> `c-medical-records-technician.png`
- Court Clerk -> `c-court-clerk.png`
- Loan Officer -> `c-loan-officer.png`
- Office Administrator -> `c-office-administration.png`  (filename says "administration")
- Tax Preparer -> `c-tax-preparer.png`
- Payroll Clerk -> `c-payroll-clerk.png`
- Librarian -> `c-librarian.png`

**The `s-orangutan-counselor.png` bug:** in `constants.ts`, Rehabilitation Counselor points at `s-orangutan-counselor.png`. This is a data-entry error. Two options: (a) name the Rehabilitation Counselor image `s-orangutan-counselor.png` so it matches the current code, or (b) fix `constants.ts` first by changing that `imageUrl` to `s-rehabilitation-counselor.png` and name the image to match. Either works. Do not name it one way while the code says the other. The character itself is a Rehabilitation Counselor regardless of the filename.

---

## 4. Style preambles (one per pack)

Paste the chosen pack's preamble at the top of a batch prompt, then the shared spec, then a batch from section 5. Keep each pack internally consistent so its 60 cards look like one set. The Create Your Why accent colors, available to fold in as accents, are: navy `#00384D`, light blue `#44A2B9`, red `#CF2127`, orange `#FF6C37`, teal `#44797B`, yellow `#FFB548`.

**ANIME**
Act as an expert character designer and illustrator. Create career exploration card characters in a high-quality Japanese anime style: clean linework, cel shading, expressive faces, vibrant colors, dynamic but readable poses, modern anime aesthetic. Characters must be completely original.

**MINECRAFT**
Act as an expert character designer and 3D illustrator. Create career exploration card characters in a Minecraft-inspired blocky voxel style: characters built from cubic blocks with pixelated textures, simple geometric forms, and the recognizable boxy proportions of a voxel sandbox game. Completely original. Do not copy Mojang assets, skins, or named characters.

**POKEMON**
Act as an expert character designer and illustrator. Create career exploration card characters in the clean, bright, cel-shaded style of trainer artwork from the Pokemon franchise: crisp outlines, saturated colors, friendly proportions, energetic poses, anime-adjacent rendering. The characters are original human occupation figures only. Do not include any Pokemon creatures, Nintendo or Game Freak assets, or named characters.

**ROBLOX**
Act as an expert character designer and 3D illustrator. Create career exploration card characters in a Roblox-inspired blocky avatar style: the simple, chunky, rounded-block figure proportions of a Roblox avatar, smooth plastic-like surfaces, and bright colors. Completely original. Do not copy Roblox assets, usernames, or named avatars.

**LEAGUE OF LEGENDS**
Act as an expert character designer and digital illustrator. Create career exploration card characters in a League of Legends splash-art-inspired style: painterly, high-detail digital illustration, dramatic lighting, a rich jewel-toned palette, dynamic heroic poses, and ornate stylized costuming reimagined for each occupation. Completely original characters. Do not copy any Riot Games champions, assets, or named characters.

**CAREER HERO** (style inferred, confirm before running, see section 8)
Act as an expert character designer and illustrator. Create career exploration card characters in a clean, modern, semi-realistic illustration style with a bright and optimistic feel: smooth shading, friendly faces, confident posture, slightly stylized proportions, professional and aspirational rather than cartoonish. Characters must be completely original.

**FORTNITE** (already produced, included for reference)
Act as an expert character designer and 3D illustrator. Create career exploration card characters in a Fortnite-inspired polished 3D style: cinematic lighting, vibrant saturated colors, energetic poses, game-ready design, cel-shaded edges, heroic proportions. Completely original, no Epic Games assets or recognizable skins. Pack palette already in use: Deep Blue #005677, Light Blue #68A2B9, Orange #F36C3E, Yellow #FCB34C, Teal #447A7C. Match this palette if you ever extend the Fortnite set.

---

## 5. The 10 occupation batches

Each batch is six occupations. Append a batch to a preamble plus the shared spec. The occupation descriptions are style-agnostic, so the same batches work for every pack. The target filenames under each batch are the names to rename to after generating.

**Batch 1 (Realistic 1 to 6)**
1. Chef - wearing chef's whites and a toque, holding a pan or chef's knife, professional kitchen background
2. Firefighter - wearing turnout gear and helmet, carrying a hose or axe, fire engine or station background
3. Park Naturalist - wearing a ranger uniform and hat, binoculars around neck, forest or park background
4. Pilot - wearing a pilot uniform with cap, holding a flight headset, cockpit or tarmac background
5. Police Officer - wearing a duty uniform with badge and radio, confident stance, city street background
6. Truck Driver - wearing a work jacket, cap, and gloves, standing near a truck cab, highway or loading dock background
Filenames: `r-chef.png`, `r-firefighter.png`, `r-park-naturalist.png`, `r-pilot.png`, `r-police-officer.png`, `r-truck-driver.png`

**Batch 2 (Realistic 7 to 10, Investigative 1 to 2)**
1. Carpenter - wearing a work apron, safety glasses on head, tool belt, holding a tape measure or saw, workshop background
2. Electrician - wearing work coveralls, hard hat, carrying wire strippers or a multimeter, electrical panel background
3. Farmer - wearing overalls, work boots, straw hat, holding produce or near farm equipment, field background
4. Mechanic - wearing grease-stained coveralls, holding a wrench, open car hood or garage background
5. Biologist - wearing a lab coat, goggles on forehead, holding a specimen jar or microscope slide, laboratory background
6. Chemist - wearing a lab coat and splash goggles, holding a beaker or flask, chemistry lab background
Filenames: `r_carpenter.png`, `r_electrician.png`, `r_farmer.png`, `r_mechanic.png`, `i-biologist.png`, `i-chemist.png`

**Batch 3 (Investigative 3 to 8)**
1. Computer Programmer - wearing a casual hoodie or t-shirt, headphones around neck, holding a laptop, desk with monitors background
2. Economist - wearing business casual with glasses, holding charts or a tablet with graphs, office background
3. Geologist - wearing a field vest and hiking boots, holding a rock hammer and rock sample, rocky landscape background
4. Mathematician - wearing smart casual with a sweater, holding chalk or a marker, chalkboard with equations background
5. Medical Scientist - wearing a lab coat and gloves, working with test tubes or a microscope, research lab background
6. Pharmacist - wearing a white pharmacist coat, holding a prescription bottle, pharmacy shelves background
Filenames: `i-computer_programmer.png`, `i-economist.png`, `i-geologist.png`, `i-mathematician.png`, `i-medical-scientist.png`, `i-pharmacist.png`

**Batch 4 (Investigative 9 to 10, Artistic 1 to 4)**
1. Psychologist - wearing professional but approachable clothing, holding a notepad and pen, comfortable therapy room background
2. Doctor - wearing a white coat with stethoscope, holding a medical chart, hospital or clinic background
3. Actor - wearing a theatrical costume, expressive pose, stage with spotlight background
4. Art Teacher - wearing a paint-splattered apron, holding brushes and a palette, art classroom with easels background
5. Dancer - wearing dance attire, dynamic dance pose, dance studio with mirrors background
6. Fashion Designer - wearing a stylish outfit, holding fabric swatches or sketching on a pad, design studio with mannequins background
Filenames: `i-psychologist.png`, `i_doctor.png`, `a-actor.png`, `a-art-teacher.png`, `a-dancer.png`, `a-fashion-designer.png`

**Batch 5 (Artistic 5 to 10)**
1. Film Director - wearing a director's outfit, holding a megaphone or clapperboard, film set with camera equipment background
2. Graphic Designer - wearing trendy casual clothes, holding a drawing tablet and stylus, design studio with screens background
3. Interior Designer - wearing a chic professional outfit, holding color swatches and floor plans, stylish room background
4. Musician - wearing a stage outfit, holding a guitar or at a microphone, music studio or stage background
5. Photographer - wearing a vest with pockets, camera around neck, holding a second camera, outdoor scenic background
6. Writer - wearing cozy casual clothes, holding a journal and pen, library or writing nook background
Filenames: `a-film-director.png`, `a-graphic-designer.png`, `a-interior-designer.png`, `a-musician.png`, `a-photographer.png`, `a-writer.png`

**Batch 6 (Social 1 to 6)**
1. School Counselor - wearing professional but warm clothing, holding a clipboard, school office with posters background
2. Physical Therapist - wearing scrubs or athletic wear, holding exercise bands or a therapy ball, rehab gym background
3. Social Worker - wearing professional casual, carrying a folder or briefcase, community center background
4. Speech-Language Pathologist - wearing professional clothing, holding speech therapy cards, therapy room background
5. Rehabilitation Counselor - wearing business casual, warm expression, holding a tablet, welcoming office background
6. Registered Nurse - wearing scrubs with stethoscope, holding a medical chart, hospital ward background
Filenames: `s-counselor.png`, `s-physical-therapist.png`, `s-social-worker.png`, `s-speech-language-pathologist.png`, `s-orangutan-counselor.png`, `s-nurse.png`

**Batch 7 (Social 7 to 10, Enterprising 1 to 2)**
1. Elementary Teacher - wearing cheerful professional clothes, holding a picture book or apple, colorful classroom background
2. Childcare Worker - wearing comfortable casual clothes, holding toys or craft supplies, daycare or playroom background
3. Occupational Therapist - wearing scrubs or professional clothes, holding adaptive equipment, therapy room background
4. Clergy - wearing religious vestments or a clerical collar, holding a book, church or community setting background
5. Business Executive - wearing a sharp suit, confident stance, holding a briefcase, corporate office with city view background
6. Sales Manager - wearing business attire, energetic pose, holding a tablet or clicker, sales floor background
Filenames: `s-teacher.png`, `s-childcare-worker.png`, `s-occupational-therapist.png`, `s-clergy.png`, `e-business-executive.png`, `e-sales-manager.png`

**Batch 8 (Enterprising 3 to 8)**
1. Lawyer - wearing a suit, carrying a legal briefcase, holding documents, courthouse steps or law office background
2. Entrepreneur - wearing smart casual, energetic stance, holding a phone and coffee, startup office background
3. Financial Advisor - wearing business professional attire, holding financial charts, clean modern office background
4. Public Relations Specialist - wearing polished business attire, holding a phone and press folder, event or media backdrop background
5. Car Salesperson - wearing a dealership polo or blazer with a name tag, gesturing toward a car, showroom background
6. Motivational Speaker - wearing a sharp outfit with a wireless mic headset, confident speaking pose, stage with audience silhouettes background
Filenames: `e-lawyer.png`, `e-entrepreneur.png`, `e-financial-advisor.png`, `e-public-relations-specialist.png`, `e-car-salesperson.png`, `e-motivational-speaker.png`

**Batch 9 (Enterprising 9 to 10, Conventional 1 to 4)**
1. Politician - wearing a formal suit with a lapel pin, confident gesture at a podium, flags or government building background
2. Property Manager - wearing business casual, holding keys and a clipboard, apartment or property exterior background
3. Accountant - wearing business attire with glasses, holding a ledger or calculator, office desk with documents background
4. Financial Analyst - wearing business professional attire, holding a tablet with charts, modern office with screens background
5. Paralegal - wearing business casual, carrying legal files and a laptop, law office with bookshelves background
6. Medical Records Technician - wearing professional attire or light scrubs, at a computer with records, medical office background
Filenames: `e-politician.png`, `e-property-manager.png`, `c-accountant.png`, `c-financial-analyst.png`, `c-paralegal.png`, `c-medical-records-technician.png`

**Batch 10 (Conventional 5 to 10)**
1. Court Clerk - wearing professional attire, holding legal documents with a gavel nearby, courtroom background
2. Loan Officer - wearing business professional attire, at a desk reviewing documents, bank office background
3. Office Administrator - wearing smart business casual, holding a planner or organizing files, busy office background
4. Tax Preparer - wearing business casual with glasses, surrounded by documents and a calculator, neat office background
5. Payroll Clerk - wearing office attire, at a computer with spreadsheets visible, office cubicle background
6. Librarian - wearing smart casual with glasses, holding a stack of books, library with tall bookshelves background
Filenames: `c-court-clerk.png`, `c-loan-officer.png`, `c-office-administration.png`, `c-tax-preparer.png`, `c-payroll-clerk.png`, `c-librarian.png`

### One fully assembled example (Pokemon, Batch 1)

Paste this whole block into the image generator. Build the other 59 batch-and-pack combinations the same way: preamble, then this spec, then the batch.

```
Act as an expert character designer and illustrator. Create career exploration card characters in the clean, bright, cel-shaded style of trainer artwork from the Pokemon franchise: crisp outlines, saturated colors, friendly proportions, energetic poses, anime-adjacent rendering. The characters are original human occupation figures only. Do not include any Pokemon creatures, Nintendo or Game Freak assets, or named characters.

Generate 6 separate images, each its own individual PNG file. Do NOT combine them into a grid, collage, or composite. Generate them one at a time as 6 separate outputs. Generate all 6 one after another without stopping, do not ask for confirmation between images, and do not pause to ask whether to continue.

Each image: one full-body character only, centered, shown head to toe with no cropped body parts, filling most of the frame, with a simple occupation-appropriate background. No text, labels, logos, watermarks, borders, or UI elements. PNG, 1024 x 1536 pixels, 2:3 vertical portrait, high quality.

The 6 occupations:
1. Chef - wearing chef's whites and a toque, holding a pan or chef's knife, professional kitchen background
2. Firefighter - wearing turnout gear and helmet, carrying a hose or axe, fire engine or station background
3. Park Naturalist - wearing a ranger uniform and hat, binoculars around neck, forest or park background
4. Pilot - wearing a pilot uniform with cap, holding a flight headset, cockpit or tarmac background
5. Police Officer - wearing a duty uniform with badge and radio, confident stance, city street background
6. Truck Driver - wearing a work jacket, cap, and gloves, standing near a truck cab, highway or loading dock background

Complete all 6 as separate images before responding with any text.
```

Then rename the six outputs to `r-chef.png`, `r-firefighter.png`, `r-park-naturalist.png`, `r-pilot.png`, `r-police-officer.png`, `r-truck-driver.png` and place them in `public/images/occupations/Pokemon/`.

---

## 6. What to actually ask Claude Desktop to do

Claude Desktop cannot draw the cards. Through the Dropbox connector it can do the surrounding work. Give it these tasks:

1. **Audit.** For each pack folder under `/Claude/career-swipe-app/public/images/occupations/`, list which of the 60 filenames in section 3 are present and which are missing. Output a per-pack checklist. This tells you exactly what still needs generating and prevents regenerating what exists (the `Fortnite Characters` and `Career Hero` folders are already populated to some degree).

2. **Place and rename, only after the images exist.** Once you have generated a batch in the image tool and saved the raw files into Dropbox (for example into the `New folder` staging area), Claude Desktop can rename them to the correct section 3 filenames and move them into the right pack folder. It cannot rename files that exist only inside the image tool's chat. So the realistic loop is: generate 6 in the image tool, save them to Dropbox, then have Claude Desktop rename and file them.

3. **Review the app.** Claude Desktop can fetch `https://careerswipe.netlify.app/` and read the project code to review structure, the pack-swap logic, the radar chart, and the disclaimer. Treat this as a code and content review. It cannot interactively swipe through the app like a user, so "testing" here means inspection, not live QA.

The instruction you wanted, "do not interrupt me, keep going," belongs on the image generator at the batch level and is already in the prompts. It does not make Claude Desktop able to run the generation unattended.

---

## 7. Copyright and trademark note

Pokemon, Roblox, Minecraft, Fortnite, and League of Legends are trademarked franchises. The preambles ask for the visual style only, with completely original characters and no franchise assets, which is the standard way to reduce risk and is what the Fortnite pack already did. Two honest cautions:

- Some image tools refuse or water down prompts that name a brand directly, especially "Pokemon" and "League of Legends." If that happens, drop the brand name and describe the style generically (for example, "bright cel-shaded trainer-style character art" instead of naming Pokemon).
- Style is not protected the way specific characters are, but you are publishing these. Keep characters generic occupation figures, avoid any recognizable mascot, champion, or skin, and you stay on the safer side. I am not a lawyer, and this is general information, not legal advice.

---

## 8. Open questions and what may be missing

- **Career Hero style is a guess.** I defined it as a clean, modern, semi-realistic illustration. If you meant a superhero-comic look instead, say so and the preamble changes. Confirm before generating 60 of them.
- **Audit before generating.** `Fortnite Characters` and `Career Hero` already contain images. Run the section 6 audit so you do not redo work.
- **The orangutan filename.** Decide now whether to keep `s-orangutan-counselor.png` or fix the code. Generating to the wrong name wastes a card.
- **Folder names with spaces.** `Career Hero` and `Fortnite Characters` have spaces. Confirm the pack-selector code references the exact folder strings, or normalize the folder names.
- **Scope and effort.** 6 packs at 60 cards is 360 images. At roughly 6 reliable images per generation request, that is about 60 generation requests plus renaming and filing. Plan for several sessions, not one unattended run.
- **Cross-pack identity.** The same occupation does not need to be the same person across packs, and is not. That is fine and expected.
