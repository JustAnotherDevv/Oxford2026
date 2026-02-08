import {
  Wallet,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  BarChart3,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "Multi-Asset Wallets",
    description:
      "Manage BTC, ETH, USDC, and 50+ tokens across multiple chains from a single dashboard.",
  },
  {
    icon: ArrowLeftRight,
    title: "Instant Payments",
    description:
      "Send and receive crypto payments globally with near-instant settlement and minimal fees.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Role-based access controls, approval workflows, and spending limits for your entire team.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "Multi-sig wallets, cold storage integration, and SOC 2 compliance for peace of mind.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track portfolio performance, transaction history, and cash flow with detailed reporting.",
  },
  {
    icon: Globe,
    title: "Cross-Border Treasury",
    description:
      "Settle international invoices and manage multi-currency operations without intermediaries.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Everything your company needs to operate in crypto
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From custody to compliance, Renaissance provides the complete
            toolkit for corporate digital asset management.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border bg-card transition-colors hover:border-primary/30"
            >
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
