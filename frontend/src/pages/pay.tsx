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
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
} from "lucide-react";

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

  useEffect(() => {
    if (!cid) return;
    setStatus("loading");
    fetchFromIPFS(cid)
      .then((data) => {
        setDoc(data as DocumentData);
        setStatus("ready");
      })
      .catch((err) => {
        setFetchError(
          err instanceof Error ? err.message : "Failed to load document"
        );
        setStatus("error");
      });
  }, [cid]);

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

  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

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

  // Loading
  if (status === "loading" && !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-light tracking-wide text-muted-foreground/60">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (status === "error" && fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md mx-4">
          <AlertCircle className="h-6 w-6 text-destructive/80" />
          <p className="text-sm font-light text-destructive/80">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const typeLabel = doc.type.charAt(0).toUpperCase() + doc.type.slice(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-light tracking-wide text-foreground">
                {typeLabel}
              </h1>
              <p className="text-xs font-light tracking-wide text-muted-foreground/50">
                {doc.number} &middot;{" "}
                {new Date(doc.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="font-light tracking-wider text-[10px] uppercase px-3 py-1"
          >
            {typeLabel}
          </Badge>
        </div>

        {/* Document card */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          {/* Content */}
          <div className="px-8 py-6">
            <div
              className="prose prose-invert prose-sm max-w-none font-extralight leading-relaxed tracking-wide [&_p]:text-foreground/80 [&_h1]:font-light [&_h2]:font-light [&_h3]:font-light [&_li]:text-foreground/80"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />
          </div>

          <div className="mx-8 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-6 px-8 py-6">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/50">
                From
              </p>
              <p className="font-mono text-xs font-light break-all text-foreground/70 leading-relaxed">
                {doc.from}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/50">
                To
              </p>
              <p className="text-sm font-light text-foreground/70">
                {doc.to || "\u2014"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/50">
                Amount
              </p>
              <p className="font-display text-3xl font-light tracking-tight text-foreground">
                {doc.amount}{" "}
                <span className="text-sm font-light text-muted-foreground/60">
                  {symbol ?? ""}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/50">
                Token
              </p>
              <p className="font-mono text-xs font-light break-all text-foreground/70 leading-relaxed">
                {doc.tokenAddress}
              </p>
            </div>
          </div>

          {/* Signature */}
          {doc.signature && (
            <>
              <div className="mx-8 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              <div className="px-8 py-6">
                <p className="mb-3 text-[11px] font-light uppercase tracking-widest text-muted-foreground/50">
                  Signature
                </p>
                <div className="rounded-lg border border-border/30 bg-zinc-950/60 p-3 inline-block">
                  <img
                    src={doc.signature}
                    alt="Signature"
                    className="h-16 object-contain opacity-90"
                  />
                </div>
              </div>
            </>
          )}

          <div className="mx-8 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

          {/* Payment section */}
          <div className="px-8 py-8">
            {status === "done" ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-base font-light tracking-wide text-foreground">
                  Payment sent
                </p>
                <p className="font-mono text-[11px] font-light text-muted-foreground/50 break-all text-center max-w-md">
                  {txHash}
                </p>
              </div>
            ) : status === "error" && writeError ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle className="h-5 w-5 text-destructive/80" />
                <p className="text-xs font-light text-destructive/70 text-center max-w-sm">
                  {writeError.message.slice(0, 120)}
                </p>
                <Button
                  onClick={handlePay}
                  size="sm"
                  variant="outline"
                  className="font-light tracking-wide border-border/40"
                >
                  Retry
                </Button>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm font-light tracking-wide text-muted-foreground/60">
                  Connect your wallet to pay
                </p>
                <ConnectButton />
              </div>
            ) : (
              <Button
                className="w-full h-12 font-light tracking-wide text-sm"
                onClick={handlePay}
                disabled={status === "confirming"}
              >
                {status === "confirming" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {status === "confirming"
                  ? "Confirming..."
                  : `Pay ${doc.amount} ${symbol ?? ""}`}
              </Button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] font-light tracking-wide text-muted-foreground/30">
          Secured on IPFS &middot; Powered by Neobank
        </p>
      </div>
    </div>
  );
}
