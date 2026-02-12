"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Loader2, AlertCircle, CheckCircle2, Ban, RotateCcw } from "lucide-react";

interface InvitationCodeRow {
  id: string;
  code: string;
  created_at: string;
  created_by: string | null;
  used_at: string | null;
  used_by: string | null;
  is_active?: boolean;
}

export function InvitationCodesManager() {
  const [codes, setCodes] = useState<InvitationCodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/invitation-codes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCodes(data.codes || []);
    } catch {
      setCodes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setMessage({ type: "error", text: "Code must be at least 4 characters" });
      return;
    }
    setIsCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to create code" });
        return;
      }
      setMessage({ type: "success", text: `Invitation code "${code}" created` });
      setNewCode("");
      await fetchCodes();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to create invitation code" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActive = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/invitation-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update code" });
        return;
      }
      setMessage({
        type: "success",
        text: isActive ? "Code reactivated" : "Code deactivated",
      });
      await fetchCodes();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to update invitation code" });
    } finally {
      setTogglingId(null);
    }
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
      {/* Create new code */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-white">Create invitation code</CardTitle>
              <CardDescription className="text-slate-400">
                New sign-ups must enter a valid code. Create a code and share it with new members.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newCode" className="text-slate-300">
                Code (min 4 characters, stored uppercase)
              </Label>
              <Input
                id="newCode"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME2025"
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                maxLength={32}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isCreating || newCode.trim().length < 4}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create code
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {message && (
        <Card
          className={
            message.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : "bg-red-500/20 border-red-500/50"
          }
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

      {/* List of codes */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white">Invitation codes</CardTitle>
          <CardDescription className="text-slate-400">
            {codes.length} code(s). Deactivated codes cannot be used for sign-up. Used codes are single-use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-slate-400 text-sm">No invitation codes yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {codes.map((row) => {
                const active = row.is_active !== false;
                const used = !!row.used_at;
                return (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-medium text-white">{row.code}</span>
                      {!active && (
                        <span className="rounded px-2 py-0.5 text-xs bg-slate-500/30 text-slate-300 border border-slate-500/50">
                          Deactivated
                        </span>
                      )}
                      {active && used && (
                        <span className="rounded px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Used {new Date(row.used_at!).toLocaleDateString()}
                        </span>
                      )}
                      {active && !used && (
                        <span className="rounded px-2 py-0.5 text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        Created {new Date(row.created_at).toLocaleString()}
                      </span>
                      {active && !used && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          disabled={togglingId === row.id}
                          onClick={() => handleSetActive(row.id, false)}
                        >
                          {togglingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              Deactivate
                            </>
                          )}
                        </Button>
                      )}
                      {!active && !used && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600/50 text-green-300 hover:bg-green-500/20"
                          disabled={togglingId === row.id}
                          onClick={() => handleSetActive(row.id, true)}
                        >
                          {togglingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Reactivate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
