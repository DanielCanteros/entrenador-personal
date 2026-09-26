"use client";

import { use } from "react";
import AdminGuard from "../../../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../../../components/admin/AdminTopBar.js";
import EvaluacionAdmin from "../../../../../components/admin/EvaluacionAdmin.js";

export default function ClienteEvaluacionPage({ params }) {
  const { id } = use(params);

  return (
    <AdminGuard>
      <AdminTopBar title="Evaluación del cliente" />
      <div className="container admin-content">
        <div className="admin-content__header">
          <h1>Evaluación</h1>
        </div>
        <EvaluacionAdmin clienteId={id} />
      </div>
    </AdminGuard>
  );
}
