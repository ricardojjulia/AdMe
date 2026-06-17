"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { deliberateProposal, summonWildcard } from "./actions";

interface DecisionFile {
  name: string;
  path: string;
  content: string;
  date?: string;
  status?: string;
  tags?: string[];
}

interface ClientHqProps {
  initialDecisions: DecisionFile[];
}

interface CouncilMember {
  id: string;
  name: string;
  title: string;
  avatar: string;
  perspective: string;
  questions: string[];
}

const COUNCIL_MEMBERS: CouncilMember[] = [
  {
    id: "architect",
    name: "The Architect",
    title: "System Design & Topology",
    avatar: "🏛️",
    perspective: "Analyzes system design, integration fit, and long-term codebase coherence.",
    questions: [
      "Does this fit the existing topology?",
      "What does it add to or break in the architecture?",
      "What new infrastructure does it require?"
    ]
  },
  {
    id: "engineer",
    name: "The Engineer",
    title: "Implementation Feasibility",
    avatar: "⚙️",
    perspective: "Assesses code complexity, execution risks, and structural feasibility.",
    questions: [
      "Can this be built cleanly in one sprint?",
      "What are the edge cases?",
      "What existing patterns does this follow or break?"
    ]
  },
  {
    id: "security",
    name: "The Security Lead",
    title: "Attack Surface & RLS Audits",
    avatar: "🛡️",
    perspective: "Enforces strict authorization boundaries, RLS policies, and PII shielding.",
    questions: [
      "What new RLS policies are needed?",
      "What goes server-side only?",
      "Is any secret or PII at risk?"
    ]
  },
  {
    id: "product",
    name: "The Product Owner",
    title: "User Value & Mission Alignment",
    avatar: "🎯",
    perspective: "Ensures focus on real user experience and customer value exchange.",
    questions: [
      "Does this serve the actual user?",
      "Is the value proposition clear?",
      "Does the complexity justify the benefit?"
    ]
  },
  {
    id: "qa",
    name: "The QA Lead",
    title: "Testability & Regression Risk",
    avatar: "🧪",
    perspective: "Validates code coverage thresholds and test architecture stability.",
    questions: [
      "Can this be unit-tested with pure functions?",
      "What does a failing test look like?",
      "How do we know it's working in production?"
    ]
  },
  {
    id: "data",
    name: "The Data Engineer",
    title: "Database Schemas & Migrations",
    avatar: "💾",
    perspective: "Ensures idempotent, reversible migrations and query indexing safety.",
    questions: [
      "Is the data model correct?",
      "Are there indexes?",
      "Is this migration reversible?"
    ]
  }
];

interface LogEntry {
  speaker: string;
  avatar: string;
  text: string;
  vote?: "YES" | "NO";
}

