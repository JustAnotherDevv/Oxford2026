import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section id="pricing" className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-6 py-16 text-center lg:px-16">
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl text-balance">
              Ready to modernize your corporate treasury?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of companies already managing their digital assets
              with Renaissance. Get started in minutes with no setup fees.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link to="/dashboard">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 bg-transparent"
              >
                <a href="#about">Talk to Sales</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
