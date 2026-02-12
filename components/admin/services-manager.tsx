"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Clock } from "lucide-react";
import type { Service } from "@/types/database.types";

/**
 * Minimal Services manager for the Rota page.
 * Lists upcoming services using the existing rota services API.
 */
export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Services</CardTitle>
          <CardDescription className="text-slate-400">
            Upcoming services generated from rota patterns and templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p>No upcoming services found.</p>
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

