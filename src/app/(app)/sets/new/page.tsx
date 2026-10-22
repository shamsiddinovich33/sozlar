import type { Metadata } from "next";

import { SetEditor } from "@/components/set-editor/set-editor";

export const metadata: Metadata = { title: "Yangi to'plam" };

export default function NewSetPage() {
  return (
    <SetEditor
      initial={{
        setId: null,
        title: "",
        description: "",
        visibility: "PRIVATE",
        hasPassword: false,
        cards: [],
      }}
    />
  );
}
