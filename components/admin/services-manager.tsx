"use client";

import { useEffect, useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { Service } from "@/types/database.types";

/**
 * Services manager for the Rota page.
 * Lists upcoming services and allows creating new services.
 */
export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 3);

        const response = await fetch(
          `/api/admin/rota/services?startDate=${today.toISOString().split("T")[0]}&endDate=${endDate
            .toISOString()
            .split("T")[0]}`,
        );

        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleOpenDialog = () => {
    setName("");
    setDate("");
    setTime("");
    setIsDialogOpen(true);
    setMessage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setName("");
    setDate("");
    setTime("");
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/rota/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          time: time || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create service");
      }

      setMessage({
        type: "success",
        text: "Service created successfully!",
      });

      // Reload services
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + 3);

      const reloadResponse = await fetch(
        `/api/admin/rota/services?startDate=${today.toISOString().split("T")[0]}&endDate=${endDate
          .toISOString()
          .split("T")[0]}`,
      );
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setServices(data.services || []);
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error creating service:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create service",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Services</CardTitle>
              <CardDescription className="text-slate-400">
                Upcoming services generated from rota patterns and templates
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Service
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a new service to the rota
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Service Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sunday Service, Midweek Service"
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-slate-300">
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-slate-300">
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
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
                      disabled={isSubmitting || !name.trim() || !date}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p>No upcoming services found.</p>
              <p className="mt-2 text-sm">Click &quot;Create Service&quot; to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="border-slate-800 bg-slate-800/50"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{service.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(service.date).toLocaleDateString()}
                          </span>
                          {service.time && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.time}
                            </span>
                          )}
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

export default ServicesManager;

