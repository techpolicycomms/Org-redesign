import Link from "next/link";
import { Button, Card } from "@/components/ui";

const LAYERS = [
  {
    name: "Capabilities",
    blurb: "Atomic primitives the company exposes as composable units.",
  },
  {
    name: "World Model",
    blurb: "Living representation of company + customer. The crown jewel.",
  },
  {
    name: "Intelligence",
    blurb: "Composes capabilities into solutions against the world model.",
  },
  {
    name: "Interfaces",
    blurb: "Delivery surfaces — the place the company meets reality.",
  },
];

const ROLES = [
  {
    name: "IC",
    blurb:
      "Deep specialist. Builds a capability or interface. World-model-informed.",
  },
  {
    name: "DRI",
    blurb:
      "Directly Responsible Individual. Cross-cutting, time-boxed, composes capabilities.",
  },
  {
    name: "Player-Coach",
    blurb:
      "Still builds. Grows a small number of ICs. No status-meeting tax.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-20">
      <section className="space-y-6 pt-10">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-accent">
          Org redesign, post-hierarchy
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Redesign your org
          <br />
          for the intelligence era.
        </h1>
        <p className="max-w-2xl text-lg text-brand-muted">
          For two thousand years the org chart has been an information-routing
          diagram dressed up as a power structure. When the world model lives
          in software, most of the middle layer stops earning its keep. This
          tool helps you figure out what the new shape actually is.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/input">
            <Button>Upload org chart</Button>
          </Link>
          <Link href="/input?template=midsize-500">
            <Button variant="secondary">Try example org</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Four system layers</h2>
        <p className="text-sm text-brand-muted">
          The new architecture isn&rsquo;t departments. It&rsquo;s layers.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAYERS.map((l) => (
            <Card key={l.name}>
              <h3 className="mb-2 text-sm font-semibold text-brand-accent">
                {l.name}
              </h3>
              <p className="text-sm text-brand-muted">{l.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Three roles</h2>
        <p className="text-sm text-brand-muted">
          Every job in the new org collapses into one of these three
          archetypes.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <Card key={r.name}>
              <h3 className="mb-2 text-sm font-semibold text-brand-accent">
                {r.name}
              </h3>
              <p className="text-sm text-brand-muted">{r.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-brand-border bg-brand-surface p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-accent">
          The diagnostic
        </p>
        <p className="mt-3 text-xl text-brand-text">
          What does your org understand that is genuinely hard to understand,
          and is that understanding getting deeper every day?
        </p>
      </section>
    </div>
  );
}
