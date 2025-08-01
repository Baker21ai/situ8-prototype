# Situ8 Communication Architecture

> **Last Updated:** July 30, 2025  
> **Purpose:** Visualize and explain all communication sources and their integration

## Overview: Your Communication Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FIELD OPERATIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  👮 Guard 1          👮 Guard 2          👮 Guard 3                  │
│      │                   │                   │                        │
│      └────────────┬──────┴───────┬──────────┘                        │
│                   │              │                                    │
│               [RADIO]        [RADIO]                                  │
│                   │              │                                    │
│                   ▼              ▼                                    │
│            ┌─────────────────────────┐                               │
│            │   TWILIO RADIO SYSTEM   │ ◄── Source 1: Radio Audio     │
│            │   (Voice Channels)      │                               │
│            └──────────┬──────────────┘                               │
│                       │                                               │
└───────────────────────┼───────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMMAND CENTER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 🎧 DISPATCHER   │  │ 💬 AI ASSISTANT  │  │ 📱 COMM MODULE  │   │
│  │                 │  │                  │  │                  │   │
│  │ Hears radio &   │  │ Voice + Text     │  │ SMS/Push alerts │   │
│  │ takes action    │  │ commands         │  │ to guards       │   │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                    │                      │              │
│     Source 2:            Source 3:              Source 4:           │
│     Manual Entry        Voice Commands          Text Messages       │
│           │                    │                      │              │
│           ▼                    ▼                      ▼              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      SITU8 BACKEND                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐     │  │
│  │  │ Activities  │  │  Incidents  │  │  Communications   │     │  │
│  │  │   Store     │  │    Store    │  │     Queue         │     │  │
│  │  └─────────────┘  └─────────────┘  └───────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## The 4 Input Sources Explained

### Source 1: Twilio Radio (Field → System)
```
Guard speaks ──► Radio ──► Twilio ──► Your system
"Fire in B5"                           │
                                      ▼
                            Need: Transcription + 
                                 Keyword detection

Current: Guards speak, dispatcher manually enters
Goal: Auto-transcribe and create incidents
```

### Source 2: Dispatcher Manual (Human → System)
```
Dispatcher hears ──► Types/Clicks ──► Creates incident
radio/sees event     in UI             manually
                                      │
                                      ▼
                              Current workflow
                              
Current: Working but slow and error-prone
Goal: Reduce manual work by 80%
```

### Source 3: AI Voice Chat (Human → AI → System)
```
Dispatcher/Op ──► Speaks to AI ──► AI understands ──► AI creates
"Create fire      "Create fire      intent           incident
 incident B5"      incident B5"                      automatically
                                                    │
                                                    ▼
                                            Need: Voice AI

Current: Doesn't exist
Goal: Natural language commands for all operations
```

### Source 4: Text Communications (System → Field)
```
System event ──► Comm Module ──► SMS/Push ──► Guards
"New incident"    processes      notification  receive
                                              │
                                              ▼
                                      Already built

Current: Working communications module
Goal: Keep as-is, integrate with AI actions
```

## Current vs Desired State

### Current State (Bottlenecked)
```
Radio ────┐
          ├──► Dispatcher ears ──► Manual entry ──► Database
AI ───────┘                            ↑
                                       │
                                  🚨 Bottleneck!
                                  
Problems:
- Dispatcher overwhelmed during multiple incidents
- Transcription errors when typing fast
- Delayed incident creation
- No automation
```

### Desired State (Automated)
```
Radio ────┬──► Auto-transcribe ──┐
          │                       ├──► AI processes ──► Database
AI Voice ─┴──► Direct commands ──┘          │
                                            ▼
                                    ✅ Automated + Faster
                                    
Benefits:
- Instant incident creation from radio
- Voice commands for complex tasks
- Reduced dispatcher workload
- Better accuracy
```

## v0 Implementation: Unified AI Brain

