import { TrendingUp, TrendingDown, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const portfolio = [
  {
    name: "USDT",
    symbol: "USDT",
    balance: "2,145,320.00",
    value: "$2,145,320",
    allocation: 55.7,
    change: "+0.01%",
    up: true,
    chain: "Plasma",
    color: "hsl(200, 70%, 50%)",
  },
  {
    name: "Plasma",
    symbol: "XPL",
    balance: "1,250,000.00",
    value: "$1,234,567",
    allocation: 32.1,
    change: "+3.24%",
    up: true,
    chain: "Plasma",
    color: "hsl(160, 84%, 39%)",
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    balance: "4.21",
    value: "$387,404",
    allocation: 10.1,
    change: "-1.12%",
    up: false,
    chain: "Plasma",
    color: "hsl(40, 90%, 56%)",
  },
];

const pieData = portfolio.map((a) => ({
  name: a.symbol,
  value: a.allocation,
  color: a.color,
}));

const performanceData = [
  { month: "Aug", value: 3200000, priceGain: 48000, yield: 16000 },
  { month: "Sep", value: 3050000, priceGain: -102000, yield: 18300 },
  { month: "Oct", value: 3400000, priceGain: 289000, yield: 20400 },
  { month: "Nov", value: 3600000, priceGain: 158000, yield: 21600 },
  { month: "Dec", value: 3350000, priceGain: -208000, yield: 23450 },
  { month: "Jan", value: 3847291, priceGain: 425000, yield: 26891 },
];

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Assets
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor your portfolio allocation and performance.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Yield banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              Your portfolio is passively accruing yield from delta-neutral
              strategies
            </p>
            <p className="text-xs text-muted-foreground">
              Returns are generated through hedged positions that remain
              market-neutral, protecting capital while earning yield.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total value + chart row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pie chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 14%, 7%)",
                      border: "1px solid hsl(220, 13%, 13%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 95%)",
                    }}
                    formatter={(value: number) => [`${value}%`, "Allocation"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {portfolio.map((a) => (
                <div key={a.symbol} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {a.symbol} {a.allocation}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar chart — 3 stacked values */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Portfolio Performance (6M)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220, 13%, 13%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 14%, 7%)",
                      border: "1px solid hsl(220, 13%, 13%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 95%)",
                    }}
                    formatter={(val: number, name: string) => {
                      const label =
                        name === "value"
                          ? "Portfolio Value"
                          : name === "priceGain"
                            ? "Price Gain"
                            : "Yield Earned";
                      const prefix = name !== "value" && val > 0 ? "+" : "";
                      return [`${prefix}$${val.toLocaleString()}`, label];
                    }}
                  />
                  <Legend
                    formatter={(val: string) =>
                      val === "value"
                        ? "Value"
                        : val === "priceGain"
                          ? "Price Gain"
                          : "Yield"
                    }
                    wrapperStyle={{ fontSize: 12, color: "hsl(220, 10%, 55%)" }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(160, 84%, 39%)"
                    radius={[0, 0, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="priceGain"
                    fill="hsl(200, 70%, 50%)"
                    radius={[0, 0, 0, 0]}
                    stackId="b"
                  />
                  <Bar
                    dataKey="yield"
                    fill="hsl(40, 90%, 56%)"
                    radius={[4, 4, 0, 0]}
                    stackId="b"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-card-foreground">
            Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table header */}
          <div className="hidden border-b border-border pb-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-6 sm:gap-4">
            <span className="col-span-2">Asset</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Value</span>
            <span className="text-right">Allocation</span>
            <span className="text-right">24h Change</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {portfolio.map((asset) => (
              <div
                key={asset.symbol}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 sm:grid sm:grid-cols-6 sm:items-center sm:gap-4"
              >
                {/* Asset name */}
                <div className="col-span-2 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${asset.color}20`,
                      color: asset.color,
                    }}
                  >
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {asset.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{asset.symbol}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {asset.chain}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex justify-between sm:justify-end">
                  <span className="text-xs text-muted-foreground sm:hidden">
                    Balance
                  </span>
                  <p className="text-sm font-medium text-card-foreground">
                    {asset.balance}
                  </p>
                </div>

                {/* Value */}
                <div className="flex justify-between sm:justify-end">
                  <span className="text-xs text-muted-foreground sm:hidden">
                    Value
                  </span>
                  <p className="text-sm font-medium text-card-foreground">
                    {asset.value}
                  </p>
                </div>

                {/* Allocation */}
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="text-xs text-muted-foreground sm:hidden">
                    Allocation
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={asset.allocation}
                      className="hidden h-1.5 w-16 sm:block"
                    />
                    <span className="text-sm text-card-foreground">
                      {asset.allocation}%
                    </span>
                  </div>
                </div>

                {/* Change */}
                <div className="flex items-center justify-between sm:justify-end">
                  <span className="text-xs text-muted-foreground sm:hidden">
                    24h
                  </span>
                  <div className="flex items-center gap-1">
                    {asset.up ? (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        asset.up ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {asset.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
