"use client";

import { ErrorContent } from "@/components/feedback/error-content";

export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorContent {...props} />;
}
