# PHIL'S COMPLETE REQUIREMENTS FOR SITU8

## 1. COMMAND CENTER MODULE

| Feature | Requirement | Phil's Quote |
|---------|-------------|--------------|
| **Hierarchical Navigation** | Sites → Buildings/Parking → Floors → Rooms → Assets | "So what I would see is like maybe we break it up by sites and then we have a hierarchy right so each have several buildings and parking lots and then each building can have different floors" |
| **Drill-Down Capability** | Click site → see buildings → click building → see floors | "When you click on one of those like building a it would help you drill down into what buildings are in that site" |
| **Map Upload** | Support JPEG floor plans | "And then the maps themselves they could be they could just be a JPEG" |
| **Map Editing** | Drag and drop guards, cameras, items onto maps | "Right that you can drag and drop, but the user will need to edit those maps and dragon drop items to the appropriate spaces" |
| **Auto-Scaling** | Icons resize for large facilities (1M sq ft) | "You might have a 1 million square-foot map in there. And these icons like where the cameras are might need to be really tiny" |
| **Guard Display** | Name, location, status (Responding/Patrolling/Available/Break) | "I like it kind of has the guards name with their location with their current location is the current activities" |
| **Guard Profile** | Click guard → see all radio traffic, activities, chronological | "Clicked on Garcia M, and then it pulls up their profile almost right and filters out stuff based on them" |
| **Two View Modes** | Guard panel has two different views | "There's two views for the guards" |
| **Messaging** | Direct message guards | "The other thing being able to message him, I like that" |
| **Activity Stream** | Shows incidents with embedded visual evidence | Discussion throughout about seeing GIFs in activities |
| **Sticky Headers** | Assigned incidents stay at top | "Yes, I agree and then everything else should bring it to the top. Let everything else scroll but it be frozen at the top" |
| **Sidebar Issue** | Dual sidebars are confusing | "It's a little bit confusing because you have a side bar on the left and the side bar on the right" |

## 2. INCIDENT MANAGEMENT

| Feature | Requirement | Phil's Quote |
|---------|-------------|--------------|
| **NO Auto-Assignment** | Manual review required for ALL incidents | "Person brandishing firearm... No, someone has to review it. Make sure that someone's actually branch a fire on." |
| **Double-Click Detail** | Double-click incident → opens detail view | "I just wanna double click on it right and then have it open up into an incident" |
| **Multi-Role Assignment** | Complex incidents need multiple guards with different roles | "Fire alarm went off right you probably need. A few of those people... Someone might have to go down and meet the fire department. Someone might have to do sweeps" |
| **Assignment Interface** | Drag guards to incident or click to assign | "Have a section in there that that has assigning people to it right and then one side and maybe that's a dragon drop" |
| **Camera Integration** | View GIF that triggered alert | "I'd love to view the cameras in the area right so I wanna know if there's any associated cameras" |
| **AI Reasoning** | Show why AI made detection | "I wanna kind of see why the ambient decided that that was a judgment" |
| **Adjacent Cameras** | Quick access to nearby cameras | "I'd also want to be able to See any adjacent cameras that might be a look at the same area" |
| **Video Options** | Live feed and recorded playback | "And then and then being able to from there if you live video recorded video review" |
| **Dispatch Options** | Dispatch additional, broadcast, escalate | "Could potentially dispatch additional or broadcast or escalate to supervisor" |
| **Supervisor Escalation** | Send text message to supervisor | "That way That alert is sent via text messages or something to that" |

## 3. ACTIVITIES PAGE MODULE

| Feature | Requirement | Phil's Quote |
|---------|-------------|--------------|
| **Purpose** | "Refined view" for detailed investigation | "Everything can happen from the dashboard, but if you need a more like refined view, the activities pages where to go to" |
| **Chronological View** | Option to see everything in time order | "I wanna be able to just see everything that's happening in chronological order as well" |
| **Priority View** | Iceberg visualization (Critical/High/Medium/Low) | "I see you have those group as you know critical high and medium" |
| **Radio Traffic** | Integrated into activities | "Activities tab will have radio traffic, right" |
| **Timeline Context** | Click event → see ±15 minutes around it | "I kind of want to see in context of what else is going on at the same time" |
| **Show All Priorities** | Timeline shows low priority with critical | "It might be critical, but then there were like five other low things that happened" |
| **Pattern Detection** | See sequences like badge → tailgate → next person | "Or if there was a tailgate after him right... shows me like the timeline of things that are happening" |
| **Auto-Filtering** | By role/location, not user-changeable | "Actually should probably find that for them. They should probably not be able to change that" |
| **Quick Filters** | Needs Action, Assigned to Me, My Zone | Discussed in context of activities page |
| **Case Integration** | Escalate to case, create case, add to case | "Should be able to click on critical... escalate to case or or create a case from it" |

