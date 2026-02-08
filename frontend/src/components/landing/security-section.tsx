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
    <section id="security" className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Security
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground lg:text-4xl text-balance">
              Institutional-grade protection for your digital assets
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Renaissance employs the same security infrastructure trusted by
              the world&apos;s largest financial institutions, adapted for the
              unique challenges of digital asset custody.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