export function ClientHq({ initialDecisions }: ClientHqProps) {
  const [activeTab, setActiveTab] = useState<"chambers" | "registry" | "deliberate" | "wildcard">("chambers");

  // Parse helper for initial decisions
  const parseDecisionFiles = (files: DecisionFile[]) => {
    return files.map((file) => {
      const lines = file.content.split("\n");
      let date = "Unknown";
      let status = "Unknown";
      let tags: string[] = [];

      for (const line of lines) {
        if (line.startsWith("**Date:**")) {
          date = line.replace("**Date:**", "").trim();
        }
        if (line.startsWith("**Status:**")) {
          status = line.replace("**Status:**", "").trim();
        }
        if (line.startsWith("**Tags:**")) {
          tags = line
            .replace("**Tags:**", "")
            .trim()
            .replace(/[\[\]]/g, "")
            .split(",")
            .map((t) => t.trim());
        }
      }
      return { ...file, date, status, tags };
    });
  };

  const [decisions, setDecisions] = useState<DecisionFile[]>(parseDecisionFiles(initialDecisions));
  const [selectedFile, setSelectedFile] = useState<DecisionFile | null>(
    decisions.length > 0 ? decisions[0] : null
  );

  // Proposal Deliberation simulator state
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalContext, setProposalContext] = useState("");
  const [proposalDecision, setProposalDecision] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLog, setSimLog] = useState<LogEntry[]>([]);
  const [verdict, setVerdict] = useState<{ status: string; passed: boolean } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Wildcard simulator state
  const [wildcardDomain, setWildcardDomain] = useState("");
  const [isSummoning, setIsSummoning] = useState(false);
  const [wildcardProposal, setWildcardProposal] = useState<string | null>(null);
  const [wildcardFeedback, setWildcardFeedback] = useState<LogEntry[]>([]);

  const handleSimulateDeliberation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle || !proposalContext || !proposalDecision) return;

    setIsSimulating(true);
    setSimLog([]);
    setVerdict(null);
    setShowWarning(false);

    try {
      // Call live Server Action
      const result = await deliberateProposal(proposalTitle, proposalContext, proposalDecision);

      if (!result.hasApiKey) {
        setShowWarning(true);
      }

      // Display comments incrementally to simulate council debate
      for (let i = 0; i < result.comments.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSimLog((prev) => [
          ...prev,
          {
            speaker: result.comments[i].member,
            avatar: result.comments[i].avatar,
            text: result.comments[i].text,
          },
        ]);
      }

      // Deliberate and reveal votes
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSimLog((prev) =>
        prev.map((entry, idx) => ({ ...entry, vote: result.comments[idx].vote }))
      );

      setVerdict({
        status: result.verdict,
        passed: result.passed,
      });

      // Append new file to registry if created
      if (result.newFile) {
        const parsed = parseDecisionFiles([result.newFile])[0];
        setDecisions((prev) => [parsed, ...prev]);
        setSelectedFile(parsed);
      }
    } catch (err) {
      console.error(err);
      setVerdict({
        status: "Error occurred during council deliberation.",
        passed: false,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSummonWildcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wildcardDomain) return;

    setIsSummoning(true);
    setWildcardProposal(null);
    setWildcardFeedback([]);

    try {
      const result = await summonWildcard(wildcardDomain);
      setWildcardProposal(result.proposal);

      for (let i = 0; i < result.feedback.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setWildcardFeedback((prev) => [
          ...prev,
          {
            speaker: result.feedback[i].speaker,
            avatar: result.feedback[i].avatar,
            text: result.feedback[i].text,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummoning(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Dashboard Topbar */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>🛡️</span>
          <div>
            <h1 className={styles.title}>Council HQ</h1>
            <p className={styles.subtitle}>Architecture & Governance Chambers</p>
          </div>
        </div>
        <Link href="/" className={styles.backLink}>
          ← Back to App
        </Link>
      </header>

      {/* Main Page Layout Grid */}
      <div className={styles.grid}>
        {/* Left Side: System Monitor & Decisions files list */}
        <aside className={styles.sidebar}>
          {/* System Status Tracker */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>🛰️ Systems Monitor</h3>
            <div className={styles.statusIndicator}>
              <span>Active Governance Version</span>
              <span className={`${styles.badge} ${styles.badgeNeutral}`}>v4.0.0</span>
            </div>
            <div className={styles.statusIndicator}>
              <span>Branch Protection Guard</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span>
            </div>
            <div className={styles.statusIndicator}>
              <span>CI Pipeline Status</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Passing</span>
            </div>
            <div className={styles.statusIndicator}>
              <span>Vitest Mocks Status</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Locked</span>
            </div>
            <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#9ca3af" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Coverage Thresholds:</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                <span>adapter.ts</span>
                <span style={{ color: "#10b981" }}>&gt; 65% (passing)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>client.ts</span>
                <span style={{ color: "#10b981" }}>&gt; 55% (passing)</span>
              </div>
            </div>
          </div>

          {/* Decisions Registry Files List */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📜 Decisions Registry</h3>
            <div className={styles.fileList}>
              {decisions.map((file) => {
                const isActive = selectedFile?.name === file.name;
                return (
                  <button
                    key={file.name}
                    type="button"
                    className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ""}`}
                    onClick={() => {
                      setSelectedFile(file);
                      setActiveTab("registry");
                    }}
                  >
                    <span className={styles.fileName}>{file.name}</span>
                    <div className={styles.fileMeta}>
                      <span>{file.date}</span>
                      <span
                        style={{
                          color: file.status?.includes("RATIFIED") || file.status?.includes("ACCEPTED") ? "#10b981" : "#3b82f6"
                        }}
                      >
                        {file.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Side: Tabbed Interfaces */}
        <main className={styles.mainContent}>
          {/* Navigation Tabs */}
          <nav className={styles.navTabs}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "chambers" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("chambers")}
            >
              Chambers Directory
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "registry" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("registry")}
            >
              Document Preview
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "deliberate" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("deliberate")}
            >
              Proposal Deliberation
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "wildcard" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("wildcard")}
            >
              Summon Wildcard
            </button>
          </nav>

          {/* Tab Content: Chambers Directory */}
          {activeTab === "chambers" && (
            <div className={styles.councilGrid}>
              {COUNCIL_MEMBERS.map((member) => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberCardHeader}>
                    <div className={styles.memberAvatar}>{member.avatar}</div>
                    <div className={styles.memberInfo}>
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                  </div>
                  <p className={styles.memberPerspective}>{member.perspective}</p>
                  <div className={styles.memberQuestions}>
                    <h4>Key Questions Enforced:</h4>
                    <ul>
                      {member.questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Document Preview */}
          {activeTab === "registry" && (
            <div className={styles.card}>
              {selectedFile ? (
                <div className={styles.decisionPanel}>
                  <div className={styles.decisionPreviewHeader}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                        {selectedFile.name.replace(".md", "")}
                      </h2>
                      <div className={styles.decisionMetaTags}>
                        <span className={styles.tag}>Date: {selectedFile.date}</span>
                        <span className={styles.tag}>Status: {selectedFile.status}</span>
                        {selectedFile.tags?.map((t) => (
                          <span key={t} className={styles.tag}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                      Path: `docs/decisions/{selectedFile.name}`
                    </span>
                  </div>
                  <div className={styles.decisionMarkdown}>
                    {selectedFile.content}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                  Select a document from the left list registry to view its content details.
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Deliberation Simulator */}
          {activeTab === "deliberate" && (
            <div className={styles.interactiveGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>📝 Draft Proposal</h3>
                {showWarning && (
                  <div style={{ padding: "0.75rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "0.5rem", color: "#f59e0b", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: 1.4 }}>
                    ⚠️ No API Key found in env. Operating in local simulation mode. Configure `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env.local` to enable live AI Council deliberations.
                  </div>
                )}
                <form onSubmit={handleSimulateDeliberation}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Proposal Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., Implement Client-Side Differential Privacy"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      disabled={isSimulating}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Context / Backlog Gap</label>
                    <textarea
                      className={`${styles.formInput} ${styles.formTextarea}`}
                      placeholder="Specify what features are missing or broken..."
                      value={proposalContext}
                      onChange={(e) => setProposalContext(e.target.value)}
                      disabled={isSimulating}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Decision (Commitment details)</label>
                    <textarea
                      className={`${styles.formInput} ${styles.formTextarea}`}
                      placeholder="State precisely what will be built..."
                      value={proposalDecision}
                      onChange={(e) => setProposalDecision(e.target.value)}
                      disabled={isSimulating}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={isSimulating}>
                    {isSimulating ? "Council Deliberating..." : "Submit to Council Review"}
                  </button>
                </form>
              </div>

              <div className={styles.card} style={{ display: "flex", flexDirection: "column" }}>
                <h3 className={styles.cardTitle}>🎙️ Deliberation Log</h3>
                <div className={styles.sessionLog} style={{ flexGrow: 1, minHeight: "250px" }}>
                  {simLog.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
                      Draft a proposal on the left and submit it to see the live AI Council debate and vote.
                    </div>
                  )}
                  {simLog.map((log, index) => (
                    <div key={index} className={styles.logEntry}>
                      <div className={styles.logAvatar}>{log.avatar}</div>
                      <div className={styles.logBody}>
                        <span className={styles.logName}>
                          {log.speaker}
                          {log.vote && (
                            <span className={`${styles.logVote} ${log.vote === "YES" ? styles.voteYes : styles.voteNo}`}>
                              • Voted: {log.vote}
                            </span>
                          )}
                        </span>
                        <p className={styles.logText}>{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {verdict && (
                  <div
                    className={`${styles.sessionVerdict} ${
                      verdict.passed ? styles.verdictSuccess : styles.verdictFailed
                    }`}
                  >
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f3f4f6" }}>Verdict</div>
                      <div style={{ fontSize: "0.85rem", color: "#d1d5db", marginTop: "0.1rem" }}>{verdict.status}</div>
                    </div>
                    <span style={{ fontSize: "1.5rem" }}>{verdict.passed ? "✅" : "❌"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Summon Wildcard */}
          {activeTab === "wildcard" && (
            <div className={styles.interactiveGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>🔮 Invoke Wildcard Member</h3>
                <p style={{ fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.4, margin: "0 0 1rem 0" }}>
                  Summon the 7th wildcard member of the council to propose unconventional, highly creative engineering designs for a chosen backlog area.
                </p>
                <form onSubmit={handleSummonWildcard}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Domain / Feature Area</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., location tracking, rewards ledger, wallet authentication"
                      value={wildcardDomain}
                      onChange={(e) => setWildcardDomain(e.target.value)}
                      disabled={isSummoning}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={isSummoning}>
                    {isSummoning ? "Summoning Wildcard..." : "Invoke the Wildcard Member"}
                  </button>
                </form>

                {wildcardProposal && (
                  <div style={{ marginTop: "1.5rem", background: "rgba(139, 92, 246, 0.08)", border: "1px dashed rgba(139, 92, 246, 0.3)", borderRadius: "0.5rem", padding: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                      🃏 Wildcard Member Proposal:
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#f3f4f6", lineHeight: 1.4 }}>
                      {wildcardProposal}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.card} style={{ display: "flex", flexDirection: "column" }}>
                <h3 className={styles.cardTitle}>💬 Council Appraisals</h3>
                <div className={styles.sessionLog} style={{ flexGrow: 1, minHeight: "250px" }}>
                  {wildcardFeedback.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
                      {isSummoning ? "Summoning... Council is awaiting proposal." : "Summon the wildcard on the left to see council feedback."}
                    </div>
                  )}
                  {wildcardFeedback.map((log, index) => (
                    <div key={index} className={styles.logEntry}>
                      <div className={styles.logAvatar}>{log.avatar}</div>
                      <div className={styles.logBody}>
                        <span className={styles.logName}>{log.speaker}</span>
                        <p className={styles.logText}>{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
