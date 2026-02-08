import { useState, useCallback } from "react";
import {
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  MoreHorizontal,
  ShoppingBag,
  Wifi,
  Snowflake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

const cards = [
  {
    id: "1",
    name: "Operations Card",
    last4: "4829",
    holder: "Acme Corp",
    expires: "09/28",
    balance: "$12,450.00",
    limit: 25000,
    spent: 12550,
    status: "active" as const,
    type: "Virtual",
    network: "Visa",
  },
  {
    id: "2",
    name: "Marketing Budget",
    last4: "7312",
    holder: "Acme Corp",
    expires: "03/27",
    balance: "$3,200.00",
    limit: 10000,
    spent: 6800,
    status: "active" as const,
    type: "Virtual",
    network: "Mastercard",
  },
  {
    id: "3",
    name: "Engineering Team",
    last4: "9054",
    holder: "Acme Corp",
    expires: "12/27",
    balance: "$8,900.00",
    limit: 15000,
    spent: 6100,
    status: "frozen" as const,
    type: "Physical",
    network: "Visa",
  },
];

const recentSpending = [
  {
    id: "1",
    merchant: "AWS Cloud Services",
    amount: "-$2,340.00",
    card: "Operations ****4829",
    date: "Feb 7, 2026",
    category: "Infrastructure",
  },
  {
    id: "2",
    merchant: "Google Ads",
    amount: "-$1,800.00",
    card: "Marketing ****7312",
    date: "Feb 6, 2026",
    category: "Advertising",
  },
  {
    id: "3",
    merchant: "Figma Enterprise",
    amount: "-$450.00",
    card: "Engineering ****9054",
    date: "Feb 5, 2026",
    category: "Software",
  },
  {
    id: "4",
    merchant: "Slack Business+",
    amount: "-$720.00",
    card: "Operations ****4829",
    date: "Feb 4, 2026",
    category: "Software",
  },
  {
    id: "5",
    merchant: "WeWork Meeting Room",
    amount: "-$350.00",
    card: "Operations ****4829",
    date: "Feb 3, 2026",
    category: "Office",
  },
];

export default function CardsPage() {
  const [showNumbers, setShowNumbers] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const shine = card.querySelector("[data-shine]") as HTMLDivElement | null;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.transition = "transform 0.1s ease-out";
    if (shine) {
      shine.style.opacity = "1";
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`;
    }
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const shine = card.querySelector("[data-shine]") as HTMLDivElement | null;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.transition = "transform 0.4s ease-out";
    if (shine) {
      shine.style.opacity = "0";
      shine.style.transition = "opacity 0.4s ease-out";
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Cards
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage virtual and physical cards for your team.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setShowNumbers(!showNumbers)}>
            {showNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showNumbers ? "Hide" : "Show"} Details
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Issue Card
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative overflow-hidden rounded-2xl border border-border p-6 will-change-transform"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              background:
                card.status === "frozen"
                  ? "linear-gradient(135deg, hsl(220, 14%, 10%), hsl(220, 14%, 15%))"
                  : "linear-gradient(135deg, hsl(220, 14%, 7%), hsl(160, 84%, 15%))",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              data-shine
              className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300"
            />

            {card.status === "frozen" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <Snowflake className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Card Frozen
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="border-border/40 bg-background/10 text-foreground/70 text-xs"
              >
                {card.type}
              </Badge>
              <span className="text-xs font-medium text-foreground/60">
                {card.network}
              </span>
            </div>

            <div className="mt-6">
              <Wifi className="h-6 w-6 text-foreground/40 rotate-90" />
            </div>

            <p className="mt-4 font-mono text-lg tracking-widest text-foreground/80">
              {showNumbers
                ? `**** **** **** ${card.last4}`
                : "**** **** **** ****"}
            </p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/40">
                  Card Holder
                </p>
                <p className="text-sm font-medium text-foreground/80">
                  {card.holder}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-foreground/40">
                  Expires
                </p>
                <p className="text-sm font-medium text-foreground/80">
                  {showNumbers ? card.expires : "**/**"}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-foreground/10 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/50">{card.name}</span>
                <span className="font-medium text-foreground/70">
                  {card.balance}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card details + spending */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending limits */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Spending Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5">
              {cards.map((card) => {
                const percentage = Math.round(
                  (card.spent / card.limit) * 100
                );
                return (
                  <div key={card.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-card-foreground">
                          {card.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ${card.spent.toLocaleString()} / $
                        {card.limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {percentage}% used
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {card.status === "frozen" ? "Frozen" : "Active"}
                        </span>
                        <Switch
                          checked={card.status === "active"}
                          disabled
                          className="scale-75"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent card spending */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Recent Card Spending
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {recentSpending.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {tx.merchant}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.card} &middot; {tx.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-card-foreground">
                      {tx.amount}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {tx.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
