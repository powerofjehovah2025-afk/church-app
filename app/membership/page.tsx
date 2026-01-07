"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Newcomer, NewcomerInsert, NewcomerUpdate } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Stepper } from "@/components/ui/stepper";
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

const DEPARTMENTS = [
  "Choir",
  "Multimedia",
  "Evangelism",
  "Children's Teacher",
  "Teens Teacher",
  "Sunday school Teacher",
  "Social Media",
  "Ushering",
  "Hospitality",
  "Welcome Team",
  "Parking",
  "Sanctuary",
  "Transport",
  "Decoration",
  "Announcement",
] as const;

const GDPR_TEXT = `By submitting this form, you consent to RCCG Power of Jehovah, Essex storing and processing your personal data for the purposes of church membership, communication, and ministry involvement. Your data will be kept secure and will only be used for church-related activities. You have the right to access, update, or request deletion of your personal data at any time by contacting the church administration.`;

export default function MembershipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Section 1: GDPR & Personal
    first_name: "",
    surname: "",
    phone: "",
    whatsapp: "",
    email: "",
    gender: "",
    birthday_month: "",
    birthday_day: "",
    status: "",
    wedding_month: "",
    wedding_day: "",
    address: "",
    postcode: "",
    town: "",
    gdpr_consent: false,
    // Section 2: Church Info
    parish_chelmsford: "",
    country_origin: "",
    transport: "",
    start_date: "",
    // Section 3: Spiritual Journey
    born_again: "",
    born_again_when_where: "",
    baptised: "",
    baptised_when: "",
    // Section 4: Involvement
    join_workforce: false,
    departments: [] as string[],
    // Section 5: Career
    sector: "",
    profession: "",
    has_children: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    "GDPR & Personal",
    "Church Info",
    "Spiritual Journey",
    "Involvement",
    "Career",
  ];

  const handleDepartmentChange = (dept: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        departments: [...formData.departments, dept],
      });
    } else {
      setFormData({
        ...formData,
        departments: formData.departments.filter((d) => d !== dept),
      });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.gdpr_consent) {
          setError("Please provide GDPR consent to continue");
          return false;
        }
        if (!formData.first_name || !formData.surname) {
          setError("First Name and Surname are required");
          return false;
        }
        return true;
      case 2:
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Smart notes merging function - prevents duplicates and updates existing fields
  const mergeNotes = (
    existingNotes: string | null,
    newFields: Record<string, string>
  ): string | null => {
    const existingParts = existingNotes ? existingNotes.split(" | ") : [];
    const existingMap = new Map<string, string>();

    // Parse existing notes into a map (key: value pairs)
    existingParts.forEach((part) => {
      const colonIndex = part.indexOf(":");
      if (colonIndex > 0) {
        const key = part.substring(0, colonIndex).trim();
        const value = part.substring(colonIndex + 1).trim();
        if (key && value) {
          existingMap.set(key, value);
        }
      }
    });

    // Update with new values (new values override old ones)
    Object.entries(newFields).forEach(([key, value]) => {
      if (value && value.trim()) {
        existingMap.set(key, value.trim());
      }
    });

    // Convert back to pipe-separated string
    if (existingMap.size === 0) return null;
    return Array.from(existingMap.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  };

  // Smart status progression - advances status when appropriate
  const getNewStatus = (
    existingStatus: string | null,
    isJoining: boolean
  ): string => {
    // If no existing status, start as New
    if (!existingStatus) return "New";

    // If they're already a member, don't downgrade
    if (existingStatus === "Member") return "Member";

    // If they're completing membership form, they're showing commitment
    if (isJoining) {
      // Progress from First Timer or New to Contacted
      if (existingStatus === "First Timer" || existingStatus === "New") {
        return "Contacted";
      }
      // If already Contacted, move to Engaged
      if (existingStatus === "Contacted") {
        return "Engaged";
      }
      // If already Engaged, move to Member
      if (existingStatus === "Engaged") {
        return "Member";
      }
    }

    // Otherwise, keep existing status (don't downgrade)
    return existingStatus;
  };

  // Smart interest areas merging - merges arrays without duplicates
  const mergeInterestAreas = (
    existing: string[] | null,
    newAreas: string[]
  ): string[] | null => {
    if (newAreas.length === 0) {
      return existing || null;
    }
    
    const merged = [...(existing || []), ...newAreas];
    // Remove duplicates
    return Array.from(new Set(merged));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Only allow submission on the last step - prevent accidental submission
    if (currentStep !== steps.length) {
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      // Combine first name and surname
      const fullName = `${formData.first_name.trim()} ${formData.surname.trim()}`.trim();
      const email = formData.email.trim();

      // Check if record exists by email
      const { data: existingRecord } = await supabase
        .from("newcomers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      // Type assertion for existingRecord to fix TypeScript inference issues (pattern from welcome/page.tsx)
      const record = existingRecord as Newcomer | null;

      // Smart merge notes - prevents duplicates and updates existing fields
      const notes = mergeNotes(record?.notes || null, {
        "Gender": formData.gender || "",
        "Birthday": formData.birthday_month && formData.birthday_day 
          ? `${formData.birthday_month}/${formData.birthday_day}` 
          : "",
        "Status": formData.status || "",
        "Wedding Anniversary": formData.wedding_month && formData.wedding_day
          ? `${formData.wedding_month}/${formData.wedding_day}`
          : "",
        "Town": formData.town || "",
        "WhatsApp": formData.whatsapp || "",
        "Parish": formData.parish_chelmsford || "",
        "Country of Origin": formData.country_origin || "",
        "Transport": formData.transport || "",
        "Start Date": formData.start_date || "",
        "Born Again": formData.born_again || "",
        "Born Again Details": formData.born_again_when_where || "",
        "Baptised": formData.baptised || "",
        "Baptised When": formData.baptised_when || "",
        "Join Workforce": formData.join_workforce ? "Yes" : "",
        "Departments": formData.departments.length > 0 
          ? formData.departments.join(", ") 
          : "",
        "Sector": formData.sector || "",
        "Profession": formData.profession || "",
        "Has Children": formData.has_children ? "Yes" : "",
        "Last Membership Form Update": new Date().toISOString().split("T")[0],
      });

      // Prepare the data with smart merging (prefer new data, preserve existing if new is empty)
      const dataToSave: NewcomerInsert = {
        // Name: Keep existing if it's more complete, otherwise use new
        full_name: record?.full_name || fullName,
        
        // Email: Always use the one from form (it's the lookup key)
        email: email,
        
        // Phone: Prefer new, fallback to existing
        phone: formData.phone?.trim() || record?.phone || null,
        
        // Marital status: Prefer new, fallback to existing
        marital_status: formData.status || record?.marital_status || null,
        
        // Address: Prefer new, fallback to existing
        address: formData.address?.trim() || record?.address || null,
        
        // Occupation: Prefer new, fallback to existing
        occupation: formData.profession?.trim() || record?.occupation || null,
        
        // Interest areas: Smart merge (combines existing and new, removes duplicates)
        interest_areas: mergeInterestAreas(
          record?.interest_areas || null,
          formData.departments
        ),
        
        // Notes: Smart merged (no duplicates)
        notes: notes,
        
        // Status: Smart progression (advances when appropriate - completing membership form shows commitment)
        status: getNewStatus(record?.status || null, true),
      };

      if (record) {
        // UPDATE existing record
        // Create proper NewcomerUpdate object (all fields optional) instead of casting
        const updateData: NewcomerUpdate = {
          full_name: dataToSave.full_name,
          email: dataToSave.email,
          phone: dataToSave.phone ?? null,
          marital_status: dataToSave.marital_status ?? null,
          address: dataToSave.address ?? null,
          occupation: dataToSave.occupation ?? null,
          interest_areas: dataToSave.interest_areas ?? null,
          notes: dataToSave.notes ?? null,
          status: dataToSave.status ?? null,
        };
        
        // Use @ts-expect-error to bypass TypeScript inference issue with Supabase
        // This is a known limitation of the Supabase client type inference in some versions
        // @ts-expect-error - Supabase query builder sometimes infers 'never' for update parameters
        const { error: updateError } = await supabase
          .from("newcomers")
          .update(updateData)
          .eq("email", email);

        if (updateError) throw updateError;
      } else {
        // INSERT new record
        const { error: insertError } = await supabase
          .from("newcomers")
          .insert(dataToSave);

        if (insertError) throw insertError;
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              <p className="font-medium mb-2">GDPR Consent</p>
              <p className="text-xs leading-relaxed">{GDPR_TEXT}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">
                  Surname <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="surname"
                  type="text"
                  required
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({ ...formData, surname: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday_month">Birthday (Month)</Label>
                <select
                  id="birthday_month"
                  value={formData.birthday_month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthday_month: e.target.value,
                    })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday_day">Birthday (Day)</Label>
                <select
                  id="birthday_day"
                  value={formData.birthday_day}
                  onChange={(e) =>
                    setFormData({ ...formData, birthday_day: e.target.value })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wedding_month">Wedding Anniversary (Month)</Label>
                <select
                  id="wedding_month"
                  value={formData.wedding_month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wedding_month: e.target.value,
                    })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wedding_day">Wedding Anniversary (Day)</Label>
                <select
                  id="wedding_day"
                  value={formData.wedding_day}
                  onChange={(e) =>
                    setFormData({ ...formData, wedding_day: e.target.value })
                  }
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(e) =>
                    setFormData({ ...formData, postcode: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="town">Town</Label>
                <Input
                  id="town"
                  type="text"
                  value={formData.town}
                  onChange={(e) =>
                    setFormData({ ...formData, town: e.target.value })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-md border border-input p-4">
              <Checkbox
                id="gdpr_consent"
                checked={formData.gdpr_consent}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    gdpr_consent: checked === true,
                  })
                }
                disabled={isLoading}
                required
              />
              <Label
                htmlFor="gdpr_consent"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                <span className="text-destructive">*</span> I consent to the
                GDPR terms as described above
              </Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="parish_chelmsford">Parish in Chelmsford</Label>
              <Input
                id="parish_chelmsford"
                type="text"
                placeholder="Enter parish name"
                value={formData.parish_chelmsford}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parish_chelmsford: e.target.value,
                  })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_origin">Country of Origin</Label>
              <Input
                id="country_origin"
                type="text"
                placeholder="Enter country"
                value={formData.country_origin}
                onChange={(e) =>
                  setFormData({ ...formData, country_origin: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport">Means of Transport</Label>
              <select
                id="transport"
                value={formData.transport}
                onChange={(e) =>
                  setFormData({ ...formData, transport: e.target.value })
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="Church's Transport">Church&apos;s Transport</option>
                <option value="Taxi">Taxi</option>
                <option value="Public Transport">Public Transport</option>
                <option value="My Car">My Car</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date at POJ</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="born_again">Are you Born Again?</Label>
              <select
                id="born_again"
                value={formData.born_again}
                onChange={(e) =>
                  setFormData({ ...formData, born_again: e.target.value })
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="I don't know">I don&apos;t know</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="born_again_when_where">When/Where?</Label>
              <Input
                id="born_again_when_where"
                type="text"
                placeholder="Enter details"
                value={formData.born_again_when_where}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    born_again_when_where: e.target.value,
                  })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baptised">Baptised by Immersion?</Label>
              <select
                id="baptised"
                value={formData.baptised}
                onChange={(e) =>
                  setFormData({ ...formData, baptised: e.target.value })
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="When?">When?</option>
              </select>
            </div>

            {formData.baptised === "When?" && (
              <div className="space-y-2">
                <Label htmlFor="baptised_when">When?</Label>
                <Input
                  id="baptised_when"
                  type="text"
                  placeholder="Enter when you were baptised"
                  value={formData.baptised_when}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      baptised_when: e.target.value,
                    })
                  }
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 rounded-md border border-input p-4">
              <Checkbox
                id="join_workforce"
                checked={formData.join_workforce}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    join_workforce: checked === true,
                  })
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="join_workforce"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Join work force?
              </Label>
            </div>

            {formData.join_workforce && (
              <div className="space-y-3">
                <Label>Departments</Label>
                <p className="text-xs text-muted-foreground">
                  Select all departments you&apos;re interested in
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DEPARTMENTS.map((dept) => (
                    <div
                      key={dept}
                      className="flex items-center space-x-2 rounded-md border border-input p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={formData.departments.includes(dept)}
                        onCheckedChange={(checked) =>
                          handleDepartmentChange(dept, checked === true)
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={`dept-${dept}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                type="text"
                placeholder="e.g., Health, IT, Education"
                value={formData.sector}
                onChange={(e) =>
                  setFormData({ ...formData, sector: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                type="text"
                placeholder="Enter your profession"
                value={formData.profession}
                onChange={(e) =>
                  setFormData({ ...formData, profession: e.target.value })
                }
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2 rounded-md border border-input p-4">
              <Checkbox
                id="has_children"
                checked={formData.has_children}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    has_children: checked === true,
                  })
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="has_children"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Do you come with children?
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            RCCG POWER OF JEHOVAH, ESSEX
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Membership Registration Form
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">
              Membership Application
            </CardTitle>
            <CardDescription>
              Please complete all sections to submit your membership application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <Stepper
                currentStep={currentStep}
                totalSteps={steps.length}
                steps={steps}
              />
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                // Only submit if on last step, otherwise prevent default
                if (currentStep === steps.length) {
                  handleSubmit(e);
                } else {
                  // On earlier steps, prevent form submission and go to next step
                  handleNext();
                }
              }} 
              className="space-y-6"
            >
              {renderStepContent()}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex flex-col items-center gap-4 rounded-md bg-green-50 p-6 text-center text-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle2 className="h-8 w-8" />
                  <div>
                    <p className="font-medium text-lg mb-2">
                      Thank you for your membership application!
                    </p>
                    <p className="text-sm">
                      Your application has been submitted successfully. Our team
                      will review your information and contact you soon with
                      next steps.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isLoading || success}
                    className="flex-1 sm:flex-initial"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading || success}
                    className="flex-1 sm:flex-initial"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || success}
                    className="flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

