"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Plus } from "lucide-react";
import { getPhoneValidationError, PHONE_COUNTRY_CODE_HINT } from "@/lib/phone";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[] | null;
  availability: Record<string, unknown> | null;
}

export function ProfileEditor() {
  const [, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    skills: [] as string[],
    availability: {} as Record<string, unknown>,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/member/profile");
      if (response.ok) {
        const data = await response.json();
        const profileData = data.profile;
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          skills: (profileData.skills as string[]) || [],
          availability: (profileData.availability as Record<string, unknown>) || {},
        });
      } else {
        console.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    const phoneError = getPhoneValidationError(formData.phone);
    if (phoneError) {
      setMessage({ type: "error", text: phoneError });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setMessage({ type: "success", text: "Profile updated successfully." });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const err = await response.json();
        setMessage({ type: "error", text: err.error || "Failed to update profile." });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div
              role="alert"
              className={`rounded-md px-3 py-2 text-sm ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/50"
                  : "bg-red-500/20 text-red-300 border border-red-500/50"
              }`}
            >
              {message.text}
            </div>
          )}
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="e.g. +44 7xxx or +234 8xx"
              />
              <p className="text-xs text-slate-400">{PHONE_COUNTRY_CODE_HINT}</p>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Skills & Interests</h3>
            
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="bg-slate-800/50 border-slate-700/50 text-white"
                placeholder="Add a skill or interest"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                variant="outline"
                className="border-slate-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-blue-500/20 text-blue-300 border-blue-500/50 flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Availability (Simple JSON editor) */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Availability</h3>
            <p className="text-sm text-slate-400">
              Availability settings can be managed by admins. Contact an administrator to update your availability.
            </p>
            {Object.keys(formData.availability).length > 0 && (
              <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50">
                <pre className="text-xs text-slate-300 overflow-auto">
                  {JSON.stringify(formData.availability, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