```
┌─────────────────────────────────────────────────────────────────────┐
│              UNIFIED AI PROCESSING CENTER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Inputs:                    Processing:           Actions:          │
│  ┌──────────┐              ┌─────────────┐      ┌──────────────┐  │
│  │ Radio    │──┐           │ Transcribe  │      │ Create       │  │
│  │ Audio    │  │           │ all audio   │      │ Incidents    │  │
│  └──────────┘  │           └──────┬──────┘      └──────────────┘  │
│                 ▼                  ▼                               │
│  ┌──────────┐  ┌─────────────────────────┐      ┌──────────────┐  │
│  │ Voice    │─►│  AI UNDERSTANDS INTENT  │─────►│ Update       │  │
│  │ Commands │  │  - Keywords from radio  │      │ Status       │  │
│  └──────────┘  │  - Commands from voice  │      └──────────────┘  │
│                 │  - Context awareness    │                        │
│  ┌──────────┐  └───────────┬─────────────┘      ┌──────────────┐  │
│  │ Text     │              ▼                     │ Send         │  │
│  │ Chat     │─────► Process & Route ────────────►│ Alerts       │  │
│  └──────────┘                                    └──────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Technical Flow: Radio to Incident

```
1. RADIO TRANSMISSION
   Guard: "This is Unit 5, medical emergency Building A"
   
2. TWILIO CAPTURE
   ┌────────────────────────┐
   │ Twilio Media Stream    │
   │ • Real-time audio      │
   │ • WebSocket connection │
   └───────────┬────────────┘
               ▼
               
3. TRANSCRIPTION SERVICE
   ┌────────────────────────┐
   │ Deepgram / Whisper     │
   │ • Stream processing    │
   │ • Low latency (<1s)    │
   └───────────┬────────────┘
               ▼
               
4. AI PROCESSING
   ┌────────────────────────┐
   │ Keyword Detection:     │
   │ ✓ "medical"            │
   │ ✓ "emergency"          │
   │ ✓ "Building A"         │
   └───────────┬────────────┘
               ▼
               
5. AUTO ACTION
   ┌────────────────────────┐
   │ Create Incident:       │
   │ • Type: Medical        │
   │ • Location: Building A │
   │ • Status: Pending      │
   │ • Assigned: Unit 5     │
   └───────────┬────────────┘
               ▼
               
6. NOTIFICATIONS
   ┌────────────────────────┐
   │ Communications Module: │
   │ • Alert supervisors    │
   │ • Notify nearby units  │
   │ • Update dashboard     │
   └────────────────────────┘
```

## Technical Flow: AI Voice Command

```
1. VOICE COMMAND
   Dispatcher: "Create incident for broken window in Building C"
   
2. SPEECH TO TEXT
   ┌────────────────────────┐
   │ Browser Speech API or  │
   │ OpenAI Whisper         │
   └───────────┬────────────┘
               ▼
               
3. AI UNDERSTANDING
   ┌────────────────────────┐
   │ Intent: Create Incident│
   │ Type: Property Damage  │
   │ Location: Building C   │
   └───────────┬────────────┘
               ▼
               
4. FUNCTION CALLING
   ┌────────────────────────┐
   │ createIncident({       │
   │   type: 'property-     │
   │         damage',       │
   │   location: 'C',       │
   │   priority: 'medium'   │
   │ })                     │
   └───────────┬────────────┘
               ▼
               
5. VOICE RESPONSE
   ┌────────────────────────┐
   │ AI: "Incident created  │
   │ for property damage    │
   │ in Building C.         │
   │ ID: INC-2024-0542"     │
   └────────────────────────┘
```

## v0 Technology Stack

### Core Components
```
┌─────────────────────────────────────────────────┐
│ Frontend (Next.js + Vercel)                     │
├─────────────────────────────────────────────────┤
│ • Chat UI (Text + Voice)                        │
│ • Real-time updates (WebSocket)                 │
│ • Audio capture & playback                      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ AI Processing Layer                             │
├─────────────────────────────────────────────────┤
│ • Vercel AI SDK (orchestration)                 │
│ • OpenAI/Anthropic (LLM)                        │
│ • Whisper/Deepgram (transcription)              │
│ • Function calling (actions)                    │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ Radio Integration                               │
├─────────────────────────────────────────────────┤
│ • Twilio Programmable Voice                     │
│ • Media Streams API                             │
│ • Real-time transcription                       │
│ • Keyword monitoring                            │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│ Backend Services (Supabase)                     │
├─────────────────────────────────────────────────┤
│ • Activity/Incident stores                      │
│ • Real-time subscriptions                       │
│ • Audit logging                                 │
│ • Communications queue                          │
└─────────────────────────────────────────────────┘
```

## Implementation Options for v0

### Option 1: Unified Platform (Fastest - 1 week)
```
Use Retell AI or Vapi.ai
│
├─► Handles Twilio integration
├─► Built-in transcription
├─► AI voice responses
├─► Function calling
└─► ~$500/month all-in

