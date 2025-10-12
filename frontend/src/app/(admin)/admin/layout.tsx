"use client";

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUserRole } from "@/lib/supabaseServer";
import { useEffect, useState } from "react";

export default function AdminLayout() {
  const location = useLocation();
  const [role, setRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const resolveRole = async () => {
      const resolved = await getUserRole();
      if (active) {
        setRole(resolved);
        setLoading(false);
      }
    };
    resolveRole();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (role !== "admin") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

