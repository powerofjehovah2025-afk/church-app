"use client";

import { useState } from "react";
import { AssignmentsManager } from "@/components/admin/assignments-manager";
import { ServicesManager } from "@/components/admin/services-manager";
import { DutyTypesManager } from "@/components/admin/duty-types-manager";
import { ServiceTemplatesManager } from "@/components/admin/service-templates-manager";
import { RecurringPatternsManager } from "@/components/admin/recurring-patterns-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Settings, FileText, Repeat } from "lucide-react";

export default function RotaPage() {
  const [activeTab, setActiveTab] = useState("assignments");

  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Rota Management
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Assign members to duties for church services
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border-slate-800">
            <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-800">
              <Users className="mr-2 h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-slate-800">
              <Calendar className="mr-2 h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="duty-types" className="data-[state=active]:bg-slate-800">
              <Settings className="mr-2 h-4 w-4" />
              Duty Types
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="recurring" className="data-[state=active]:bg-slate-800">
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-6">
            <AssignmentsManager />
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


