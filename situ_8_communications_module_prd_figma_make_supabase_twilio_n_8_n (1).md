# Situ8 Communications Module PRD — Figma Make + Supabase + Twilio + n8n

**Status:** Draft v0.1\
**Owner:** Vita / Situ8 PM\
**Date:** July 27, 2025\
**Platforms:** Web (desktop-first, responsive), iOS/Android later\
**Stacks:** Figma Make (React + Tailwind + shadcn/ui), Supabase (Auth, Postgres, Storage, RLS), Twilio (Voice, Conversations, Media Streams), n8n (automation)

---

## 1. Purpose & Outcomes

Build a **fully integrated Communications Module** consisting of:

1. **Radio Center (PTT)** — live WebRTC push‑to‑talk voice with speaking indicators, optional recording, and real‑time transcription to drive automations.
2. **In‑App Messaging Center** — secure, persistent text messaging for DMs, teams, and incident threads, unified with the Radio Center timeline.

**Primary outcomes**

- Guards and dispatch can coordinate quickly via **embedded voice and text** without leaving Situ8.
- **Every voice utterance can be transcribed and converted into structured events** that trigger **n8n workflows** (e.g., tailgating → dispatch + door lockdown proposal).
- **Compliance-ready data handling** with RBAC, audit logs, and retention controls.

**Non-goals (v0)**

- PSTN/phone bridging, WhatsApp/Telegram relays, or external federation.
- Native iOS/Android PTT (will follow after web proves UX & flows).

---

## 2. Personas & Core Jobs

- **Guard / Officer** — speak/listen, send quick messages, trigger SOS, attach photos, see assignments.
- **Dispatcher** — monitor many channels, approve actions, record key calls, supervise SOS.
- **Supervisor** — review transcripts, approve automations, audit history, manage retention.
- **Admin** — configure roles, policies, secrets; monitor quality & compliance.

**Top jobs-to-be-done**

- "**Hold to talk** and be heard by the right people instantly."
- "**See a single timeline** of text, voice transcripts, and bot actions for each incident."
- "**Automatically create actions** when radio phrases match known intents."

---

## 3. Scope (v0)

### Included

- Docked **Radio Tray** with channels, now‑speaking, PTT, mini-thread.
- **Comms Modal** to work in place without navigation.
- **Full Comms Page** with inbox, channel view, members, files, settings.
- **In‑App Messaging** (DMs, Teams, Incident Threads) with presence, read receipts, media.
- **Transcription pipeline** (Twilio Media Streams → ASR microservice → Supabase) and **n8n webhook dispatch**.
- **Audit logs**, **quality metrics**, **basic admin policies** (recording, retention).

### Deferred (capture in backlog)

- Mobile native PTT, offline queueing, geo‑based auto‑channels, PSTN bridging, noise suppression tuning, biometric SOS, SSO (SAML/OIDC) beyond Supabase.

---

## 4. Information Architecture

```
Communications
├─ Radio Tray (docked in Command Center)
├─ Comms Modal (expand-in-place)
├─ Comms Page (full hub)
│  ├─ Inbox: All / Incidents / Teams / Directs / Pinned
│  └─ Channel View: Header • Voice Bar • Thread • Members • Files • Settings
├─ Direct Messages
├─ Incident Threads
├─ Team Threads
├─ Notifications Center (Mentions, Alerts/SOS, Approvals, System)
├─ SOS Dashboard
├─ AI / Transcription Monitor
├─ Automation (n8n): Triggers • Recent Events • Failed/Retry
├─ Quality & Insights
├─ Audit Logs
└─ Admin / Compliance (RBAC, Recording, Transcription, Retention, Devices, Webhooks, HIPAA/BAA)
```

---

## 5. Key User Flows

### 5.1 Push‑to‑Talk (PTT) voice

1. User presses **PTT** → client acquires token → WebRTC call to Twilio **TwiML App**.
2. Audio routes to target **client(s)** in the active channel.
3. In parallel, audio is mirrored via **Media Streams** to our **ASR microservice**.
4. Transcript returned → stored → shown in thread → **normalized event** posted to **n8n**.
5. If workflow requires approvals, create **pending action**; supervisor can approve/deny.

### 5.2 In‑App Message with incident linking

