"use client";

import { useState } from "react";
import { RotaGrid } from "@/components/admin/rota-grid";
import { ServicesManager } from "@/components/admin/services-manager";
import { DutyTypesManager } from "@/components/admin/duty-types-manager";
import { ServiceTemplatesManager } from "@/components/admin/service-templates-manager";
import { RecurringPatternsManager } from "@/components/admin/recurring-patterns-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Grid3x3, Settings, FileText, Repeat } from "lucide-react";

export default function RotaPage() {
  const [activeTab, setActiveTab] = useState("rota");

  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Rota Management
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Assign members to duties for church services
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-nowrap overflow-x-auto no-scrollbar bg-slate-900/50 border-slate-800">
            <TabsTrigger
              value="rota"
              className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Rota
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger
              value="duty-types"
              className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Settings className="mr-2 h-4 w-4" />
              Duty Types
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rota" className="mt-6">
            <RotaGrid />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesManager />
          </TabsContent>

          <TabsContent value="duty-types" className="mt-6">
            <DutyTypesManager />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <ServiceTemplatesManager />
          </TabsContent>

          <TabsContent value="recurring" className="mt-6">
            <RecurringPatternsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


