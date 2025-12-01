"use client";

import type { ReactNode } from "react";
import { AppShell } from "../../../components/AppShell";
import { useParams } from "next/navigation";

export default function MatterLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;

  return <AppShell matterId={matterId}>{children}</AppShell>;
}
