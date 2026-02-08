import { motion, AnimatePresence } from "framer-motion";
import {
  EyeOff,
  ArrowUpFromLine,
  Repeat2,
  Loader2,
  Check,
} from "lucide-react";
import { formatUnits } from "viem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Note } from "@/lib/notes";

function truncateHex(hex: string, chars = 6): string {
  if (hex.length <= chars * 2 + 2) return hex;
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`;
}

interface NoteActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crackedNote: Note | null;
  notes: Note[];
  decimals: number;
  symbol: string;
  treeReady: boolean;

  // Transfer
  transferRecipient: string;
  setTransferRecipient: (v: string) => void;
  transferAmount: string;
  setTransferAmount: (v: string) => void;
  selectedNoteIds: Set<string>;
  toggleTransferNote: (id: string) => void;
  transferStatus: "idle" | "computing" | "proving" | "submitting" | "done" | "error";
  transferError: string;
  transferTxHash: string;
  onTransfer: () => void;

  // Withdraw
  withdrawRecipient: string;
  setWithdrawRecipient: (v: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (v: string) => void;
  withdrawNoteIds: Set<string>;
  toggleWithdrawNote: (id: string) => void;
  withdrawStatus: "idle" | "computing" | "proving" | "submitting" | "done" | "error";
  withdrawError: string;
  withdrawTxHash: string;
  onWithdraw: () => void;
}

export function NoteActionModal({
  open,
  onOpenChange,
  crackedNote,
  notes,
  decimals,
  symbol,
  treeReady,

  transferRecipient,
  setTransferRecipient,
  transferAmount,
  setTransferAmount,
  selectedNoteIds,
  toggleTransferNote,
  transferStatus,
  transferError,
  transferTxHash,
  onTransfer,

  withdrawRecipient,
  setWithdrawRecipient,
  withdrawAmount,
  setWithdrawAmount,
  withdrawNoteIds,
  toggleWithdrawNote,
  withdrawStatus,
  withdrawError,
  withdrawTxHash,
  onWithdraw,
}: NoteActionModalProps) {
  if (!crackedNote) return null;

  const noteValue = formatUnits(BigInt(crackedNote.value), decimals);
  const transferBusy =
    transferStatus !== "idle" &&
    transferStatus !== "done" &&
    transferStatus !== "error";
  const withdrawBusy =
    withdrawStatus !== "idle" &&
    withdrawStatus !== "done" &&
    withdrawStatus !== "error";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-amber-500">&#127840;</span>
                  <span>
                    <span className="text-amber-500">{noteValue}</span>{" "}
                    {symbol}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Choose an action for this fortune cookie.
                </DialogDescription>
              </DialogHeader>

              {/* Additional note selector */}
              {notes.length > 1 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <Label className="text-xs text-muted-foreground">
                    Add a second note (optional, max 2 inputs)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {notes
                      .filter((n) => n.id !== crackedNote.id)
                      .map((n) => {
                        const isSelectedTransfer = selectedNoteIds.has(n.id);
                        const isSelectedWithdraw = withdrawNoteIds.has(n.id);
                        const isSelected = isSelectedTransfer || isSelectedWithdraw;
                        return (
                          <Badge
                            key={n.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-secondary text-[10px]"
                            onClick={() => {
                              toggleTransferNote(n.id);
                              toggleWithdrawNote(n.id);
                            }}
                          >
                            {formatUnits(BigInt(n.value), decimals)} {symbol}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              )}

              <Tabs defaultValue="transfer" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="transfer" className="flex-1 gap-1.5">
                    <Repeat2 className="h-3.5 w-3.5" />
                    Transfer
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1 gap-1.5">
                    <ArrowUpFromLine className="h-3.5 w-3.5" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                {/* Transfer tab */}
                <TabsContent value="transfer" className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="modal-transfer-recipient">
                      Recipient Address (0x...)
                    </Label>
                    <Input
                      id="modal-transfer-recipient"
                      placeholder="0x..."
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      disabled={transferBusy}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="modal-transfer-amount">Amount ({symbol})</Label>
                    <Input
                      id="modal-transfer-amount"
                      type="number"
                      placeholder={noteValue}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      disabled={transferBusy}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ZK proof generation may take 30-60 seconds.
                  </p>
                  {transferError && (
                    <p className="text-xs text-destructive">{transferError}</p>
                  )}
                  {transferStatus === "done" && transferTxHash && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Transfer submitted! Tx: {truncateHex(transferTxHash)}
                    </p>
                  )}
                  <Button
                    className="gap-2"
                    onClick={onTransfer}
                    disabled={
                      !transferAmount ||
                      !transferRecipient ||
                      selectedNoteIds.size === 0 ||
                      !treeReady ||
                      transferBusy
                    }
                  >
                    {transferStatus === "computing" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Computing
                        hashes...
                      </>
                    ) : transferStatus === "proving" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating ZK
                        proof...
                      </>
                    ) : transferStatus === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                        tx...
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" /> Private Transfer
                      </>
                    )}
                  </Button>
                </TabsContent>

                {/* Withdraw tab */}
                <TabsContent value="withdraw" className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="modal-withdraw-address">
                      Recipient Address
                    </Label>
                    <Input
                      id="modal-withdraw-address"
                      placeholder="0x..."
                      value={withdrawRecipient}
                      onChange={(e) => setWithdrawRecipient(e.target.value)}
                      disabled={withdrawBusy}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="modal-withdraw-amount">Amount ({symbol})</Label>
                    <Input
                      id="modal-withdraw-amount"
                      type="number"
                      placeholder={noteValue}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={withdrawBusy}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Funds will be unshielded and sent to the recipient. ZK proof
                    generation may take 30-60 seconds.
                  </p>
                  {withdrawError && (
                    <p className="text-xs text-destructive">{withdrawError}</p>
                  )}
                  {withdrawStatus === "done" && withdrawTxHash && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Withdrawal submitted! Tx: {truncateHex(withdrawTxHash)}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={onWithdraw}
                    disabled={
                      !withdrawAmount ||
                      !withdrawRecipient ||
                      withdrawNoteIds.size === 0 ||
                      !treeReady ||
                      withdrawBusy
                    }
                  >
                    {withdrawStatus === "computing" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Computing
                        hashes...
                      </>
                    ) : withdrawStatus === "proving" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating ZK
                        proof...
                      </>
                    ) : withdrawStatus === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                        tx...
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="h-4 w-4" /> Withdraw to Address
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
