import { Shield, Loader2, Check } from "lucide-react";
import { formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function truncateHex(hex: string, chars = 6): string {
  if (hex.length <= chars * 2 + 2) return hex;
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`;
}

interface DepositCardProps {
  depositAmount: string;
  setDepositAmount: (v: string) => void;
  depositStatus: "idle" | "computing" | "approving" | "depositing" | "done" | "error";
  depositError: string;
  depositTxHash: string;
  tokenBalance: bigint | undefined;
  decimals: number;
  symbol: string;
  onDeposit: () => void;
}

export function DepositCard({
  depositAmount,
  setDepositAmount,
  depositStatus,
  depositError,
  depositTxHash,
  tokenBalance,
  decimals,
  symbol,
  onDeposit,
}: DepositCardProps) {
  const busy =
    depositStatus !== "idle" &&
    depositStatus !== "done" &&
    depositStatus !== "error";

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="deposit-amount">Amount ({symbol})</Label>
            {tokenBalance !== undefined && (
              <span className="text-xs text-muted-foreground">
                Balance: {formatUnits(tokenBalance, decimals)}
              </span>
            )}
          </div>
          <Input
            id="deposit-amount"
            type="number"
            placeholder="100"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            disabled={busy}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Funds will be shielded into a new fortune cookie on-chain.
        </p>
        {depositError && (
          <p className="text-xs text-destructive">{depositError}</p>
        )}
        {depositStatus === "done" && depositTxHash && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Check className="h-3 w-3" />
            Deposited! Tx: {truncateHex(depositTxHash)}
          </p>
        )}
        <Button className="gap-2" onClick={onDeposit} disabled={!depositAmount || busy}>
          {depositStatus === "computing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Computing commitment...
            </>
          ) : depositStatus === "approving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Approving...
            </>
          ) : depositStatus === "depositing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Depositing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" /> Shield &amp; Deposit
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
