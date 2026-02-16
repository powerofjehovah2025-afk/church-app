import { FormsManager } from "@/components/admin/forms/forms-manager";
import { FormErrorBoundary } from "@/components/admin/forms/error-boundary";

export default function FormsPage() {
  return (
    <div className="container mx-auto min-w-0 w-full max-w-full py-4 px-4 sm:py-8">
      <FormErrorBoundary>
        <FormsManager />
      </FormErrorBoundary>
    </div>
  );
}

