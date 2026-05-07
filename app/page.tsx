"use client";

import { FormEvent, useMemo, useState } from "react";

type Analysis = {
  summary: string;
  category: string;
  urgency: string;
  sentiment: string;
  suggested_customer_reply: string;
  internal_team_note: string;
};

type CrmRecord = {
  id: string;
  status: string;
  assignedTeam: string;
  priority: string;
  lastUpdated: string;
  payload: {
    customer_issue_summary: string;
    category: string;
    urgency: string;
    sentiment: string;
    suggested_reply: string;
    internal_team_note: string;
    export_timestamp: string;
  };
};

const sampleTickets = [
  {
    label: "Billing Escalation",
    text: "Subject: Charged twice after annual renewal\n\nHi support, our finance team noticed that our account was charged twice for the annual renewal this morning. This is blocking our month-end close and I need a corrected invoice today. We have already opened ticket #48219 but have not heard back.",
  },
  {
    label: "Login Outage",
    text: "Subject: SSO login failing for all users\n\nOur team cannot access the admin portal through Okta. We receive a redirect loop after entering credentials. This started about 25 minutes ago and affects our customer success team during live onboarding calls.",
  },
  {
    label: "Feature Request",
    text: "Subject: Export filtered analytics\n\nThe new analytics page is useful, but our RevOps team needs to export only filtered segments as CSV. Right now we have to export everything and clean it manually, which adds a lot of work each Friday.",
  },
];

const initialTicket = sampleTickets[1].text;

