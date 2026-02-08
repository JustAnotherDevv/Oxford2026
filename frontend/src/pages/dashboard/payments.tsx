import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const allTransactions = [
  {
    id: "TX-001",
    type: "outgoing" as const,
    label: "Vendor Payment - CloudServe Inc.",
    amount: "-12,500.00 USDT",
    chain: "Ethereum",
    status: "Completed" as const,
    date: "Feb 7, 2026",
    address: "0x1a2b...3c4d",
  },
  {
    id: "TX-002",
    type: "incoming" as const,
    label: "Client Payment - TechFlow Ltd.",
    amount: "+45,000.00 USDT",
    chain: "Polygon",
    status: "Completed" as const,
    date: "Feb 7, 2026",
    address: "0x5e6f...7g8h",
  },
  {
    id: "TX-003",
    type: "outgoing" as const,
    label: "Payroll Batch #127",
    amount: "-87,320.00 USDT",
    chain: "Arbitrum",
    status: "Pending" as const,
    date: "Feb 7, 2026",
    address: "0x9i0j...1k2l",
  },
  {
    id: "TX-004",
    type: "incoming" as const,
    label: "Staking Rewards - Q1 2026",
    amount: "+1,247.83 ETH",
    chain: "Ethereum",
    status: "Completed" as const,
    date: "Feb 6, 2026",
    address: "0x3m4n...5o6p",
  },
  {
    id: "TX-005",
    type: "outgoing" as const,
    label: "SaaS Subscription - DevTools Pro",
    amount: "-2,400.00 USDT",
    chain: "Base",
    status: "Completed" as const,
    date: "Feb 6, 2026",
    address: "0x7q8r...9s0t",
  },
  {
    id: "TX-006",
    type: "outgoing" as const,
    label: "Infrastructure - AWS Billing",
    amount: "-8,750.00 USDT",
    chain: "Ethereum",
    status: "Failed" as const,
    date: "Feb 5, 2026",
    address: "0xab12...cd34",
  },
  {
    id: "TX-007",
    type: "incoming" as const,
    label: "Investment Return - DeFi Yield",
    amount: "+15,340.00 USDT",
    chain: "Avalanche",
    status: "Completed" as const,
    date: "Feb 5, 2026",
    address: "0xef56...gh78",
  },
  {
    id: "TX-008",
    type: "outgoing" as const,
    label: "Office Rent - WeWork Q1",
    amount: "-24,000.00 USDT",
    chain: "Polygon",
    status: "Pending" as const,
    date: "Feb 4, 2026",
    address: "0xij90...kl12",
  },
];

const statusConfig = {
  Completed: {
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  Pending: {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  Failed: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const filtered = allTransactions.filter(
    (tx) =>
      tx.label.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Track, send, and manage all company transactions.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Sent (30d)</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              $134,970
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Total Received (30d)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              $61,587
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Transaction History
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 bg-transparent"
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            </TabsList>

            {["all", "incoming", "outgoing"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="flex flex-col gap-2">
                  {filtered
                    .filter((tx) => tab === "all" || tx.type === tab)
                    .map((tx) => {
                      const sc = statusConfig[tx.status];
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              tx.type === "incoming"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {tx.type === "incoming" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {tx.label}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{tx.chain}</span>
                              <span>&middot;</span>
                              <span className="flex items-center gap-1">
                                {tx.address}
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3 w-3" />
                                  <span className="sr-only">Copy address</span>
                                </button>
                              </span>
                            </div>
                          </div>
                          <div className="hidden items-center gap-1.5 sm:flex">
                            <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} />
                            <span className={`text-xs font-medium ${sc.color}`}>
                              {tx.status}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-sm font-semibold ${
                                tx.type === "incoming"
                                  ? "text-primary"
                                  : "text-card-foreground"
                              }`}
                            >
                              {tx.amount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  {filtered.filter((tx) => tab === "all" || tx.type === tab)
                    .length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No transactions found.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
