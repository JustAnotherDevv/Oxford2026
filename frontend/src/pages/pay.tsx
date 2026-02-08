import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { erc20Abi } from "@/lib/contracts";
import { fetchFromIPFS } from "@/lib/ipfs";

interface DocumentData {
  type: string;
  number: string;
  date: string;
  content: string;
  from: `0x${string}`;
  to: string;
  amount: string;
  tokenAddress: `0x${string}`;
  signature: string | null;
  createdAt: string;
}

type PageStatus = "loading" | "ready" | "confirming" | "done" | "error";

export default function PayPage() {
  const { cid } = useParams<{ cid: string }>();
  const { isConnected } = useAccount();

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch document from IPFS
  useEffect(() => {
    if (!cid) return;
    setStatus("loading");
    fetchFromIPFS(cid)
      .then((data) => {
        setDoc(data as DocumentData);
        setStatus("ready");
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load document");
        setStatus("error");
      });
  }, [cid]);

  // Read token decimals & symbol
  const { data: decimals } = useReadContract({
    address: doc?.tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!doc },
  });

  const { data: symbol } = useReadContract({
    address: doc?.tokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: !!doc },
  });

  // Write contract
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Update status based on tx lifecycle
  useEffect(() => {
    if (isWritePending || isConfirming) setStatus("confirming");
    if (isConfirmed) setStatus("done");
    if (writeError) setStatus("error");
  }, [isWritePending, isConfirming, isConfirmed, writeError]);

  const handlePay = () => {
    if (!doc || decimals === undefined) return;
    writeContract({
      address: doc.tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [doc.from, parseUnits(doc.amount, decimals)],
    });
  };

  // Loading state
  if (status === "loading" && !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Fetch error
  if (status === "error" && fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{fetchError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doc) return null;

  const typeLabel =
    doc.type.charAt(0).toUpperCase() + doc.type.slice(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{typeLabel}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {doc.number} &middot;{" "}
                {new Date(doc.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{typeLabel}</Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Document content */}
          <div
            className="prose prose-invert prose-sm max-w-none rounded-md border border-border bg-secondary/20 p-4"
            dangerouslySetInnerHTML={{ __html: doc.content }}
          />

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-mono text-xs break-all text-foreground">
                {doc.from}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <p className="text-foreground">{doc.to || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount Requested</p>
              <p className="text-xl font-bold text-foreground">
                {doc.amount} {symbol ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Token</p>
              <p className="font-mono text-xs break-all text-foreground">
                {doc.tokenAddress}
              </p>
            </div>
          </div>

          {/* Signature */}
          {doc.signature && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Signature</p>
              <div className="rounded-md border border-border bg-background p-2 inline-block">
                <img
                  src={doc.signature}
                  alt="Signature"
                  className="h-16 object-contain"
                />
              </div>
            </div>
          )}

          {/* Payment section */}
          <div className="border-t border-border pt-4">
            {status === "done" ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <p className="font-medium text-foreground">Payment sent!</p>
                <p className="text-xs text-muted-foreground">
                  Transaction: {txHash}
                </p>
              </div>
            ) : status === "error" && writeError ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive">
                  {writeError.message.slice(0, 120)}
                </p>
                <Button onClick={handlePay} size="sm">
                  Retry
                </Button>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to pay
                </p>
                <ConnectButton />
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handlePay}
                disabled={status === "confirming"}
              >
                {status === "confirming" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {status === "confirming"
                  ? "Confirming..."
                  : `Pay ${doc.amount} ${symbol ?? ""}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
