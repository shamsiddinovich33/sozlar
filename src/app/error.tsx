"use client";

import { ErrorContent } from "@/components/feedback/error-content";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="px-4">
      <ErrorContent {...props} />
    </main>
  );
}