1. User opens thread (Incident/Team/DM) and sends a message or attachment.
2. Message persists in Twilio Conversations; webhook posts to Situ8 → store + audit.
3. If message matches an automation intent, generate normalized event → **n8n**.

### 5.3 SOS trigger

1. User taps **SOS** in radio tray or mobile.
2. Immediate broadcast to **Dispatch/All‑Call**; create SOS incident; notify responders.
3. SOS Dashboard shows live feed, responders, actions queue.
4. Supervisor can approve critical actions.

### 5.4 Approvals

- Approvals appear in **Notifications Center** and related thread.
- Approve/deny updates the action, triggers follow‑on workflow, and writes to audit log.

---

## 6. UI Requirements (Figma Make directives)

**Global**

- Use Figma Make to generate **React + Tailwind + shadcn/ui** components.
- Layout: grid‑based, ample padding, rounded‑2xl, soft shadows; responsive cards and modals.
- Provide **keyboard shortcuts** (PTT, mute, next/prev channel, search).
- Persist **light/dark** system preference.

**Components to generate**

1. **RadioTray**
   - ChannelList, NowSpeaking, PTTButton, TextMiniThread, ExpandButton.
2. **CommsModal**
   - Sidebar(Channels, Members), VoiceBar(VU, Latency/Jitter, Mute/Deafen/Record, Monitor, Handover, SOS), Thread (mixed text + transcripts + actions), Composer, Tabs(Files, Settings).
3. **CommsPage**
   - Inbox filters, GlobalSearch, ChannelView (Header stats, VoiceBar, Thread, Members, Files/Recordings, Settings panel).
4. **NotificationsCenter**
   - Tabs: Mentions, Alerts/SOS, Approvals, System; actionable rows.
5. **SOSDashboard**
   - Live feed, Active responders, Actions queue with approvals.
6. **AITranscriptionMonitor**
   - Table of transcripts with confidence, intents, entities, n8n dispatch status; detail panel.
7. **AutomationConsole**
   - Triggers catalog, Recent events, Failed/Retry.
8. **QualityInsights**
   - Summary tiles + charts for latency, jitter, packet loss; recent calls.
9. **AuditLogs**
   - Filterable list (Voice, Messages, Admin).
10. **AdminCompliance**
    - RBAC matrix; Recording/Transcription/Retention forms; Device registry; Webhooks & Secrets; HIPAA/BAA status.

**States & badges**

- Speaking ●, Listening ○, Muted 🚫, Deafened 🔇, Recording ⬤, Bot 🤖, SOS 🆘, Latency ⚡, Quality 📶 (good/fair/poor).

**Accessibility**

- Full keyboard nav; ARIA roles for live regions; captions/transcripts; high-contrast mode.

---

## 7. Data Model (Supabase Postgres)

> Use **RLS** on all tables. Policies based on `org_id`, `role`, and membership in incidents/channels.

**users**

- `id` (uuid, pk)
- `org_id` (uuid)
- `display_name`
- `role` (enum: guard, dispatcher, supervisor, admin)
- `twilio_identity` (text)
- `created_at`

**incidents**

- `id` (uuid, pk)
- `org_id`
- `title`
- `status` (open, active, closed)
- `conversation_sid` (text)
- `created_by` (uuid)
- `created_at`

**voice\_calls**

- `id` (uuid, pk)
- `org_id`
- `incident_id` (uuid)
- `channel_sid` (text)
- `call_sid` (text)
- `from_identity` (text)
- `to_identity` (text)
- `started_at` `ended_at`
- `duration_sec`
- `recording_sid` (text, nullable)
- `latency_ms` `jitter_ms` `loss_pct` (nullable)

**transcripts**

- `id` (uuid, pk)
- `org_id`
- `incident_id` (uuid, nullable)
- `call_sid` (text, nullable)
- `message_sid` (text, nullable)
- `speaker_identity` (text)
- `text` (text)
- `intent` (text)
- `entities` (jsonb)
- `confidence` (float)
- `created_at`

**automation\_events**

- `id` (uuid, pk)
- `org_id`
- `source` (enum: radio, text, sos, system)
- `incident_id` (uuid, nullable)
- `payload` (jsonb)
- `status` (queued, sent, failed)
- `dispatched_at` (timestamp, nullable)
- `retries` (int)

