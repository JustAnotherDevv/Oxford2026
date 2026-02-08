import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-card py-24 lg:py-36">
      {/* Subtle ornamental pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--foreground) 0.5px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[13px] font-extralight tracking-wider text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Now serving 2,000+ companies worldwide
          </div>

          <h1 className="max-w-4xl font-display text-4xl font-light tracking-wide text-foreground sm:text-5xl lg:text-7xl text-balance leading-tight">
            The corporate treasury
            <br />
            <span className="text-primary italic">built for crypto</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg font-extralight leading-relaxed tracking-wide text-muted-foreground lg:text-xl">
            Manage your company&apos;s digital assets, execute multi-chain
            payments, and scale your crypto operations with institutional-grade
            security.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8 text-[15px] font-extralight tracking-wider" asChild>
              <Link to="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-[15px] font-extralight tracking-wider bg-transparent"
            >
              <a href="#features">Learn More</a>
            </Button>
          </div>

          <div className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-8 border-t border-border/50 pt-12">
            <div>
              <p className="font-display text-3xl font-light text-foreground lg:text-4xl">
                $4.2B
              </p>
              <p className="mt-2 text-[13px] font-extralight tracking-wider text-muted-foreground">
                Assets under management
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-light text-foreground lg:text-4xl">
                15+
              </p>
              <p className="mt-2 text-[13px] font-extralight tracking-wider text-muted-foreground">
                Supported chains
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-light text-foreground lg:text-4xl">
                99.99%
              </p>
              <p className="mt-2 text-[13px] font-extralight tracking-wider text-muted-foreground">
                Uptime SLA
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-3 px-4">
        {[
          { icon: Shield, label: "SOC 2 Certified" },
          { icon: Zap, label: "Instant Settlements" },
          { icon: Globe, label: "Multi-Chain Support" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-full border border-border/50 bg-secondary/50 px-5 py-2.5 text-[13px] font-extralight tracking-wider text-muted-foreground"
          >
            <item.icon className="h-3.5 w-3.5 text-primary" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