function badgeClasses(value: string) {
  const styles: Record<string, string> = {
    High: "border-red-200 bg-red-50 text-red-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Frustrated: "border-red-200 bg-red-50 text-red-700",
    Negative: "border-orange-200 bg-orange-50 text-orange-700",
    Neutral: "border-slate-200 bg-slate-50 text-slate-700",
    Positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return styles[value] ?? "border-sky-200 bg-sky-50 text-sky-700";
}

function getAssignedTeam(category: string) {
  const teams: Record<string, string> = {
    Billing: "Revenue Operations",
    "Technical Support": "Technical Support",
    "Account Access": "Identity Support",
    "Product Feedback": "Product Operations",
    Cancellation: "Customer Success",
    Sales: "Sales Engineering",
  };

  return teams[category] ?? "Support Operations";
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Home() {
  const [ticket, setTicket] = useState(initialTicket);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [crmRecord, setCrmRecord] = useState<CrmRecord | null>(null);
  const [stats, setStats] = useState({
    analyzed: 128,
    highUrgency: 24,
    categoryCounts: {
      Billing: 36,
      "Technical Support": 52,
      "Account Access": 18,
      "Product Feedback": 14,
      Cancellation: 5,
      Sales: 3,
      Other: 0,
    } as Record<string, number>,
    sentimentCounts: {
      Positive: 22,
      Neutral: 48,
      Negative: 39,
      Frustrated: 19,
    } as Record<string, number>,
  });

  const dashboardMetrics = useMemo(() => {
    const mostCommonCategory = Object.entries(stats.categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const sentimentScore: Record<string, number> = {
      Positive: 1,
      Neutral: 0,
      Negative: -1,
      Frustrated: -1.5,
    };

    const totalSentiment = Object.entries(stats.sentimentCounts).reduce(
      (sum, [sentiment, count]) => sum + (sentimentScore[sentiment] ?? 0) * count,
      0,
    );

    const averageScore = totalSentiment / Math.max(stats.analyzed, 1);
    const averageSentiment =
      averageScore > 0.25
        ? "Positive"
        : averageScore < -0.55
          ? "Frustrated"
          : averageScore < -0.15
            ? "Negative"
            : "Neutral";

    return [
      { label: "Total Tickets Analyzed", value: stats.analyzed.toLocaleString() },
      { label: "High Urgency Tickets", value: stats.highUrgency.toLocaleString() },
      { label: "Most Common Category", value: mostCommonCategory },
      { label: "Average Sentiment", value: averageSentiment },
    ];
  }, [stats]);

  async function analyzeTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setAnalysis(null);
    setExportMessage("");
    setCrmRecord(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticket }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to analyze this ticket.");
      }

      const nextAnalysis = payload.analysis as Analysis;
      setAnalysis(nextAnalysis);
      setStats((current) => ({
        analyzed: current.analyzed + 1,
        highUrgency:
          nextAnalysis.urgency === "High"
            ? current.highUrgency + 1
            : current.highUrgency,
        categoryCounts: {
          ...current.categoryCounts,
          [nextAnalysis.category]: (current.categoryCounts[nextAnalysis.category] ?? 0) + 1,
        },
        sentimentCounts: {
          ...current.sentimentCounts,
          [nextAnalysis.sentiment]:
            (current.sentimentCounts[nextAnalysis.sentiment] ?? 0) + 1,
        },
      }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to analyze this ticket.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function exportToCrm() {
    if (!analysis || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMessage("");
    setCrmRecord(null);

    const exportTimestamp = new Date();
    const mockCrmPayload = {
      customer_issue_summary: analysis.summary,
      category: analysis.category,
      urgency: analysis.urgency,
      sentiment: analysis.sentiment,
      suggested_reply: analysis.suggested_customer_reply,
      internal_team_note: analysis.internal_team_note,
      export_timestamp: exportTimestamp.toISOString(),
    };

    // In production, this is where the app would call a secure API route that
    // writes the enriched ticket payload into Salesforce, HubSpot, Zendesk, or
    // another CRM/support platform using that system's authenticated API.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // A real integration could map fields to objects such as Salesforce Cases,
    // HubSpot Tickets, or Zendesk ticket custom fields before returning the CRM
    // record identifier and ownership metadata to the UI.
    setCrmRecord({
      id: `CRM-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "Ready for follow-up",
      assignedTeam: getAssignedTeam(analysis.category),
      priority: analysis.urgency === "High" ? "P1 Escalation" : "Standard Queue",
      lastUpdated: formatTimestamp(exportTimestamp),
      payload: mockCrmPayload,
    });
    setExportMessage("Ticket analysis exported to CRM record successfully.");
    setIsExporting(false);
  }

  return (
    <main className="min-h-screen px-5 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              AI Customer Support Workflow Demo
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Turn unstructured customer tickets into triage-ready summaries,
              routing signals, and response drafts for a modern SaaS support team.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur sm:grid-cols-4 lg:min-w-[520px]">
            {dashboardMetrics.map((metric) => (
              <div key={metric.label} className="rounded-md px-3 py-3">
                <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]">
          <form
            onSubmit={analyzeTicket}
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Ticket Intake
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Paste a customer message or start from a sample ticket.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLoading ? "Analyzing..." : "Analyze Ticket"}
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                {sampleTickets.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setTicket(sample.text);
                      setError("");
                    }}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <textarea
                value={ticket}
                onChange={(event) => setTicket(event.target.value)}
                placeholder="Paste the customer support ticket here..."
                className="min-h-[360px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">AI Analysis</h2>
              <p className="mt-1 text-sm text-slate-500">
                Structured output for support, success, and escalation workflows.
              </p>
            </div>

            <div className="p-5">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
                    />
                  ))}
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Category", analysis.category],
                      ["Urgency", analysis.urgency],
                      ["Sentiment", analysis.sentiment],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {label}
                        </p>
                        <span
                          className={`mt-3 inline-flex rounded-md border px-2.5 py-1 text-sm font-semibold ${badgeClasses(value)}`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Suggested Customer Reply
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {analysis.suggested_customer_reply}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Internal Team Note
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {analysis.internal_team_note}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          CRM Handoff
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Push the structured analysis into a simulated CRM record.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={exportToCrm}
                        disabled={isExporting}
                        className="inline-flex h-11 items-center justify-center rounded-md bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {isExporting ? "Exporting..." : "Export to CRM"}
                      </button>
                    </div>

                    {isExporting ? (
                      <div className="mt-4 overflow-hidden rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800 transition-all duration-300">
                        Creating CRM record and mapping ticket fields...
                      </div>
                    ) : null}

                    {exportMessage ? (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 opacity-100 shadow-sm transition-all duration-500">
                        {exportMessage}
                      </div>
                    ) : null}
                  </div>

                  {crmRecord ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm transition-all duration-500">
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
                            CRM Preview
                          </p>
                          <h3 className="mt-2 text-lg font-semibold">
                            Enterprise Ticket Record
                          </h3>
                        </div>
                        <span className="rounded-md border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                          Synced
                        </span>
                      </div>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          ["CRM Record ID", crmRecord.id],
                          ["Ticket Status", crmRecord.status],
                          ["Assigned Team", crmRecord.assignedTeam],
                          ["Priority", crmRecord.priority],
                          ["Last Updated", crmRecord.lastUpdated],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                          >
                            <dt className="text-xs font-medium text-slate-300">
                              {label}
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-white">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs font-medium text-slate-300">
                          Export Timestamp
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {crmRecord.payload.export_timestamp}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-[490px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="max-w-sm">
                    <p className="text-lg font-semibold text-slate-900">
                      Ready for analysis
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Run a sample or paste a real ticket to generate structured
                      triage output.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
