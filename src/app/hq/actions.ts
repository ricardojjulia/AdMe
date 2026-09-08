"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

interface DeliberationResponse {
  comments: Array<{
    member: string;
    avatar: string;
    text: string;
    vote: "YES" | "NO";
  }>;
  amendments: string[];
  passed: boolean;
  verdict: string;
  implementationMandate?: string;
  hasApiKey: boolean;
  newFile?: {
    name: string;
    path: string;
    content: string;
  };
}

export async function deliberateProposal(
  title: string,
  context: string,
  decision: string
): Promise<DeliberationResponse> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasApiKey = !!(geminiKey || openaiKey);

  const prompt = `
You are the Architecture Council for the AdMe project. Deliberate on the following proposal:
Title: "${title}"
Context: "${context}"
Decision: "${decision}"

Generate professional, highly specific comments and votes (YES/NO) from the six council members:
1. The Architect (System design, integration fit)
2. The Engineer (Implementation feasibility, complexity)
3. The Security Lead (Attack surface, data leakage, RLS checks)
4. The Product Owner (User value, mission fit)
5. The QA Lead (Testability, regression risk, coverage thresholds)
6. The Data Engineer (Schema design, query performance, migrations)

Format your response as a strict JSON object matching this structure:
{
  "comments": [
    { "member": "The Architect", "avatar": "🏛️", "text": "Architect review comment...", "vote": "YES" },
    { "member": "The Engineer", "avatar": "⚙️", "text": "Engineer review comment...", "vote": "YES" },
    { "member": "The Security Lead", "avatar": "🛡️", "text": "Security Lead review comment...", "vote": "YES" },
    { "member": "The Product Owner", "avatar": "🎯", "text": "Product Owner review comment...", "vote": "YES" },
    { "member": "The QA Lead", "avatar": "🧪", "text": "QA Lead review comment...", "vote": "YES" },
    { "member": "The Data Engineer", "avatar": "💾", "text": "Data Engineer review comment...", "vote": "YES" }
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

  let resultData: any = null;

  if (geminiKey) {
    const candidateModels = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-flash-latest",
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
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
            break;
          }
        } else {
          const errText = await response.text();
          console.warn(`Gemini model ${model} error:`, response.status, errText.slice(0, 120));
        }
      } catch (e) {
        console.warn(`Gemini API call to ${model} failed:`, e);
      }
    }
  } else if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const textContent = json.choices?.[0]?.message?.content;
        if (textContent) {
          resultData = JSON.parse(textContent);
        }
      }
    } catch (e) {
      console.error("OpenAI API call failed:", e);
    }
  }

  // Fallback to local heuristic generation if API keys are absent or failed
  if (!resultData) {
    resultData = {
      comments: [
        {
          member: "The Architect",
          avatar: "🏛️",
          text: `Reviewing "${title}". The system architecture easily supports these updates. Make sure new entrypoints are dynamically loaded to minimize main-bundle footprints.`,
          vote: "YES",
        },
        {
          member: "The Engineer",
          avatar: "⚙️",
          text: `Analyzing complexity. Building "${decision.substring(0, 80)}..." is structural and straightforward. Follow the repository's established code and styling conventions.`,
          vote: "YES",
        },
        {
          member: "The Security Lead",
          avatar: "🛡️",
          text: `Auditing security boundaries. Confirm that user sessions are fully authorized at the API layer, and enforce RLS controls for any underlying data tables.`,
          vote: "YES",
        },
        {
          member: "The Product Owner",
          avatar: "🎯",
          text: `Evaluating user benefits. Fixing the gap ("${context.substring(0, 80)}...") directly improves consumer outcomes and matches the roadmap goals.`,
          vote: "YES",
        },
        {
          member: "The QA Lead",
          avatar: "🧪",
          text: "Confirming testability. Implement separate unit tests verifying both success flows and error fallbacks. Check that CI thresholds are satisfied.",
          vote: "YES",
        },
        {
          member: "The Data Engineer",
          avatar: "💾",
          text: "Reviewing database schema changes. Ensure all tables enable RLS immediately upon creation and migrations are fully idempotent.",
          vote: "YES",
        },
      ],
      amendments: [
        "All data writes and operations must be fully authenticated.",
        "Add comprehensive unit/integration test coverage with coverage floors.",
      ],
      passed: true,
      verdict: "6/6 Unanimous Approval — RATIFIED for implementation",
      implementationMandate: `Create the necessary folders and components in "src/". Implement the core functionalities for ${title}. Run verification builds and tests before landing the commit.`,
    };
  }

  // Write ratified decision to docs/decisions if passed
  let newFile = undefined;
  if (resultData.passed) {
    try {
      const decisionsDir = path.resolve("docs/decisions");
      if (!fs.existsSync(decisionsDir)) {
        fs.mkdirSync(decisionsDir, { recursive: true });
      }

      // Calculate next sequential document ID
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

      // Create markdown content
      const markdownContent = `# ${fileName.replace(".md", "")}: ${title}

**Status:** RATIFIED — Pending Implementation
**Date:** ${new Date().toISOString().split("T")[0]}
**Council:** Architecture Council, AdMe (${resultData.comments.filter((c: any) => c.vote === "YES").length}/6 ratified)
**Related:** COUNCIL-2026-001
**Tags:** council, automatic, live-governance

## Context
${context}

## Decision
${decision}

## Amendments Adopted
${resultData.amendments.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}

## Implementation Mandate
${resultData.implementationMandate || "Implement the details cleanly according to repository standards."}

## Council Deliberations
${resultData.comments.map((c: any) => `### ${c.avatar} ${c.member} (${c.vote})
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
      revalidatePath("/hq");

      newFile = {
        name: fileName,
        path: filePath,
        content: markdownContent,
      };
    } catch (e) {
      console.error("Error writing ratified decision file:", e);
    }
  }

  return {
    ...resultData,
    hasApiKey,
    newFile,
  };
}

