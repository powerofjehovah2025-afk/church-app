"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type DutyType = Database["public"]["Tables"]["duty_types"]["Row"];

/**
 * Minimal Duty Types manager for the Rota page.
 * Shows existing duty types so admins understand what can be assigned.
 * Full CRUD for duty types is handled via the Service Templates manager.
 */
export function DutyTypesManager() {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/rota/duty-types");
        if (response.ok) {
          const data = await response.json();
          setDutyTypes(data.dutyTypes || []);
        }
      } catch (error) {
        console.error("Error loading duty types:", error);
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
          <CardTitle className="text-white">Duty Types</CardTitle>
          <CardDescription className="text-slate-400">
            Roles that can be assigned on the rota. Manage required duty types per
            service from the Templates tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : dutyTypes.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p>No duty types defined yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dutyTypes.map((duty) => (
                <Card
                  key={duty.id}
                  className="border-slate-800 bg-slate-800/50"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{duty.name}</h3>
                        {duty.description && (
                          <p className="mt-1 text-xs text-slate-400">
                            {duty.description}
                          </p>
                        )}
                      </div>
                      {!duty.is_active && (
                        <Badge
                          variant="outline"
                          className="border-slate-600 text-slate-400 text-[10px]"
                        >
                          Inactive
                        </Badge>
                      )}
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

export default DutyTypesManager;

