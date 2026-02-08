import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-32">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Now serving 2,000+ companies worldwide
          </div>

          {/* Heading */}
          <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-7xl text-balance">
            The corporate treasury
            <br />
            <span className="text-primary">built for crypto</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Manage your company&apos;s digital assets, execute multi-chain
            payments, and scale your crypto operations with institutional-grade
            security.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8 text-base" asChild>
              <Link to="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-base bg-transparent"
            >
              <a href="#features">Learn More</a>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-8 border-t border-border pt-10">
            <div>
              <p className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                $4.2B
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Assets under management
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                15+
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Supported chains
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                99.99%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Uptime SLA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature pills floating */}
      <div className="relative mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-3 px-4">
        {[
          { icon: Shield, label: "SOC 2 Certified" },
          { icon: Zap, label: "Instant Settlements" },
          { icon: Globe, label: "Multi-Chain Support" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground"
          >
            <item.icon className="h-4 w-4 text-primary" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
