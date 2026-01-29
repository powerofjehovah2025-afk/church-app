"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Plus, X, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";

interface InvitationCode {
  id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  creator?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
}

export function InvitationCodesManager() {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/invitation-codes");
      if (!response.ok) {
        throw new Error("Failed to fetch codes");
      }
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      setMessage({ type: "error", text: "Failed to load invitation codes" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: customCode || undefined,
          expiresAt: expiresAt || null,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create code");
      }

      setMessage({ type: "success", text: `Code "${data.code.code}" created successfully!` });
      setIsDialogOpen(false);
      setCustomCode("");
      setExpiresAt("");
      setMaxUses("");
      await fetchCodes();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create code",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (codeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/invitation-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update code");
      }

      await fetchCodes();
    } catch (error) {
      console.error("Error updating code:", error);
      setMessage({ type: "error", text: "Failed to update code" });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExhausted = (code: InvitationCode) => {
    if (code.max_uses === null) return false;
    return code.used_count >= code.max_uses;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Card
          className={`${
            message.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : "bg-red-500/20 border-red-500/50"
          } backdrop-blur-md shadow-xl`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <p
                className={
                  message.type === "success" ? "text-green-300" : "text-red-300"
                }
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Create Button */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Invitation Codes</CardTitle>
              <CardDescription className="text-slate-400">
                Generate and manage invitation codes for new member signups
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create Invitation Code</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Generate a new invitation code for member signups
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customCode" className="text-slate-300">
                      Code (optional - leave blank to auto-generate)
                    </Label>
                    <Input
                      id="customCode"
                      type="text"
                      placeholder="e.g., CHURCH2024"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      className="bg-slate-800 border-slate-700 text-white"
                      maxLength={20}
                    />
                    <p className="text-xs text-slate-400">
                      Leave blank to auto-generate an 8-character code
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiresAt" className="text-slate-300">
                      Expires At (optional)
                    </Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxUses" className="text-slate-300">
                      Max Uses (optional - leave blank for unlimited)
                    </Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      placeholder="e.g., 10"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-slate-700 text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Code"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Codes List */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="pt-6">
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No invitation codes created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className={`p-4 rounded-lg border ${
                    !code.is_active || isExpired(code.expires_at) || isExhausted(code)
                      ? "bg-slate-800/30 border-slate-700/30 opacity-60"
                      : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono font-bold text-blue-400">
                          {code.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(code.code)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                        >
                          {copiedCode === code.code ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {code.is_active ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/50">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/50">
                            Inactive
                          </span>
                        )}
                        {isExpired(code.expires_at) && (
                          <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/50">
                            Expired
                          </span>
                        )}
                        {isExhausted(code) && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                            Exhausted
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                        <div>
                          <span className="text-slate-500">Used:</span>{" "}
                          <span className="text-white">
                            {code.used_count}
                            {code.max_uses !== null && ` / ${code.max_uses}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Expires:</span>{" "}
                          <span className="text-white">{formatDate(code.expires_at)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Created:</span>{" "}
                          <span className="text-white">{formatDate(code.created_at)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">By:</span>{" "}
                          <span className="text-white">
                            {code.creator?.full_name || code.creator?.email || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(code.id, code.is_active)}
                        className={`${
                          code.is_active
                            ? "border-red-500/50 text-red-300 hover:bg-red-500/20"
                            : "border-green-500/50 text-green-300 hover:bg-green-500/20"
                        }`}
                      >
                        {code.is_active ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

