import { FormsManager } from "@/components/admin/forms/forms-manager";
import { FormErrorBoundary } from "@/components/admin/forms/error-boundary";

export default function FormsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <FormErrorBoundary>
        <FormsManager />
      </FormErrorBoundary>
    </div>
  );
}