**approvals**

- `id` (uuid, pk)
- `org_id`
- `incident_id` (uuid)
- `type` (text)
- `payload` (jsonb)
- `status` (pending, approved, denied)
- `requested_by` (uuid)
- `decided_by` (uuid, nullable)
- `decided_at` (timestamp, nullable)

**audit\_logs**

- `id` (uuid, pk)
- `org_id`
- `actor_user_id` (uuid, nullable for system)
- `action` (text)
- `context` (jsonb)
- `created_at`

**quality\_metrics**

- `id` (uuid, pk)
- `org_id`
- `call_sid` (text)
- `latency_ms` `jitter_ms` `loss_pct`
- `collected_at`

**devices**

- `id` (uuid, pk)
- `org_id`
- `user_id` (uuid)
- `platform` (web, ios, android)
- `push_token` (text)
- `created_at`

**storage**

- Use **Supabase Storage** buckets with signed URLs for voice recordings, attachments.
- Folders by `org_id/incident_id/...`
- RLS: signed URL + policy enforcement.

---

## 8. External Services & Secrets

- **Twilio**: `ACCOUNT_SID`, `API_KEY`, `API_SECRET`, `CONVERSATIONS_SERVICE_SID (IS...)`, `TWIML_APP_SID (AP...)`, optional `PUSH_CREDENTIAL_SID`.
- **ASR microservice**: internal token for WebSocket auth.
- **n8n**: webhook base URL + HMAC shared secret.

Store secrets in Supabase **Vault/Config** or server env; never in client.

---

## 9. Client–Server Interfaces (high level)

> Keep code out; list shapes so AI can infer.

**Auth**

- Supabase Auth (email/password to start).
- Map Supabase `user.id` to `users.id` and `twilio_identity`.

**Token issuance**

- `POST /api/comms/token` → returns short‑lived JWT with **ChatGrant + VoiceGrant** for `identity`.

**Conversations**

- `POST /api/comms/conversations` (incidentId) → ensure/find channel; add participants.
- `GET /api/comms/conversations/:incidentId` → sids + metadata.

**Voice**

- `POST /twiml/voice` → TwiML response: dial client(s) + optional `<Connect><Stream url=...>`.
- `WS /media` → receive PCM frames; emit transcripts to `/api/transcripts`.

**Webhooks**

- `/webhooks/twilio/conversations` → message added/updated, membership, delivery state.
- `/webhooks/twilio/voice` → call status, recording ready.

**Automation dispatch**

- `POST /api/automation/events` → enqueue → **POST** to n8n webhook; update status.

---

## 10. Normalized Event (to n8n)

```json
{
  "source": "radio",               
  "orgId": "org-123",
  "incidentId": "4821",
  "channelSid": "CHxxx",
  "callSid": "CAxxx",
  "messageSid": null,
  "speaker": { "id": "user-123", "name": "Alex M." },
  "timestamp": "2025-07-27T08:12:03Z",
  "transcript": "Tailgating at Door 7. Dispatching.",
  "intent": "SEC_TAILGATE",
  "entities": { "door": "7", "location": "Loading Dock" },
  "confidence": 0.94,
  "actions": [
    { "type": "CREATE_ACTION", "actionType": "LOCKDOWN_REQUEST", "target": "Door-7" }
  ]
}
```

---

## 11. Compliance & Security

- Execute BAA when needed; restrict to eligible products.
- **Short‑lived tokens** (≤10 min) with silent refresh.
- **TLS/SRTP** for media; verify Twilio webhook signatures.
- **Encryption at rest** for recordings; signed URL access; retention windows.
- **RLS everywhere**; RBAC gates: guard/dispatcher/supervisor/admin.
- **Audit every sensitive action** (PTT start/stop, recording toggle, approval, purge/export).

**Retention defaults (editable by Admin)**

- Messages: 365 days
- Voice recordings: 90 days
- Transcripts: 180 days
- Audit logs: 2 years

---

## 12. Telemetry & Quality

- Collect **latency, jitter, packet loss, MOS** when available; aggregate by channel and time window.
- Emit client perf beacons (connect time, PTT start‑to‑first‑packet, errors).
- Surface **Quality & Insights** dashboard; thresholds for poor quality banners.

