import { Lock, Fingerprint, KeyRound, FileCheck } from "lucide-react";

const items = [
  {
    icon: Lock,
    title: "Cold Storage Vaults",
    description:
      "95% of assets stored in air-gapped cold storage with geographic distribution.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Auth",
    description:
      "Multi-factor authentication with biometric verification for every transaction.",
  },
  {
    icon: KeyRound,
    title: "Multi-Sig Approval",
    description:
      "Configure custom approval policies with M-of-N multi-signature requirements.",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    description:
      "Independently audited security controls with continuous compliance monitoring.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-primary">
              Security
            </p>
            <h2 className="mt-4 font-display text-3xl font-light tracking-wide text-foreground lg:text-4xl text-balance">
              Institutional-grade protection for your digital assets
            </h2>
            <p className="mt-5 font-extralight tracking-wide leading-relaxed text-muted-foreground">
              Renaissance employs the same security infrastructure trusted by
              the world&apos;s largest financial institutions, adapted for the
              unique challenges of digital asset custody.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/50 bg-background p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/15 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-display text-[15px] font-light tracking-wide text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] font-extralight leading-relaxed tracking-wide text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
