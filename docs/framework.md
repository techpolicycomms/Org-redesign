# Organisation as Intelligence: A Redesign Framework

> Based on Block's essay [*From Hierarchy to Intelligence*](https://block.xyz/inside/from-hierarchy-to-intelligence).

For two thousand years the org chart has been an information-routing diagram dressed up as a power structure. That era is ending. When a company's world model lives in software, the middle of the chart — the human routing layer — stops earning its keep. What replaces it is not "flatter hierarchy." It is a different object entirely: an organisation designed as an intelligence system.

This document sketches that object.

---

## 1. The Problem: Two Thousand Years of Hierarchy as Routing

Every dominant org structure in recorded history has been a compromise with the same constraint: a single human can only reliably coordinate with 5–9 other humans. Every layer above the front line exists because the layer below it exceeded that span.

- **The Roman legion** (c. 100 BC) fixed the span of control at ~8. Contubernium → century → cohort → legion. It was a routing tree optimised for carrying orders across distance and noise.
- **The railroads** (1850s) productised the legion. Daniel McCallum's Erie Railroad org chart is literally the first modern hierarchy — invented because a single dispatcher could not track a continent's worth of trains in his head. The chart *was* the database.
- **The industrial corporation** (Sloan's GM, 1920s) added functional silos so that specialised knowledge could be routed without every decision climbing to the CEO.
- **Matrix orgs** (1970s) tried to let information flow in two directions at once. They mostly produced meetings.
- **Spotify squads / tribes / guilds** (2010s) were a branding exercise on top of the same span-of-control maths. Squads are teams. Tribes are departments. Guilds are committees.

Every one of these structures is a workaround for the same bottleneck: humans are slow, lossy routers. The hierarchy exists because the routing layer must exist. Take away the routing problem and most of the chart has no reason to be there.

## 2. The Shift: AI Replaces the Coordination Layer, Not the People

The naive framing is "AI will replace workers." The more interesting claim is the opposite: **AI replaces coordinators, and liberates workers.**

The work that a director of engineering actually does on a Tuesday — read status, compress status, forward status, reconcile status, schedule the meeting to reconcile status — is the work a world model does natively. A system that knows the state of every project, every customer, every commit, and every open question does not need a human to carry that state between rooms.

What the world model cannot do is the other half of the director's job: stand at the edge of the company and make a judgement call about a thing no one has seen before. That half is not going away. It's getting more valuable.

So the redesign is not "remove managers." It is **remove the routing tax from everyone, then ask what the remaining work actually is.**

## 3. The Four System Layers

A company in the intelligence era is built out of four layers. This is the architecture, not the org chart.

### Capabilities — atomic primitives
The things the company can *do*, exposed as composable units. A pricing engine. A risk model. A deploy pipeline. A legal-review function. Each capability is owned, versioned, and callable. ICs build and deepen capabilities. If a capability cannot be described as an API (human or machine), it is not yet a capability — it is a habit.

### World Model — company + customer
The living, queryable representation of what the company knows. State of every customer, every project, every asset, every promise made. This is the layer that used to live in managers' heads and in slide decks compiled for Monday reviews. It now lives in systems, and it is the single most valuable thing the company owns. **If your world model isn't getting deeper every day, you don't have one — you have a data warehouse.**

### Intelligence Layer — composes capabilities into solutions
The layer that, given a problem, decides which capabilities to call in what order, with what parameters, against what world-model state. Historically this was done by a product manager with a Jira board and a lot of Slack DMs. Increasingly it is done by software, with humans (DRIs) stepping in at the hard joints where the intelligence layer doesn't yet know what to do.

### Interfaces — delivery surfaces
Where the company meets the world. The app, the API, the support conversation, the sales call, the physical product. Interfaces are where taste, edge judgement, and customer contact actually happen. This layer is human-heavy on purpose: it is the part of the company that *learns*.

These four layers replace the traditional functional stack (eng / product / design / ops) as the primary way to think about where work lives. Functions still exist — people are still engineers or designers — but the unit of organisation is the layer, not the function.

## 4. The Three Roles

When routing disappears, the taxonomy of jobs collapses from dozens of titles into three archetypes. Most current roles are a mixture of the three plus a lot of routing tax; the redesign is about removing the tax and picking one.

### IC — the deep specialist, world-model-informed
Builds capabilities or builds interfaces. Goes deep enough on a problem that a world model alone cannot replace them. Reads the world model constantly; their judgement is *cheaper and better* because they do. An IC is measured by the depth of the capability they own and whether it is getting better, not by headcount or meetings attended.

### DRI — cross-cutting problem owner, time-boxed
Directly Responsible Individual for a specific outcome that cuts across capabilities, layers, and functions. Not a manager. Not permanent. A DRI is spun up against a problem ("ship the new onboarding flow," "recover gross margin in EMEA") and spun down when the problem is solved or reframed. The DRI has authority because they are the single named throat; they have no headcount because their leverage comes from composing the capabilities that already exist. If a DRI has to build a new team to do their job, the capability layer has a gap.

### Player-Coach — builds and develops people, no status-meeting tax
The only role that is about humans. A player-coach is an IC who also grows other ICs: mentors them, sets the bar for craft, unblocks them at the edge, spots who should be a DRI for what. The critical word is *player*: they still build. The critical phrase is *no status-meeting tax*: their calendar is not a routing table, because the world model is doing that job. A player-coach with 15 direct reports and a 40-hour week of 1:1s is a routing node in disguise — the redesign rejects that.

What is no longer a job, or is a much smaller job than it used to be: pure managers, TPMs whose work is scheduling, PMs whose work is status compression, directors whose work is re-drawing org charts, VPs whose work is presenting the sum of their org to the VP above.

## 5. The Diagnostic Question

There are many ways to measure an organisation. Most of them — headcount, retention, velocity, NPS — are lagging, and most of them can be gamed by reshuffling the routing layer.

The intelligence-era diagnostic is a single question:

> **What does your org understand that is genuinely hard to understand, and is that understanding getting deeper every day?**

If the answer is "our customers," show the world model. If the answer is "our supply chain," show the world model. If the answer is "we ship fast," that isn't understanding — that is throughput, and throughput of a shallow thing is just a faster treadmill.

A company that cannot answer this question is a routing diagram. A company that can is an intelligence. The work of the redesign is moving from the first to the second.
