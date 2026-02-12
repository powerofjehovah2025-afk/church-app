"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, DollarSign, Plus } from "lucide-react";
import type { Contribution, Service } from "@/types/database.types";

interface ContributionWithService extends Contribution {
  service?: Service;
}

export function ContributionsView() {
  const [contributions, setContributions] = useState<ContributionWithService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [contributionType, setContributionType] = useState<string>("tithe");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [serviceId, setServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchContributions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/member/contributions");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load contributions (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setContributions(data.contributions || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      setMessage({
        type: "error",
        text: `Failed to load contributions: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + 3);
      const response = await fetch(
        `/api/admin/rota/services?startDate=${today.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}`
      );
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
    fetchServices();
  }, [fetchContributions, fetchServices]);

  const handleOpenDialog = () => {
    setContributionType("tithe");
    setAmount("");
    setCurrency("GBP");
    setPaymentMethod("");
    setServiceId("");
    setDescription("");
    setIsAnonymous(false);
    setContributionDate(new Date().toISOString().split("T")[0]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setContributionType("tithe");
    setAmount("");
    setCurrency("GBP");
    setPaymentMethod("");
    setServiceId("");
    setDescription("");
    setIsAnonymous(false);
    setContributionDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/member/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contribution_type: contributionType,
          amount: parseFloat(amount),
          currency,
          payment_method: paymentMethod || null,
          service_id: serviceId || null,
          description: description || null,
          is_anonymous: isAnonymous,
          contribution_date: contributionDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to record contribution");
      }

      setMessage({
        type: "success",
        text: "Contribution recorded successfully!",
      });

      handleCloseDialog();
      fetchContributions();
    } catch (error) {
      console.error("Error recording contribution:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to record contribution",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tithe":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "offering":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "donation":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "special":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "error"
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-green-500/50 bg-green-500/10 text-green-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">My Contributions</CardTitle>
              <CardDescription className="text-slate-400">
                View and record your contributions
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Contribution
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Contribution</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Record a new contribution
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contributionType" className="text-slate-300">
                        Type *
                      </Label>
                      <Select value={contributionType} onValueChange={setContributionType} required>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tithe">Tithe</SelectItem>
                          <SelectItem value="offering">Offering</SelectItem>
                          <SelectItem value="donation">Donation</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-slate-300">
                        Amount *
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="border-slate-700 bg-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-slate-300">
                        Currency
                      </Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod" className="text-slate-300">
                        Payment Method
                      </Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceId" className="text-slate-300">
                      Service (optional)
                    </Label>
                    <Select value={serviceId} onValueChange={setServiceId}>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {new Date(service.date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contributionDate" className="text-slate-300">
                      Date *
                    </Label>
                    <Input
                      id="contributionDate"
                      type="date"
                      value={contributionDate}
                      onChange={(e) => setContributionDate(e.target.value)}
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description..."
                      rows={3}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <Label htmlFor="isAnonymous" className="text-slate-300">
                      Anonymous contribution
                    </Label>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      disabled={isSubmitting}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !amount}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        "Record"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Contributions</span>
              <span className="text-2xl font-bold text-white">
                {currency} {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No contributions recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <Card key={contribution.id} className="border-slate-800 bg-slate-800/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getTypeColor(contribution.contribution_type)}>
                            {contribution.contribution_type}
                          </Badge>
                          <span className="text-lg font-bold text-white">
                            {contribution.currency} {Number(contribution.amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>
                            Date: {new Date(contribution.contribution_date).toLocaleDateString()}
                          </p>
                          {contribution.service && (
                            <p>
                              Service: {contribution.service.name} -{" "}
                              {new Date(contribution.service.date).toLocaleDateString()}
                            </p>
                          )}
                          {contribution.payment_method && (
                            <p>Payment: {contribution.payment_method}</p>
                          )}
                          {contribution.description && <p>Notes: {contribution.description}</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

