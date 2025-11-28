"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useMatterId() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const matterId = searchParams.get("matterId");

  const setMatterId = useCallback(
    (newMatterId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newMatterId) {
        params.set("matterId", newMatterId);
      } else {
        params.delete("matterId");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return { matterId, setMatterId };
}
