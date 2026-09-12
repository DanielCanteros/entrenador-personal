"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMe } from "../../lib/api.js";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    adminMe()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="container admin-loading">
        <p>Cargando…</p>
      </div>
    );
  }

  return children;
}