Pros: Ship in days, not weeks
Cons: Less customization, vendor lock-in
```

### Option 2: Custom Build (Flexible - 2-3 weeks)
```
Build with components:
│
├─► Twilio for radio
├─► Deepgram for transcription
├─► Vercel AI SDK for orchestration
├─► OpenAI for LLM
└─► ~$400-600/month

Pros: Full control, customizable
Cons: More complex, longer build
```

### Option 3: Hybrid Approach (Recommended)
```
Week 1: Basic keyword monitoring
│       └─► Twilio webhooks + simple keywords
│
Week 2: Add AI chat (text first)
│       └─► Vercel AI SDK + OpenAI
│
Week 3: Add voice capabilities
        └─► Whisper + browser TTS

Start simple, enhance based on feedback
```

## Cost Analysis

### Monthly Costs by Component
```
┌────────────────────┬─────────────┬──────────────┐
│ Component          │ Basic       │ Enhanced     │
├────────────────────┼─────────────┼──────────────┤
│ Twilio (Radio)     │ $150-200    │ $200-300     │
│ AI (OpenAI)        │ $100-150    │ $200-300     │
│ Transcription      │ $50         │ $100-200     │
│ Voice Generation   │ $0 (browser)│ $100         │
│ Hosting (Vercel)   │ $20         │ $50          │
├────────────────────┼─────────────┼──────────────┤
│ TOTAL              │ ~$320-420   │ ~$650-950    │
└────────────────────┴─────────────┴──────────────┘
```

## Key Decisions for v0

### 1. Transcription Choice
```
Browser Speech API:
✓ Free
✓ Instant
✗ Less accurate
✗ Limited languages

Deepgram/Whisper:
✓ Very accurate
✓ Many languages
✗ Costs money
✗ Slight latency
```

### 2. Voice Response Choice
```
Browser TTS:
✓ Free
✓ Instant
✗ Robotic voice

ElevenLabs/Play.ht:
✓ Natural voice
✓ Custom voices
✗ Costs money
✗ API limits
```

### 3. Integration Architecture
```
Separate Systems:
✓ Easier to build
✓ Independent scaling
✗ More complex UI
✗ Duplicate logic

Unified System:
✓ Single interface
✓ Shared context
✗ More complex
✗ Single point of failure
```

## Recommended v0 Implementation Plan

### Week 1: Foundation
- [ ] Set up Twilio webhook for radio
- [ ] Implement keyword detection
- [ ] Auto-create pending incidents
- [ ] Basic activity logging

### Week 2: AI Integration
- [ ] Add Vercel AI SDK
- [ ] Implement text chat interface
- [ ] Create function calling for actions
- [ ] Connect to existing stores

### Week 3: Voice Enhancement
- [ ] Add voice input (browser API first)
- [ ] Test with dispatchers
- [ ] Add Whisper if needed
- [ ] Voice responses for confirmations

### Week 4: Polish & Deploy
- [ ] Unified dashboard
- [ ] Error handling
- [ ] Performance optimization
- [ ] Deploy to production

## Success Metrics

```
Before AI:
- Incident creation time: 2-5 minutes
- Transcription errors: 10-15%
- Dispatcher workload: 100%

After AI (Target):
- Incident creation time: <30 seconds
- Transcription accuracy: 95%+
- Dispatcher workload: 40% reduction
```

## FAQ

### Q: Why not use AWS Transcribe in v0?
A: Complexity. AWS Transcribe requires more setup. For v0, we want fast deployment. Can migrate to AWS in v1 for compliance.

### Q: Can guards talk directly to AI?
A: Not in v0. Guards use radio → AI monitors. Direct guard-to-AI chat could be v1 feature.

### Q: What about non-English languages?
A: Whisper supports 90+ languages. Deepgram supports 30+. Browser API is limited to ~10 languages.

### Q: How do we prevent false incidents?
A: Keyword confidence thresholds + 5-minute pending validation + human oversight for critical actions.

## Conclusion

The v0 goal is to connect these communication sources:
1. **Radio** → Auto-transcribe → Create incidents
2. **Voice** → AI commands → Execute actions
3. **Text** → Chat interface → Complex queries
4. **System** → Notifications → Guard alerts

This creates a unified system where AI assists but doesn't replace human judgment, dramatically reducing manual work while maintaining security standards.