export async function summonWildcard(domain: string): Promise<{
  proposal: string;
  feedback: Array<{
    speaker: string;
    avatar: string;
    text: string;
    vote?: "YES" | "NO";
  }>;
}> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `
You are the Wildcard Council Member and the Architecture Council for the AdMe project. 
Propose an unconventional, highly innovative, outside-the-box engineering or UX design suggestion for the domain: "${domain}".
Also provide brief appraisals/feedback from 3 other council members: The Architect, The Security Lead, and The Product Owner.

Format your response as a strict JSON object matching this structure:
{
  "proposal": "[Unconventional Idea] Proposal description...",
  "feedback": [
    { "speaker": "The Architect", "avatar": "🏛️", "text": "Architect feedback..." },
    { "speaker": "The Security Lead", "avatar": "🛡️", "text": "Security Lead feedback..." },
    { "speaker": "The Product Owner", "avatar": "🎯", "text": "Product Owner feedback..." }
  ]
}

Respond ONLY with raw JSON.
`;

  let resultData: any = null;

  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
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
        }
      }
    } catch (e) {
      console.error("Gemini API call failed:", e);
    }
  } else if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const textContent = json.choices?.[0]?.message?.content;
        if (textContent) {
          resultData = JSON.parse(textContent);
        }
      }
    } catch (e) {
      console.error("OpenAI API call failed:", e);
    }
  }

  if (!resultData) {
    resultData = {
      proposal: `[Wildcard Idea] Implement a local WebGL canvas engine for 3D interactive preference swipes on "${domain}".`,
      feedback: [
        {
          speaker: "The Architect",
          avatar: "🏛️",
          text: "Creative recommendation! However, let's keep bundle sizes optimized to maintain high load performance.",
        },
        {
          speaker: "The Security Lead",
          avatar: "🛡️",
          text: "This satisfies local privacy boundaries perfectly by keeping data processing entirely within the browser sandbox.",
        },
        {
          speaker: "The Product Owner",
          avatar: "🎯",
          text: "The gamification element is extremely high. This matches our value-exchange design pillars well.",
        },
      ],
    };
  }

  return resultData;
}
