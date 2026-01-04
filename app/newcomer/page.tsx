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
import { CheckCircle2 } from "lucide-react";

const INTEREST_AREAS = [
  "Worship",
  "Media",
  "Youth",
  "Children",
  "Outreach",
  "Administration",
  "Music",
  "Teaching",
] as const;

export default function NewcomerPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    service_time: "",
    age_group: "",
    interest_areas: [] as string[],
    how_did_you_hear: "",
    prayer_request: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInterestAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        interest_areas: [...formData.interest_areas, area],
      });
    } else {
      setFormData({
        ...formData,
        interest_areas: formData.interest_areas.filter((a) => a !== area),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the insert data matching NewcomerInsert type
      // Status is automatically set to 'New' for all new registrations
      const insertData: NewcomerInsert = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        service_time: formData.service_time || null,
        age_group: formData.age_group || null,
        interest_areas:
          formData.interest_areas.length > 0
            ? formData.interest_areas
            : null,
        how_did_you_hear: formData.how_did_you_hear.trim() || null,
        prayer_request: formData.prayer_request.trim() || null,
        status: "New", // Automatically set to 'New' for all new registrations
      };

      const { error: insertError } = await supabase
        .from("newcomers")
        .insert(insertData);

      if (insertError) throw insertError;

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        service_time: "",
        age_group: "",
        interest_areas: [],
        how_did_you_hear: "",
        prayer_request: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;re so glad you&apos;re here. Please take a moment to let us
            know how we can connect with you.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">
              Newcomer Registration
            </CardTitle>
            <CardDescription>
              Your information helps us serve you better and stay connected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="border-b border-border pb-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Basic Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Let&apos;s start with the essentials
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_time">Service Attended</Label>
                    <select
                      id="service_time"
                      value={formData.service_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service_time: e.target.value,
                        })
                      }
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="">Select a service time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="Mid-week">Mid-week</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Optional - Which service did you attend?
                    </p>
                  </div>
                </div>
              </div>

              {/* Getting to Know You Section */}
              <div className="space-y-6">
                <div className="border-b border-border pb-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Getting to Know You
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how we can serve you better
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="age_group">Age Group</Label>
                    <select
                      id="age_group"
                      value={formData.age_group}
                      onChange={(e) =>
                        setFormData({ ...formData, age_group: e.target.value })
                      }
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="">Select your age group</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-45">36-45</option>
                      <option value="46-55">46-55</option>
                      <option value="56-65">56-65</option>
                      <option value="65+">65+</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Optional - This helps us connect you with relevant
                      ministries
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Interest Areas</Label>
                    <p className="text-xs text-muted-foreground">
                      Optional - Select any areas you&apos;re interested in
                      (select all that apply)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {INTEREST_AREAS.map((area) => (
                        <div
                          key={area}
                          className="flex items-center space-x-2 rounded-md border border-input p-3 hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={`interest-${area}`}
                            checked={formData.interest_areas.includes(area)}
                            onCheckedChange={(checked) =>
                              handleInterestAreaChange(
                                area,
                                checked === true,
                              )
                            }
                            disabled={isLoading}
                          />
                          <Label
                            htmlFor={`interest-${area}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {area}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="how_did_you_hear">
                      How did you hear about us?
                    </Label>
                    <select
                      id="how_did_you_hear"
                      value={formData.how_did_you_hear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          how_did_you_hear: e.target.value,
                        })
                      }
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="">Select an option</option>
                      <option value="Friend or Family">Friend or Family</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Website">Website</option>
                      <option value="Google Search">Google Search</option>
                      <option value="Church Sign">Church Sign</option>
                      <option value="Event">Event</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Optional - We&apos;d love to know how you found us
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prayer_request">Prayer Request</Label>
                    <textarea
                      id="prayer_request"
                      rows={4}
                      placeholder="Share any prayer requests or how we can pray for you..."
                      value={formData.prayer_request}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prayer_request: e.target.value,
                        })
                      }
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional - We&apos;d love to know how we can pray for you
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Thank you for registering!</p>
                    <p className="text-xs">
                      We&apos;re excited to connect with you soon.
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading || success}
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
                ) : success ? (
                  "Submitted Successfully"
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Your privacy is important to us. We will only use your information to
          stay connected and serve you better.
        </p>
      </div>
    </div>
  );
}
