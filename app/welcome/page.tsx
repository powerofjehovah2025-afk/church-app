"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewcomerInsert } from "@/types/database.types";
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
import { CheckCircle2, ExternalLink } from "lucide-react";

export default function WelcomePage() {
  const [formData, setFormData] = useState({
    sex: "",
    marital_status: "",
    first_name: "",
    surname: "",
    address: "",
    postcode: "",
    phone: "",
    whatsapp: "",
    email: "",
    joining_us: "",
    can_visit: "",
    whatsapp_group: "",
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

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
    joiningUs: string
  ): string => {
    // If no existing status, start as First Timer
    if (!existingStatus) return "First Timer";

    // If they're already a member, don't downgrade
    if (existingStatus === "Member") return "Member";

    // If they say "Yes" to joining, progress them forward
    if (joiningUs === "Yes") {
      // Progress from First Timer or New to Contacted (showing commitment)
      if (existingStatus === "First Timer" || existingStatus === "New") {
        return "Contacted";
      }
      // If already Contacted, move to Engaged
      if (existingStatus === "Contacted") {
        return "Engaged";
      }
    }

    // Otherwise, keep existing status (don't downgrade)
    return existingStatus;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consent) {
      setError("Please provide consent to continue");
      return;
    }

    if (
      !formData.first_name ||
      !formData.surname ||
      !formData.email ||
      !formData.sex ||
      !formData.marital_status ||
      !formData.address ||
      !formData.postcode ||
      !formData.whatsapp_group
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Combine first name and surname for full_name
      const fullName = `${formData.first_name.trim()} ${formData.surname.trim()}`.trim();
      const email = formData.email.trim();

      // Check if record exists by email
      const { data: existingRecord, error: fetchError } = await supabase
        .from("newcomers")
        .select("id, full_name, phone, marital_status, address, notes, status, interest_areas, occupation")
        .eq("email", email)
        .maybeSingle();
      
      // If fetchError and it's not a "not found" error, throw it
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Type assertion for existingRecord to fix TypeScript inference issues
      const record = existingRecord as {
        id?: string;
        full_name?: string;
        phone?: string | null;
        marital_status?: string | null;
        address?: string | null;
        notes?: string | null;
        status?: string | null;
        interest_areas?: string[] | null;
        occupation?: string | null;
      } | null;

      // Smart merge notes - prevents duplicates and updates existing fields
      const notes = mergeNotes(record?.notes || null, {
        "Joining us": formData.joining_us,
        "Can visit": formData.can_visit,
        "WhatsApp Group": formData.whatsapp_group,
        "Sex": formData.sex,
        "Postcode": formData.postcode,
        "WhatsApp": formData.whatsapp,
        "Last Welcome Form Update": new Date().toISOString().split("T")[0], // Track when last updated
      });

      // Smart status progression - advances status when they're joining
      const newStatus = getNewStatus(record?.status || null, formData.joining_us);

      // Prepare the data with smart merging (prefer new data, preserve existing if new is empty)
      const dataToSave: NewcomerInsert = {
        // Name: Keep existing if it's more complete, otherwise use new
        full_name: record?.full_name || fullName,
        
        // Email: Always use the one from form (it's the lookup key)
        email: email,
        
        // Phone: Prefer new, fallback to existing
        phone: formData.phone?.trim() || record?.phone || null,
        
        // Marital status: Prefer new, fallback to existing
        marital_status: formData.marital_status || record?.marital_status || null,
        
        // Address: Prefer new, fallback to existing
        address: formData.address?.trim() || record?.address || null,
        
        // Notes: Smart merged (no duplicates)
        notes: notes,
        
        // Status: Smart progression (advances when appropriate)
        status: newStatus,
      };

      if (record) {
        // UPDATE existing record
        const { error: updateError } = await supabase
          .from("newcomers")
          // @ts-expect-error - Supabase type inference issue, but this works at runtime
          .update(dataToSave)
          .eq("email", email);

        if (updateError) throw updateError;
      } else {
        // INSERT new record
        const { error: insertError } = await supabase
          .from("newcomers")
          // @ts-expect-error - Supabase type inference issue, but this works at runtime
          .insert(dataToSave);

        if (insertError) throw insertError;
      }

      // Show WhatsApp button if they selected Yes
      setShowWhatsAppButton(formData.whatsapp_group === "Yes");
      setSuccess(true);

      // Reset form after successful submission
      setFormData({
        sex: "",
        marital_status: "",
        first_name: "",
        surname: "",
        address: "",
        postcode: "",
        phone: "",
        whatsapp: "",
        email: "",
        joining_us: "",
        can_visit: "",
        whatsapp_group: "",
        consent: false,
      });

      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(false);
        setShowWhatsAppButton(false);
      }, 10000);
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

  const RadioGroup = ({
    name,
    value,
    onChange,
    options,
    label,
    disabled,
  }: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    label: string;
    disabled?: boolean;
  }) => (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="flex gap-4">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 border-primary text-primary focus:ring-primary focus:ring-2"
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-3">
            WELCOME TO POJ
          </h1>
          <p className="text-lg text-muted-foreground">
            Giving us your details will enable us to contact you via email or
            phone.
          </p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">
              First-Timer Registration
            </CardTitle>
            <CardDescription>
              We&apos;re delighted to have you with us today!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Consent Note */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-4 text-sm text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium mb-2">Account/Consent Note</p>
                  <p>
                    By submitting this form, you consent to us storing and using
                    your information to stay connected and serve you better. You
                    can update or remove your information at any time.
                  </p>
                </div>

                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sex">
                        Sex <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="sex"
                        value={formData.sex}
                        onChange={(e) =>
                          setFormData({ ...formData, sex: e.target.value })
                        }
                        required
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marital_status">
                        Marital Status <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="marital_status"
                        value={formData.marital_status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            marital_status: e.target.value,
                          })
                        }
                        required
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
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="Enter your first name"
                        required
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
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
                        placeholder="Enter your surname"
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

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your address"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postcode">
                      Postcode <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postcode"
                      type="text"
                      placeholder="Enter your postcode"
                      required
                      value={formData.postcode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postcode: e.target.value,
                        })
                      }
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="WhatsApp number"
                        value={formData.whatsapp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            whatsapp: e.target.value,
                          })
                        }
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-6 pt-4 border-t border-border">
                  <RadioGroup
                    name="joining_us"
                    value={formData.joining_us}
                    onChange={(value) =>
                      setFormData({ ...formData, joining_us: value })
                    }
                    options={[
                      { label: "Yes", value: "Yes" },
                      { label: "No", value: "No" },
                    ]}
                    label="Are you joining us?"
                    disabled={isLoading}
                  />

                  <RadioGroup
                    name="can_visit"
                    value={formData.can_visit}
                    onChange={(value) =>
                      setFormData({ ...formData, can_visit: value })
                    }
                    options={[
                      { label: "Yes", value: "Yes" },
                      { label: "No", value: "No" },
                    ]}
                    label="Can we visit?"
                    disabled={isLoading}
                  />

                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Will you like to be added to our WhatsApp Group?{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-4">
                      {[
                        { label: "Yes", value: "Yes" },
                        { label: "No", value: "No" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`whatsapp_group-${option.value}`}
                            name="whatsapp_group"
                            value={option.value}
                            checked={formData.whatsapp_group === option.value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                whatsapp_group: e.target.value,
                              })
                            }
                            disabled={isLoading}
                            required
                            className="h-4 w-4 border-primary text-primary focus:ring-primary focus:ring-2"
                          />
                          <Label
                            htmlFor={`whatsapp_group-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.whatsapp_group === "Yes" && (
                      <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950/50 p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
                          If yes please, click on this link:
                        </p>
                        <Button
                          type="button"
                          onClick={() =>
                            window.open(
                              "https://chat.whatsapp.com/YOUR_GROUP_LINK",
                              "_blank",
                            )
                          }
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Join WhatsApp Group
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start space-x-2 rounded-md border border-input p-4 bg-muted/30">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        consent: checked === true,
                      })
                    }
                    disabled={isLoading}
                    required
                  />
                  <Label
                    htmlFor="consent"
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <span className="text-destructive">*</span> I consent to
                    the storage and use of my information as described above
                  </Label>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading}
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
                    "Submit"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 rounded-lg bg-green-50 dark:bg-green-950/50 p-6 text-center text-green-800 dark:text-green-200 border-2 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-12 w-12" />
                  <div>
                    <p className="font-semibold text-lg mb-2">
                      Thank you for registering!
                    </p>
                    <p className="text-sm">
                      We&apos;re excited to connect with you soon. Our team will
                      be in touch with you shortly.
                    </p>
                  </div>
                </div>

                {showWhatsAppButton && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-6 text-center border border-blue-200 dark:border-blue-800">
                    <p className="font-medium mb-4 text-blue-900 dark:text-blue-200">
                      Join our WhatsApp Group
                    </p>
                    <Button
                      type="button"
                      onClick={() =>
                        window.open(
                          "https://chat.whatsapp.com/YOUR_GROUP_LINK",
                          "_blank",
                        )
                      }
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join WhatsApp Group
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Click the button above to join our community WhatsApp
                      group
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
