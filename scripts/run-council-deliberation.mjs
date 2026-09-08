import fs from "fs";
import path from "path";
// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.error("ERROR: GEMINI_API_KEY is not set in environment or .env.local!");
  process.exit(1);
}

console.log("Using live GEMINI_API_KEY (starts with:", geminiKey.slice(0, 8) + "...)");

const title = "Privacy-Preserving General Location & Zero-Knowledge Proximity Architecture";
const context = "AdMe aims to show geographically relevant content (e.g. local merchant deals, regional preferences, community campaigns) without violating its core privacy-first ethos. Traditional platforms harvest precision GPS coordinates, construct historical location traces, and store them in centralized databases for ad targeting. We need an architectural pattern that allows general/coarse location detection (city/region) and proximity matching while maintaining user trust, transparency, and zero persistence of user location coordinates in any cloud database.";
const decision = "Implement a hybrid privacy-first location architecture:\n1. Passive Edge-Based Coarse Detection: Read standard edge CDN headers (e.g., 'x-vercel-ip-city', 'x-vercel-ip-country-region', or fallback) on incoming requests to establish a general city/metro baseline without browser permission prompts or fingerprinting.\n2. Active Client-Side Quantization: If the user opts into localized proximity deals, browser geolocation coordinates are immediately quantized/fuzzed on-device to ~1-5km neighborhood grid cells (rounding to 2 decimal places max) and stored strictly in ephemeral client memory / local state.\n3. Zero Cloud Persistence: User coordinates or location histories are NEVER persisted to the Supabase database (users table or logs). Content filtering against location happens either on-device or via ephemeral coarse bounding queries.\n4. User Agency & Transparency: Provide an overt location badge (e.g., '📍 Santa Monica, CA · Evaluated on-device · Zero tracking') with controls to toggle off, blur, or manually override location at any time.";

const prompt = `
You are the Architecture Council for the AdMe project. Deliberate on the following proposal:
Title: "${title}"
Context: "${context}"
Decision: "${decision}"

The council consists of 6 personas:
1. The Architect (System design, scalability, patterns, Next.js architecture)
2. The Engineer (Code complexity, maintainability, TypeScript types, performance)
3. The Security Lead (OWASP, data privacy, authentication, RLS, zero-knowledge constraints)
4. The Product Owner (User experience, user agency, value proposition, privacy alignment)
5. The QA Lead (Testing strategy, unit tests, mock coverage, edge cases)
6. The Data Engineer (Schema impact, database invariants, zero-retention compliance)

Evaluate whether this proposal upholds AdMe's strict privacy-first values, and provide rigorous, highly concrete architectural advice.

Return your response strictly as valid JSON with the following schema:
{
  "comments": [
    {
      "member": "The Architect",
      "avatar": "🏛️",
      "text": "Detailed analysis...",
      "vote": "YES"
    },
    {
      "member": "The Engineer",
      "avatar": "⚙️",
      "text": "Detailed analysis...",
      "vote": "YES"
    },
    {
      "member": "The Security Lead",
      "avatar": "🛡️",
      "text": "Detailed analysis...",
      "vote": "YES"
    },
    {
      "member": "The Product Owner",
      "avatar": "🎯",
      "text": "Detailed analysis...",
      "vote": "YES"
    },
    {
      "member": "The QA Lead",
      "avatar": "🧪",
      "text": "Detailed analysis...",
      "vote": "YES"
    },
    {
      "member": "The Data Engineer",
      "avatar": "💾",
      "text": "Detailed analysis...",
      "vote": "YES"
    }
  ],
  "amendments": [
    "Binding constraint 1...",
    "Binding constraint 2..."
  ],
  "passed": true,
  "verdict": "Majority Approval verdict description...",
  "implementationMandate": "Detailed technical steps, file paths, patterns, schema guidelines for the developer..."
}

Ensure all comments address the specific details of Title: "${title}", Context: "${context}", and Decision: "${decision}". Respond ONLY with raw JSON.
`;

async function run() {
  const candidateModels = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
  ];

  let resultData = null;
  let usedModel = "";

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    console.log(`Calling live Gemini API (${model})...`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const textContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          resultData = JSON.parse(textContent);
          usedModel = model;
          console.log(`Success with model: ${model}`);
          break;
        }
      } else {
        const errText = await response.text();
        console.warn(`Model ${model} returned status ${response.status}: ${errText.slice(0, 150)}...`);
      }
    } catch (e) {
      console.warn(`Model ${model} fetch failed:`, e.message);
    }
  }

  if (!resultData) {
    console.error("All candidate Gemini models failed.");
    process.exit(1);
  }
  console.log("\nDeliberation received from live Gemini API!");
  console.log("Verdict:", resultData.verdict);
  console.log("Passed:", resultData.passed);
  console.log("Amendments count:", resultData.amendments?.length);

  // Write ratified decision to docs/decisions
  const decisionsDir = path.resolve(process.cwd(), "docs/decisions");
  if (!fs.existsSync(decisionsDir)) {
    fs.mkdirSync(decisionsDir, { recursive: true });
  }

  const files = fs.readdirSync(decisionsDir).filter((f) => f.endsWith(".md"));
  let maxNum = 0;
  for (const file of files) {
    const match = file.match(/COUNCIL-\d+-(\d+)\.md/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = String(maxNum + 1).padStart(3, "0");
  const currentYear = new Date().getFullYear();
  const fileName = `COUNCIL-${currentYear}-${nextNum}.md`;
  const filePath = path.join(decisionsDir, fileName);

  const markdownContent = `# ${fileName.replace(".md", "")}: ${title}

**Status:** RATIFIED — Pending Implementation
**Date:** ${new Date().toISOString().split("T")[0]}
**Council:** Architecture Council, AdMe (${resultData.comments.filter((c) => c.vote === "YES").length}/6 ratified)
**Related:** COUNCIL-2026-001
**Tags:** council, automatic, live-governance, privacy, location

## Context
${context}

## Decision
${decision}

## Amendments Adopted
${resultData.amendments.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Implementation Mandate
${resultData.implementationMandate || "Implement the details cleanly according to repository standards."}

## Council Deliberations
${resultData.comments.map((c) => `### ${c.avatar} ${c.member} (${c.vote})
${c.text}
`).join("\n")}
## Definition of Done
- [ ] Implement the core decision details
- [ ] Verify test suite passes clean
- [ ] Verify build compiles successfully

---
*Ratified by full council — ${fileName.replace(".md", "")}*
*The Architect | The Engineer | The Security Lead*
*The Product Owner | The QA Lead | The Data Engineer*
`;

  fs.writeFileSync(filePath, markdownContent, "utf8");
  console.log(`\nSuccessfully wrote Council Decision Record: ${filePath}`);
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
