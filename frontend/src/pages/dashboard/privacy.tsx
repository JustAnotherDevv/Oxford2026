import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits, parseAbiItem } from "viem";
import { Shield, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PRIVATE_POOL_ADDRESS,
  TOKEN_ADDRESS,
  privatePoolAbi,
  erc20Abi,
} from "@/lib/contracts";
import {
  type Note,
  saveNote,
  getUnspentNotes,
  markNoteSpent,
  generateNoteId,
  generateSecret,
  addressToOwnerField,
} from "@/lib/notes";
import {
  computeHashes,
  computeSingleCommitment,
  generateProof,
  fieldToBytes32,
  type CircuitInputs,
} from "@/lib/noir";
import { getTree, rebuildTreeFromEvents } from "@/lib/merkle";

import { FortuneCookieGrid } from "@/components/privacy/fortune-cookie-grid";
import { DepositCard } from "@/components/privacy/deposit-card";
import { NoteActionModal } from "@/components/privacy/note-action-modal";

const TREE_DEPTH = 20;

// ── Component ───────────────────────────────────────────────────────

export default function PrivacyPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // ── Local note state ──
  const [notes, setNotes] = useState<Note[]>([]);
  const [treeReady, setTreeReady] = useState(false);

  const refreshNotes = useCallback(() => {
    if (address) setNotes(getUnspentNotes(address));
  }, [address]);

  // Rebuild Merkle tree from on-chain events
  const rebuildTree = useCallback(async () => {
    if (!publicClient || !isConnected) return;
    setTreeReady(false);
    try {
      const logs = await publicClient.getLogs({
        address: PRIVATE_POOL_ADDRESS,
        event: parseAbiItem(
          "event LeafInserted(bytes32 indexed commitment, uint256 leafIndex)",
        ),
        fromBlock: 0n,
        toBlock: "latest",
      });

      const sorted = [...logs].sort((a, b) => {
        const idxA = Number(a.args.leafIndex ?? 0n);
        const idxB = Number(b.args.leafIndex ?? 0n);
        return idxA - idxB;
      });

      const commitments = sorted.map((log) => log.args.commitment as string);
      await rebuildTreeFromEvents(commitments);
      setTreeReady(true);
    } catch (err) {
      console.error("Failed to rebuild Merkle tree:", err);
      await getTree();
      setTreeReady(true);
    }
  }, [publicClient, isConnected]);

  useEffect(() => {
    refreshNotes();
    rebuildTree();
  }, [refreshNotes, rebuildTree]);

  // ── On-chain reads ──
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: tokenDecimals } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: isConnected },
  });

  const { data: tokenSymbol } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: isConnected },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, PRIVATE_POOL_ADDRESS] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const decimals = tokenDecimals ?? 18;
  const symbol = tokenSymbol ?? "TOKEN";

  // ── Computed stats ──
  const shieldedBalance = notes.reduce(
    (sum, n) => sum + BigInt(n.value),
    0n,
  );

  // ── Deposit state ──
  const [depositAmount, setDepositAmount] = useState("");
  const [depositStatus, setDepositStatus] = useState<
    "idle" | "computing" | "approving" | "depositing" | "done" | "error"
  >("idle");
  const [depositError, setDepositError] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");

  const { writeContractAsync } = useWriteContract();

  // ── Transfer state ──
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const [transferStatus, setTransferStatus] = useState<
    "idle" | "computing" | "proving" | "submitting" | "done" | "error"
  >("idle");
  const [transferError, setTransferError] = useState("");
  const [transferTxHash, setTransferTxHash] = useState("");

  // ── Withdraw state ──
  const [withdrawRecipient, setWithdrawRecipient] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNoteIds, setWithdrawNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const [withdrawStatus, setWithdrawStatus] = useState<
    "idle" | "computing" | "proving" | "submitting" | "done" | "error"
  >("idle");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawTxHash, setWithdrawTxHash] = useState("");

  // ── Fortune cookie modal state ──
  const [crackedNote, setCrackedNote] = useState<Note | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Cookie crack handler ──
  const handleCookieCrack = useCallback(
    (note: Note) => {
      setCrackedNote(note);
      // Pre-select the cracked note for both transfer and withdraw
      setSelectedNoteIds(new Set([note.id]));
      setWithdrawNoteIds(new Set([note.id]));
      // Pre-fill amount with the note value
      const noteValue = formatUnits(BigInt(note.value), decimals);
      setTransferAmount(noteValue);
      setWithdrawAmount(noteValue);
      // Reset statuses
      setTransferStatus("idle");
      setTransferError("");
      setTransferTxHash("");
      setWithdrawStatus("idle");
      setWithdrawError("");
      setWithdrawTxHash("");
      setModalOpen(true);
    },
    [decimals],
  );

  // ── Toggle note selection helpers ──
  function toggleTransferNote(id: string) {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }

  function toggleWithdrawNote(id: string) {
    setWithdrawNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }

  // ── Wait for deposit receipt (for leafIndex from event) ──
  const { data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}` | undefined,
    query: { enabled: !!depositTxHash },
  });

  useEffect(() => {
    if (depositReceipt && depositStatus === "depositing") {
      const depositLog = depositReceipt.logs[depositReceipt.logs.length - 1];
      if (depositLog && depositLog.data) {
        const data = depositLog.data;
        const leafIndexHex = data.slice(2, 66);
        const leafIndex = parseInt(leafIndexHex, 16);

        const pendingRaw = sessionStorage.getItem("pending_deposit");
        if (pendingRaw && address) {
          const pending = JSON.parse(pendingRaw);
          const note: Note = {
            id: generateNoteId(),
            value: pending.value,
            secret: pending.secret,
            owner: pending.owner,
            commitment: pending.commitment,
            leafIndex,
            spent: false,
            createdAt: Date.now(),
          };
          saveNote(note);
          sessionStorage.removeItem("pending_deposit");
          getTree().then((tree) => tree.insertLeaf(pending.commitment));
          refreshNotes();
          refetchBalance();
        }
      }
      setDepositStatus("done");
    }
  }, [depositReceipt, depositStatus, address, refreshNotes, refetchBalance]);

  // ── Deposit handler ──
  async function handleDeposit() {
    if (!address || !depositAmount) return;
    setDepositStatus("computing");
    setDepositError("");
    setDepositTxHash("");

    try {
      const amountWei = parseUnits(depositAmount, decimals);
      const secret = generateSecret();
      const ownerField = addressToOwnerField(address);

      const commitment = await computeSingleCommitment(
        amountWei.toString(),
        secret,
        ownerField,
      );

      const commitmentBytes32 = fieldToBytes32(commitment);

      sessionStorage.setItem(
        "pending_deposit",
        JSON.stringify({
          value: amountWei.toString(),
          secret,
          owner: ownerField,
          commitment: commitmentBytes32,
        }),
      );

      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < amountWei) {
        setDepositStatus("approving");
        await writeContractAsync({
          address: TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [PRIVATE_POOL_ADDRESS, amountWei],
        });
        let attempts = 0;
        while (attempts < 30) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data: newAllowance } = await refetchAllowance();
          if (newAllowance !== undefined && newAllowance >= amountWei) break;
          attempts++;
        }
      }

      setDepositStatus("depositing");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "deposit",
        args: [commitmentBytes32, amountWei],
      });
      setDepositTxHash(tx);
    } catch (err) {
      console.error("Deposit error:", err);
      setDepositError(err instanceof Error ? err.message : "Deposit failed");
      setDepositStatus("error");
    }
  }

  // ── Transfer handler ──
  async function handleTransfer() {
    if (!address || !transferAmount || !transferRecipient) return;
    if (!treeReady) {
      setTransferError("Merkle tree not ready. Please wait...");
      return;
    }
    setTransferStatus("computing");
    setTransferError("");
    setTransferTxHash("");

    try {
      const selectedNotes = notes.filter((n) => selectedNoteIds.has(n.id));
      if (selectedNotes.length === 0 || selectedNotes.length > 2) {
        throw new Error("Select 1 or 2 notes to spend");
      }

      const sendAmount = parseUnits(transferAmount, decimals);
      const totalIn = selectedNotes.reduce(
        (s, n) => s + BigInt(n.value),
        0n,
      );
      if (totalIn < sendAmount) {
        throw new Error("Insufficient note value for transfer amount");
      }
      const changeAmount = totalIn - sendAmount;

      const recipientField = BigInt(transferRecipient).toString();
      const ownerField = addressToOwnerField(address);

      const in1 = selectedNotes[0];
      const in2 = selectedNotes.length > 1 ? selectedNotes[1] : null;

      const dummySecret = generateSecret();
      const dummyIndex = "999999";

      const outSecret1 = generateSecret();
      const outSecret2 = generateSecret();
      const outViewingKey1 = generateSecret();
      const outViewingKey2 = generateSecret();

      const hashes = await computeHashes({
        nullSecret1: in1.secret,
        nullIdx1: in1.leafIndex.toString(),
        nullSecret2: in2 ? in2.secret : dummySecret,
        nullIdx2: in2 ? in2.leafIndex.toString() : dummyIndex,
        commVal1: sendAmount.toString(),
        commSec1: outSecret1,
        commOwn1: recipientField,
        commVal2: changeAmount.toString(),
        commSec2: outSecret2,
        commOwn2: ownerField,
        vk1: outViewingKey1,
        vk2: outViewingKey2,
      });

      const tree = await getTree();
      const proof1 = await tree.getMerkleProof(in1.leafIndex);

      const dummyPath = new Array(TREE_DEPTH).fill("0");
      const dummyDirs = new Array(TREE_DEPTH).fill(0);

      const proof2 = in2
        ? await tree.getMerkleProof(in2.leafIndex)
        : { root: proof1.root, path: dummyPath, directions: dummyDirs };

      setTransferStatus("proving");

      const circuitInputs: CircuitInputs = {
        merkle_root: BigInt(proof1.root).toString(),
        nullifier_1: hashes.nullifier1,
        nullifier_2: hashes.nullifier2,
        out_commitment_1: hashes.commitment1,
        out_commitment_2: hashes.commitment2,
        fee: "0",
        relayer: "0",
        encrypted_value_1: hashes.encryptedValue1,
        encrypted_value_2: hashes.encryptedValue2,

        in_value_1: in1.value,
        in_secret_1: in1.secret,
        in_owner_1: in1.owner,
        in_leaf_index_1: in1.leafIndex.toString(),
        in_path_1: proof1.path,
        in_dirs_1: proof1.directions.map(String),
        in_is_dummy_1: "0",

        in_value_2: in2 ? in2.value : "0",
        in_secret_2: in2 ? in2.secret : dummySecret,
        in_owner_2: in2 ? in2.owner : "0",
        in_leaf_index_2: in2 ? in2.leafIndex.toString() : dummyIndex,
        in_path_2: proof2.path,
        in_dirs_2: proof2.directions.map(String),
        in_is_dummy_2: in2 ? "0" : "1",

        out_value_1: sendAmount.toString(),
        out_secret_1: outSecret1,
        out_owner_1: recipientField,

        out_value_2: changeAmount.toString(),
        out_secret_2: outSecret2,
        out_owner_2: ownerField,

        out_viewing_key_1: outViewingKey1,
        out_viewing_key_2: outViewingKey2,
      };

      const { proof, publicInputs } = await generateProof(circuitInputs);

      setTransferStatus("submitting");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "transact",
        args: [proof, publicInputs],
      });

      for (const n of selectedNotes) {
        markNoteSpent(n.id);
      }

      saveNote({
        id: generateNoteId(),
        value: sendAmount.toString(),
        secret: outSecret1,
        owner: recipientField,
        commitment: fieldToBytes32(hashes.commitment1),
        leafIndex: tree.leafCount,
        spent: false,
        createdAt: Date.now(),
      });

      if (changeAmount > 0n) {
        saveNote({
          id: generateNoteId(),
          value: changeAmount.toString(),
          secret: outSecret2,
          owner: ownerField,
          commitment: fieldToBytes32(hashes.commitment2),
          leafIndex: tree.leafCount + 1,
          spent: false,
          createdAt: Date.now(),
        });
      }

      await tree.insertLeaf(fieldToBytes32(hashes.commitment1));
      await tree.insertLeaf(fieldToBytes32(hashes.commitment2));

      setTransferTxHash(tx);
      setTransferStatus("done");
      refreshNotes();
      setSelectedNoteIds(new Set());
    } catch (err) {
      console.error("Transfer error:", err);
      setTransferError(
        err instanceof Error ? err.message : "Transfer failed",
      );
      setTransferStatus("error");
    }
  }

  // ── Withdraw handler ──
  async function handleWithdraw() {
    if (!address || !withdrawAmount || !withdrawRecipient) return;
    if (!treeReady) {
      setWithdrawError("Merkle tree not ready. Please wait...");
      return;
    }
    setWithdrawStatus("computing");
    setWithdrawError("");
    setWithdrawTxHash("");

    try {
      const selectedNotes = notes.filter((n) => withdrawNoteIds.has(n.id));
      if (selectedNotes.length === 0 || selectedNotes.length > 2) {
        throw new Error("Select 1 or 2 notes to spend");
      }

      const wdAmount = parseUnits(withdrawAmount, decimals);
      const totalIn = selectedNotes.reduce(
        (s, n) => s + BigInt(n.value),
        0n,
      );
      if (totalIn < wdAmount) {
        throw new Error("Insufficient note value for withdrawal amount");
      }
      const changeAmount = totalIn - wdAmount;

      const ownerField = addressToOwnerField(address);

      const in1 = selectedNotes[0];
      const in2 = selectedNotes.length > 1 ? selectedNotes[1] : null;

      const dummySecret = generateSecret();
      const dummyIndex = "999999";

      const outSecret1 = generateSecret();
      const outSecret2 = generateSecret();
      const outViewingKey1 = generateSecret();
      const outViewingKey2 = generateSecret();

      const hashes = await computeHashes({
        nullSecret1: in1.secret,
        nullIdx1: in1.leafIndex.toString(),
        nullSecret2: in2 ? in2.secret : dummySecret,
        nullIdx2: in2 ? in2.leafIndex.toString() : dummyIndex,
        commVal1: "0",
        commSec1: outSecret1,
        commOwn1: ownerField,
        commVal2: changeAmount.toString(),
        commSec2: outSecret2,
        commOwn2: ownerField,
        vk1: outViewingKey1,
        vk2: outViewingKey2,
      });

      const tree = await getTree();
      const proof1 = await tree.getMerkleProof(in1.leafIndex);

      const dummyPath = new Array(TREE_DEPTH).fill("0");
      const dummyDirs = new Array(TREE_DEPTH).fill(0);

      const proof2 = in2
        ? await tree.getMerkleProof(in2.leafIndex)
        : { root: proof1.root, path: dummyPath, directions: dummyDirs };

      setWithdrawStatus("proving");

      const circuitInputs: CircuitInputs = {
        merkle_root: BigInt(proof1.root).toString(),
        nullifier_1: hashes.nullifier1,
        nullifier_2: hashes.nullifier2,
        out_commitment_1: hashes.commitment1,
        out_commitment_2: hashes.commitment2,
        fee: wdAmount.toString(),
        relayer: "0",
        encrypted_value_1: hashes.encryptedValue1,
        encrypted_value_2: hashes.encryptedValue2,

        in_value_1: in1.value,
        in_secret_1: in1.secret,
        in_owner_1: in1.owner,
        in_leaf_index_1: in1.leafIndex.toString(),
        in_path_1: proof1.path,
        in_dirs_1: proof1.directions.map(String),
        in_is_dummy_1: "0",

        in_value_2: in2 ? in2.value : "0",
        in_secret_2: in2 ? in2.secret : dummySecret,
        in_owner_2: in2 ? in2.owner : "0",
        in_leaf_index_2: in2 ? in2.leafIndex.toString() : dummyIndex,
        in_path_2: proof2.path,
        in_dirs_2: proof2.directions.map(String),
        in_is_dummy_2: in2 ? "0" : "1",

        out_value_1: "0",
        out_secret_1: outSecret1,
        out_owner_1: ownerField,

        out_value_2: changeAmount.toString(),
        out_secret_2: outSecret2,
        out_owner_2: ownerField,

        out_viewing_key_1: outViewingKey1,
        out_viewing_key_2: outViewingKey2,
      };

      const { proof, publicInputs } = await generateProof(circuitInputs);

      setWithdrawStatus("submitting");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "withdraw",
        args: [
          proof,
          publicInputs,
          withdrawRecipient as `0x${string}`,
          wdAmount,
        ],
      });

      for (const n of selectedNotes) {
        markNoteSpent(n.id);
      }

      if (changeAmount > 0n) {
        saveNote({
          id: generateNoteId(),
          value: changeAmount.toString(),
          secret: outSecret2,
          owner: ownerField,
          commitment: fieldToBytes32(hashes.commitment2),
          leafIndex: tree.leafCount + 1,
          spent: false,
          createdAt: Date.now(),
        });
      }

      await tree.insertLeaf(fieldToBytes32(hashes.commitment1));
      await tree.insertLeaf(fieldToBytes32(hashes.commitment2));

      setWithdrawTxHash(tx);
      setWithdrawStatus("done");
      refreshNotes();
      refetchBalance();
      setWithdrawNoteIds(new Set());
    } catch (err) {
      console.error("Withdraw error:", err);
      setWithdrawError(
        err instanceof Error ? err.message : "Withdrawal failed",
      );
      setWithdrawStatus("error");
    }
  }

  // ── Not connected state ──
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Connect Wallet
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to access the Privacy Pool. You can deposit,
          transfer, and withdraw funds privately using zero-knowledge proofs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Privacy Pool
              </h1>
              <Badge variant="secondary" className="text-[10px]">
                ZK Proofs Enabled
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Shield, transfer, and withdraw funds privately using ZK proofs.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Shielded Balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {formatUnits(shieldedBalance, decimals)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{symbol}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Fortune Cookies</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {notes.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">UTXOs</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {tokenBalance !== undefined
                ? formatUnits(tokenBalance, decimals)
                : "\u2014"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{symbol}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Merkle Tree</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {treeReady ? "Synced" : "Loading..."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pedersen tree from events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fortune Cookie Grid + Deposit Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card border-border lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-card-foreground mb-1">
              Your Fortune Cookies
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Click a cookie to crack it open and transfer or withdraw.
            </p>
            <FortuneCookieGrid
              notes={notes}
              decimals={decimals}
              symbol={symbol}
              onCrack={handleCookieCrack}
            />
          </CardContent>
        </Card>

        <DepositCard
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          depositStatus={depositStatus}
          depositError={depositError}
          depositTxHash={depositTxHash}
          tokenBalance={tokenBalance}
          decimals={decimals}
          symbol={symbol}
          onDeposit={handleDeposit}
        />
      </div>

      {/* Note Action Modal */}
      <NoteActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        crackedNote={crackedNote}
        notes={notes}
        decimals={decimals}
        symbol={symbol}
        treeReady={treeReady}
        transferRecipient={transferRecipient}
        setTransferRecipient={setTransferRecipient}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        selectedNoteIds={selectedNoteIds}
        toggleTransferNote={toggleTransferNote}
        transferStatus={transferStatus}
        transferError={transferError}
        transferTxHash={transferTxHash}
        onTransfer={handleTransfer}
        withdrawRecipient={withdrawRecipient}
        setWithdrawRecipient={setWithdrawRecipient}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        withdrawNoteIds={withdrawNoteIds}
        toggleWithdrawNote={toggleWithdrawNote}
        withdrawStatus={withdrawStatus}
        withdrawError={withdrawError}
        withdrawTxHash={withdrawTxHash}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}
