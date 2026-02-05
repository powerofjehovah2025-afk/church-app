"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Component to track invitation code usage after OAuth signup
 * This runs on the client side after OAuth redirect
 */
export function AuthCodeTracker() {
  useEffect(() => {
    const trackCodeUsage = async () => {
      // Check if there's a pending invitation code from sessionStorage
      if (typeof window === "undefined") return;

      const pendingCode = sessionStorage.getItem("pending_invitation_code");
      const pendingCodeId = sessionStorage.getItem("pending_invitation_code_id");

      if (!pendingCode || !pendingCodeId) return;

      // Get current user
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Record code usage
      try {
        await fetch("/api/invitation-codes/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codeId: pendingCodeId,
            userId: user.id,
          }),
        });

        // Clear session storage
        sessionStorage.removeItem("pending_invitation_code");
        sessionStorage.removeItem("pending_invitation_code_id");
      } catch (error) {
        console.error("Error recording code usage:", error);
      }
    };

    // Small delay to ensure user is fully authenticated
    const timeoutId = setTimeout(trackCodeUsage, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}


