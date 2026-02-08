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
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start typing your document..." }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[160px] focus:outline-none px-4 py-3",
      },
    },
  });

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
    if (sigRef.current && !sigRef.current.isEmpty()) {
      signatureDataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            Fill out the document, sign it, and generate a payment link.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Document uploaded successfully!
            </p>
            <div className="flex w-full items-center gap-2">
              <Input
                readOnly
                value={generatedLink}
                className="flex-1 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the payer.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Header bar: type, number, date */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Number</Label>
                <Input readOnly value={docNumber} className="text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                />
              </div>
            </div>

            {/* Toolbar */}
            {editor && (
              <div className="flex gap-1 rounded-md border border-border bg-secondary/30 p-1">
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  active={editor.isActive("heading", { level: 2 })}
                >
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  active={editor.isActive("bold")}
                >
                  <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  active={editor.isActive("italic")}
                >
                  <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  active={editor.isActive("bulletList")}
                >
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  active={editor.isActive("orderedList")}
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
              </div>
            )}

            {/* Editor */}
            <div className="rounded-md border border-border bg-background">
              <EditorContent editor={editor} />
            </div>

            {/* Metadata fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>From</Label>
                <Input
                  readOnly
                  value={address ?? "Connect wallet"}
                  className="text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>To (Recipient)</Label>
                <Input
                  placeholder="Name or address"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Amount Requested</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Token Address</Label>
                <Input
                  readOnly
                  value={TOKEN_ADDRESS}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Signature */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Your Signature</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => sigRef.current?.clear()}
                >
                  Clear
                </Button>
              </div>
              <div className="rounded-md border border-border bg-background">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="white"
                  backgroundColor="#09090b"
                  canvasProps={{
                    className: "w-full h-24 rounded-md",
                    style: { width: "100%", height: "96px" },
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {!generatedLink && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !address}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload & Generate Link"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
