# AI Customer Support Workflow Demo

[Live Demo](https://ai-automation-ticket-workflow.vercel.app/)

A polished Solutions Engineer portfolio demo that shows how AI can turn unstructured customer support tickets into structured workflow outputs for a SaaS support organization.

## Project Overview

This Next.js app lets a user paste a customer support ticket, run an AI analysis, view the result as clean operational cards, and simulate exporting the enriched ticket into a CRM record. The app includes sample tickets, mock dashboard metrics, loading states, error handling, CRM export states, and a server-side API route that calls the OpenAI API using `OPENAI_API_KEY`.

## Business Problem

Support teams often receive high volumes of unstructured customer messages. Agents and managers need to quickly understand the issue, detect urgency, route work to the right team, and respond with the right tone. Manual triage slows response times and creates inconsistent customer experiences.

## Solution

The demo uses AI to classify and summarize support tickets, then returns structured JSON with:

- `summary`
- `category`
- `urgency`
- `sentiment`
- `suggested_customer_reply`
- `internal_team_note`

The result gives support teams a repeatable workflow artifact that can be connected to ticketing systems, CRM records, customer success handoffs, or escalation processes.

## CRM Export Workflow

After a ticket is analyzed, the user can click "Export to CRM" to simulate pushing the structured AI output into an enterprise CRM or support platform. The simulated payload includes:

- Customer issue summary
- Category
- Urgency
- Sentiment
- Suggested reply
- Internal team note
- Export timestamp

The UI then displays a CRM preview with a mock record ID, ticket status, assigned team, priority, and last updated timestamp. This mirrors the kind of confirmation a Solutions Engineer might show when demonstrating workflow automation to support, success, or operations stakeholders.

## Enterprise Integration Use Case

In a production implementation, the export step could be replaced with a secure server-side API route that writes the enriched ticket data to systems such as Salesforce, HubSpot, Zendesk, Intercom, or a custom customer operations platform. The AI output could map to CRM case fields, ticket custom fields, routing queues, escalation workflows, or customer health signals.

This demo simulates SaaS workflow automation by showing the full path from unstructured text to structured AI analysis to downstream system handoff. It demonstrates how AI can improve speed, consistency, and operational visibility without requiring agents to manually copy summaries or routing notes between tools.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- OpenAI Responses API

## How To Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your OpenAI API key:

   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open the local URL shown in your terminal, usually:

   ```bash
   http://localhost:3000
   ```

Optional: set `OPENAI_MODEL` in `.env.local` to override the default model.

## Demo Script

1. Open the dashboard and point out the mock operational metrics.
2. Click a sample ticket, such as "Login Outage."
3. Explain that the ticket is unstructured text, similar to what arrives in a help desk queue.
4. Click "Analyze Ticket."
5. Walk through the structured output:
   - Summary for fast context.
   - Category for routing.
   - Urgency for prioritization.
   - Sentiment for customer health.
   - Suggested customer reply for agent acceleration.
   - Internal team note for escalation and handoff.
6. Click "Export to CRM" and point out the loading state, success confirmation, and CRM preview record.
7. Explain how the same pattern could be integrated with Zendesk, Salesforce, HubSpot, Intercom, Slack, or a custom CRM.

## What This Demonstrates For Solutions Engineering Roles

- Translating a real business workflow into a usable technical demo.
- Designing an AI workflow with structured outputs instead of free-form text.
- Protecting API keys by calling OpenAI from a server-side route.
- Building a polished SaaS-style interface for executive or customer-facing demos.
- Communicating implementation value across support, customer success, and operations stakeholders.
- Showing how AI output can be operationalized in downstream systems.
- Demonstrating enterprise workflow automation from AI analysis to CRM handoff.
