import { useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import SignatureCanvas from "react-signature-canvas";
import { useAccount } from "wagmi";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Loader2,
  Copy,
  Check,
  FileText,
  Sparkles,
  Wand2,
  Send as SendIcon,
  Square,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOKEN_ADDRESS } from "@/lib/contracts";
import { uploadJSON } from "@/lib/ipfs";
import { streamChat } from "@/lib/agent";

interface DocumentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateDocNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `DOC-${y}${m}-${seq}`;
}

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1.5 transition-all duration-200 ${
        active
          ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function DocumentEditor({ open, onOpenChange }: DocumentEditorProps) {
  const { address } = useAccount();
  const sigRef = useRef<SignatureCanvas | null>(null);

  const [docType, setDocType] = useState("invoice");
  const [docNumber] = useState(generateDocNumber);
  const [docDate, setDocDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start typing your document..." }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[180px] focus:outline-none px-5 py-4 font-extralight leading-relaxed tracking-wide",
      },
    },
  });

  const handleAiGenerate = useCallback(async () => {
    if (!editor || !aiPrompt.trim()) return;
    setAiStreaming(true);
    setError(null);
    streamBufferRef.current = "";

    const formattedDate = docDate
      ? new Date(docDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    const metadata = [
      `Document type: ${docType}`,
      `Document number: ${docNumber}`,
      formattedDate && `Date: ${formattedDate}`,
      address && `Sender wallet address: ${address}`,
      recipientName && `Recipient: ${recipientName}`,
      amount && `Amount: ${amount} USDT`,
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = `Here is the real metadata for this document — use these exact values, do NOT use bracket placeholders:\n${metadata}\n\nGenerate: ${aiPrompt}`;

    editor.commands.clearContent();

    const controller = await streamChat(
      [{ role: "user", content: userMessage }],
      (chunk) => {
        streamBufferRef.current += chunk;
        editor.commands.setContent(streamBufferRef.current);
      },
      () => {
        setAiStreaming(false);
        setAiPrompt("");
      },
      (err) => {
        setAiStreaming(false);
        setError(err);
      },
    );
    abortRef.current = controller;
  }, [editor, aiPrompt, docType, docNumber, docDate, recipientName, amount, address]);

  const handleAiImprove = useCallback(async () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (!currentHtml || currentHtml === "<p></p>") {
      setError("Write some content first, then improve it with AI.");
      return;
    }
    setAiStreaming(true);
    setError(null);
    streamBufferRef.current = "";

    const formattedDate = docDate
      ? new Date(docDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    const metadata = [
      `Document type: ${docType}`,
      `Document number: ${docNumber}`,
      formattedDate && `Date: ${formattedDate}`,
      address && `Sender wallet address: ${address}`,
      recipientName && `Recipient: ${recipientName}`,
      amount && `Amount: ${amount} USDT`,
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = `Here is the real metadata — use these exact values and replace any bracket placeholders:\n${metadata}\n\nImprove and polish the following document content. Make it more professional, better structured, and clearer. Keep the same information but enhance the quality.\n\nCurrent content:\n${currentHtml}`;

    editor.commands.clearContent();

    const controller = await streamChat(
      [{ role: "user", content: userMessage }],
      (chunk) => {
        streamBufferRef.current += chunk;
        editor.commands.setContent(streamBufferRef.current);
      },
      () => setAiStreaming(false),
      (err) => {
        setAiStreaming(false);
        setError(err);
      },
    );
    abortRef.current = controller;
  }, [editor, docType, docNumber, docDate, recipientName, amount, address]);

  const handleAiStop = useCallback(() => {
    abortRef.current?.abort();
    setAiStreaming(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!editor || !address) return;

    const html = editor.getHTML();
    if (!html || html === "<p></p>") {
      setError("Please add some content to your document.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    let signatureDataUrl: string | null = null;
    if (sigRef.current) {
      signatureDataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    }

    setUploading(true);
    setError(null);

    try {
      const document = {
        type: docType,
        number: docNumber,
        date: docDate,
        content: html,
        from: address,
        to: recipientName,
        amount: amount,
        tokenAddress: TOKEN_ADDRESS,
        signature: signatureDataUrl,
        createdAt: new Date().toISOString(),
      };

      const cid = await uploadJSON(document);
      const link = `${window.location.origin}/pay/${cid}`;
      setGeneratedLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [editor, address, docType, docNumber, docDate, recipientName, amount]);

  const handleCopy = useCallback(() => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLink]);

  const handleClose = useCallback(
    (val: boolean) => {
      if (!val) {
        setGeneratedLink(null);
        setError(null);
        setCopied(false);
      }
      onOpenChange(val);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gap-0 p-0 border-border/50">
        {/* Title bar */}
        <DialogHeader className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 ring-1 ring-primary/20">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl font-light tracking-wide">
              New Document
            </DialogTitle>
          </div>
          <DialogDescription className="font-extralight tracking-wider text-muted-foreground/70 pl-11">
            Compose, sign, and generate a payment link.
          </DialogDescription>
        </DialogHeader>

        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        {generatedLink ? (
          <div className="flex flex-col items-center gap-5 px-8 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-light tracking-wide text-foreground">
                Document uploaded
              </p>
              <p className="mt-1 text-xs font-light text-muted-foreground/60">
                Share this link with the recipient to request payment.
              </p>
            </div>
            <div className="flex w-full items-center gap-2 mt-2">
              <Input
                readOnly
                value={generatedLink}
                className="flex-1 text-xs font-mono font-light bg-secondary/30 border-border/40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 border-border/40"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 px-8 py-6">
            {/* Header bar: type, number, date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Type
                </Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-full font-light border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Number
                </Label>
                <Input
                  readOnly
                  value={docNumber}
                  className="text-xs font-mono font-light border-border/40 text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Date
                </Label>
                <Input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="font-light border-border/40"
                />
              </div>
            </div>

            {/* AI Prompt Bar */}
            <div className="rounded-lg border border-primary/20 bg-primary/[0.03] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !aiStreaming) {
                      e.preventDefault();
                      handleAiGenerate();
                    }
                  }}
                  placeholder="Describe what to write... e.g. &quot;Invoice for web dev services, $5000&quot;"
                  disabled={aiStreaming}
                  className="flex-1 bg-transparent text-[13px] font-extralight tracking-wide text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
                />
                {aiStreaming ? (
                  <button
                    type="button"
                    onClick={handleAiStop}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Square className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAiImprove}
                      disabled={aiStreaming}
                      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-extralight tracking-wider text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-30"
                      title="Improve existing content"
                    >
                      <Wand2 className="h-3 w-3" />
                      Improve
                    </button>
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt.trim() || aiStreaming}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
                    >
                      <SendIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {aiStreaming && (
                <div className="h-0.5 bg-secondary/30 overflow-hidden">
                  <div className="h-full w-1/3 bg-primary/40 animate-pulse rounded-full" style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
                </div>
              )}
            </div>

            {/* Toolbar + Editor */}
            <div className="rounded-lg border border-border/40 overflow-hidden">
              {editor && (
                <div className="flex gap-0.5 border-b border-border/30 bg-secondary/20 px-2 py-1.5">
                  <ToolbarButton
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    active={editor.isActive("heading", { level: 2 })}
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <div className="mx-1.5 w-px bg-border/30" />
                  <ToolbarButton
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    active={editor.isActive("bulletList")}
                  >
                    <List className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    active={editor.isActive("orderedList")}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </ToolbarButton>
                </div>
              )}
              <div className="bg-background/50">
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

            {/* Metadata fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  From
                </Label>
                <Input
                  readOnly
                  value={address ?? "Connect wallet"}
                  className="text-xs font-mono font-light border-border/40 text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  To (Recipient)
                </Label>
                <Input
                  placeholder="Name or address"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="font-light border-border/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Amount
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-light border-border/40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Token
                </Label>
                <Input
                  readOnly
                  value={TOKEN_ADDRESS}
                  className="text-xs font-mono font-light border-border/40 text-muted-foreground"
                />
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

            {/* Signature */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-light uppercase tracking-widest text-muted-foreground/60">
                  Signature
                </Label>
                <button
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                  className="text-[11px] font-light tracking-wide text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="white"
                  canvasProps={{
                    className: "w-full h-28 bg-zinc-950/80",
                    style: { width: "100%", height: "112px" },
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-light text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Footer */}
        {!generatedLink && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <div className="flex justify-end gap-3 px-8 py-5">
              <Button
                variant="ghost"
                onClick={() => handleClose(false)}
                disabled={uploading}
                className="font-light text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !address}
                className="font-light tracking-wide px-6"
              >
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {uploading ? "Uploading..." : "Generate Link"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
