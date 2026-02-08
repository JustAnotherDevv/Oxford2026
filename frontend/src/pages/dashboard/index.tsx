import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Send,
  Download,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentEditor } from "@/components/receive/document-editor";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const balanceData = [
  { month: "Jul", value: 2400000 },
  { month: "Aug", value: 2800000 },
  { month: "Sep", value: 2650000 },
  { month: "Oct", value: 3100000 },
  { month: "Nov", value: 3400000 },
  { month: "Dec", value: 3200000 },
  { month: "Jan", value: 3847291 },
];

const recentTransactions = [
  {
    id: "1",
    type: "outgoing",
    label: "Vendor Payment - CloudServe Inc.",
    amount: "-12,500 USDT",
    chain: "Ethereum",
    status: "Completed",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "incoming",
    label: "Client Payment - TechFlow Ltd.",
    amount: "+45,000 USDT",
    chain: "Polygon",
    status: "Completed",
    time: "18 min ago",
  },
  {
    id: "3",
    type: "outgoing",
    label: "Payroll Batch #127",
    amount: "-87,320 USDT",
    chain: "Arbitrum",
    status: "Pending",
    time: "1 hr ago",
  },
  {
    id: "4",
    type: "incoming",
    label: "Staking Rewards",
    amount: "+1,247 ETH",
    chain: "Ethereum",
    status: "Completed",
    time: "3 hr ago",
  },
  {
    id: "5",
    type: "outgoing",
    label: "SaaS Subscription - DevTools Pro",
    amount: "-2,400 USDT",
    chain: "Base",
    status: "Completed",
    time: "5 hr ago",
  },
];

const assets = [
  { name: "USDT", amount: "$2,145,320", change: "+0.01%", up: true },
  { name: "ETH", amount: "$1,234,567", change: "+3.24%", up: true },
  { name: "BTC", amount: "$387,404", change: "-1.12%", up: false },
  { name: "SOL", amount: "$80,000", change: "+5.67%", up: true },
];

export default function DashboardPage() {
  const [receiveOpen, setReceiveOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-light tracking-wide text-foreground">
            Dashboard
          </h1>
          <p className="text-[13px] font-extralight tracking-wider text-muted-foreground">
            Welcome back, Acme Corp. Here&apos;s your treasury overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent font-extralight tracking-wider"
            onClick={() => setReceiveOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Receive</span>
          </Button>
          <Button size="sm" className="gap-2 font-extralight tracking-wider">
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send Payment</span>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-muted-foreground">
              Total Balance
            </p>
            <p className="mt-2 font-display text-2xl font-light text-card-foreground">
              $3,847,291
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-extralight text-primary">+12.4%</span>
              <span className="font-extralight text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-muted-foreground">
              Monthly Inflow
            </p>
            <p className="mt-2 font-display text-2xl font-light text-card-foreground">
              $524,890
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-extralight text-primary">+8.2%</span>
              <span className="font-extralight text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-muted-foreground">
              Monthly Outflow
            </p>
            <p className="mt-2 font-display text-2xl font-light text-card-foreground">
              $312,450
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="font-extralight text-destructive">+3.1%</span>
              <span className="font-extralight text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-muted-foreground">
              Pending Approvals
            </p>
            <p className="mt-2 font-display text-2xl font-light text-card-foreground">
              7
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px]">
              <span className="font-extralight text-muted-foreground">
                3 payments, 4 transfers
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Assets */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-base font-light tracking-wide text-card-foreground">
              Balance History
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceData}>
                  <defs>
                    <linearGradient
                      id="balanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(38, 65%, 50%)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(38, 65%, 50%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(25, 10%, 14%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(35, 12%, 48%)",
                      fontSize: 11,
                      fontWeight: 200,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(35, 12%, 48%)",
                      fontSize: 11,
                      fontWeight: 200,
                    }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(25, 14%, 7%)",
                      border: "1px solid hsl(25, 10%, 14%)",
                      borderRadius: "8px",
                      color: "hsl(35, 20%, 88%)",
                      fontWeight: 200,
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Balance",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(38, 65%, 50%)"
                    strokeWidth={1.5}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-base font-light tracking-wide text-card-foreground">
              Top Assets
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[11px] font-extralight tracking-wider text-primary"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-[11px] font-extralight tracking-wider text-foreground ring-1 ring-border/50">
                      {asset.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[13px] font-extralight tracking-wider text-card-foreground">
                        {asset.name}
                      </p>
                      <p className="text-[11px] font-extralight tracking-wider text-muted-foreground">
                        {asset.amount}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-extralight tracking-wider ${
                      asset.up ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {asset.change}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-display text-base font-light tracking-wide text-card-foreground">
            Recent Transactions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-[11px] font-extralight tracking-wider text-primary"
          >
            <Plus className="h-3 w-3" />
            New Transaction
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 rounded-lg border border-border/30 bg-secondary/20 p-3"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    tx.type === "incoming"
                      ? "bg-primary/8 text-primary ring-1 ring-primary/15"
                      : "bg-destructive/8 text-destructive ring-1 ring-destructive/15"
                  }`}
                >
                  {tx.type === "incoming" ? (
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-extralight tracking-wider text-card-foreground truncate">
                    {tx.label}
                  </p>
                  <p className="text-[11px] font-extralight tracking-wider text-muted-foreground">
                    {tx.chain} &middot; {tx.time}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-[13px] font-extralight tracking-wider ${
                      tx.type === "incoming"
                        ? "text-primary"
                        : "text-card-foreground"
                    }`}
                  >
                    {tx.amount}
                  </p>
                  <Badge
                    variant={
                      tx.status === "Completed" ? "secondary" : "outline"
                    }
                    className="text-[9px] font-extralight tracking-wider"
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DocumentEditor open={receiveOpen} onOpenChange={setReceiveOpen} />
    </div>
  );
}