---

## 13. Acceptance Criteria (v0)

1. Two browser users can join the same incident channel and **exchange text + attachments**.
2. **PTT**: press and hold connects live voice between two clients; speaking indicator and timer update in real time.
3. Optional mode streams audio to **Media Streams**; a transcript appears in the thread within **<2s** after speech end.
4. A transcript with recognized intent is **posted to n8n** and marked **sent** in the Automation console.
5. **SOS** triggers broadcast, creates an SOS incident, and appears in Notifications + SOS Dashboard.
6. Tokens expire and refresh without dropping active sessions.
7. RLS prevents cross‑org data access; audit logs record critical actions.

---

## 14. Phased Rollout

- **v0 (this PRD):** Web PTT + Messaging, transcripts → n8n, basic admin & audit.
- **v0.5:** Approvals, Quality dashboard, richer Notifications.
- **v1.0:** Mobile PWA polish, push notifications, recording encryption policy UI.
- **v1.5:** Native mobile, offline queue, PSTN bridge (optional), SSO enterprise.

---

## 15. Risks & Mitigations

- **Latency/Jitter on poor networks** → quality banner, retry, monitor mode, codec tuning.
- **ASR accuracy** → domain vocabulary, confidence gating, human confirmation for critical actions.
- **Cost creep** → MAU budgeting, sampling for recordings, storage lifecycle policies.
- **Compliance drift** → configuration guardrails; product flags to disable ineligible channels.

---

## 16. Open Questions

1. Which ASR engine do we prefer for on‑prem/PHI scenarios?
2. Do we require dual‑path audio (client + AI) for every call or only tagged channels?
3. What is the minimum acceptable transcript confidence for auto‑action creation?
4. Do we need a dispatcher override to force‑record certain channels?
5. What are the org‑level limits for retention and export (legal hold scenarios)?

---

## 17. Figma Make Prompts (seed)

Use these when driving Figma Make to generate UI and code scaffolds.

**Global prompt**

> "Create a responsive Communications Module for a security command center using React + Tailwind + shadcn/ui. Provide a docked Radio Tray, an expandable Comms Modal, and a full Communications page with Inbox filters, Channel View, Members, Files, and Settings. Include a Push‑to‑Talk button with hold and latch behaviors, Now Speaking bar with VU meter, latency and jitter readouts, and badges for muted, deafened, recording, bot, and SOS. Provide keyboard shortcuts, light/dark themes, and accessibility roles. Output clean component files and a minimal state store with mock data."

**Radio Tray prompt**

> "Design a compact right‑rail Radio Tray with ChannelList, NowSpeaking, PTTButton, and TextMiniThread. Ensure it scales from 320px width to 420px. Add an Expand button that opens a modal preserving state. Provide loading, disconnected, and poor‑quality states."

**Comms Modal prompt**

> "Create an in‑place Comms Modal with a sidebar of Channels and Members, a VoiceBar with VU meter and quality stats, a mixed Thread timeline (text, transcripts, actions), and a Composer with mentions, attachments, and voice notes. Add tabs for Files and Settings."

**Comms Page prompt**

> "Build a full Communications page with left Inbox filters (All, Incidents, Teams, Directs, Pinned), a searchable Channel View header with stats and linked incidents, VoiceBar, Thread, Members, Files/Recordings grid, and Channel Settings."

**Admin Compliance prompt**

> "Add an Admin/Compliance screen with RBAC matrix, Recording/Transcription/Retention policies, Device registry, Webhooks/Secrets manager, and HIPAA/BAA status. Use safe defaults and explanatory helper text."

---

## 18. Delivery Checklist (engineering)

- Twilio console objects created; secrets stored.
- Supabase tables, RLS policies, and Storage buckets provisioned.
- Token endpoint, conversations CRUD, TwiML handler, Media Streams WS, webhook handlers online.
- Figma Make outputs imported; mock data swapped for live SDKs behind feature flags.
- n8n flows created for `SEC_TAILGATE`, `SOS_TRIGGER`, and a generic "unknown intent" logger.
- QA script run; acceptance criteria met; demo GIF recorded.

---

**End of PRD**