## 4. CASE MANAGEMENT MODULE

| Feature | Requirement | Phil's Quote |
|---------|-------------|--------------|
| **Create from Activity** | Click activity → create case | "From the activity management should be able to click on critical on that critical alarm... create a case from it" |
| **Escalate to Case** | One-click escalation option | "Escalate to case or or create a case from it" |
| **Add to Existing** | Assign activities to existing cases | "Or assign two case" |
| **Include Low Priority** | Can pull low priority items into cases | "You're gonna be maybe you're gonna be pulling in information that is low but assigning into the case" |
| **Multiple Access Points** | Available from Command Center and Activities | "Well, do it from here as well right" |
| **Drag to Add** | Drag activities to add to case | General discussion about drag and drop functionality |

## 5. ADDITIONAL MODULES (Empty/Future)

| Module | Status | Phil's Quote |
|--------|--------|--------------|
| **Lost and Found** | Empty, to be developed | "Lost and found OK lost and found" |
| **Key Management** | Empty, to be developed | "Lost and found you're probably gonna have key management as well" |
| **Pass Downs** | Empty, to be developed | "No, this is they're all empty. This is just like yeah reports past downs all that's empty" |
| **Reports** | Empty, to be developed | "Reports past downs all that's empty" |

## 6. ADMIN/CONFIGURATION MODULE

| Feature | Requirement | Phil's Quote |
|---------|-------------|--------------|
| **Innovation Toggles** | Toggle different AI agents on/off | "I would say there's different types of agents that you can toggle on and off, right" |
| **Agent Explanations** | Good descriptions of what each does | "You'd also want like good explanation as to what it's doing and you know what to expect from it" |
| **API Key Management** | Secure handling of API keys | "We're gonna have to figure out a way to building our product on the admin side a way to accept secure keys encryption" |
| **Identity Management** | SAML/SSO integration | "How to handle Samuel Right And every single sign on stuff identity provider integrations" |
| **Admin Only Access** | Restricted to administrators | "Right that would be another thing... the admin yeah" |

## 7. DEVELOPMENT APPROACH

| Principle | Requirement | Phil's Quote |
|-----------|-------------|--------------|
| **Prototype First** | Build frontend demo before infrastructure | "Yeah, build yourself and show us and say you know this is what we should be doing" |
| **Mock Data** | Use AI to generate fake events | "Get get get in and if you need to have Claude or have cursor or whatever Create pretend live event events" |
| **Simple Implementation** | Don't over-engineer | "We can do it with sticks and pictures if we want to" |
| **Frontend Priority** | Get visual demo working first | "This is what it should look like at the end of the day. This is a prototype" |
| **Customer Focus** | Need something to show/sell | "We don't get a customer if there is there's nothing to sell them" |
| **Stop Infrastructure** | Product before servers | "I feel like we're messing around with the infrastructure like unplugging and plugging the servers in" |

## 8. BUSINESS REQUIREMENTS

| Need | Context | Phil's Quote |
|------|---------|--------------|
| **Demo Screenshots** | For customer presentations | "I'm gonna be going in front of people... right now I can't say situate I can't give an example or a screenshot" |
| **Ambient Partnership** | Ready to activate | "We have a partnership with ambient that all we have to do is say here's the product" |
| **Lined Up Customers** | Ready to sign | "We have lined up customers, right?" |
| **Time Pressure** | Opportunity is now | "It's being served up so easily to us" |
| **Team Understanding** | River needs to understand opportunity | "Does River know that like they out of all startups... this one has like the most things going on" |

## 9. CORE DESIGN PRINCIPLES

| Principle | Description | Phil's Quote |
|-----------|-------------|--------------|
| **Navigation Philosophy** | Easy access to everything | "Get to anywhere from almost anywhere" |
| **Manual Verification** | No automatic actions on critical incidents | "No, someone has to review it" |
| **Visual Evidence First** | GIFs embedded in activity cards | Discussion about seeing evidence immediately |
| **Context Matters** | Always show surrounding events | "See in context of what else is going on" |
| **Role-Based Views** | Auto-filter by user role/location | "Tied to their role and their location" |
| **Investigation Focus** | Activities page for deep analysis | "Refined view" concept |