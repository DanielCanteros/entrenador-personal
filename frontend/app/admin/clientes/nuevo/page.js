import AdminGuard from "../../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../../components/admin/AdminTopBar.js";
import ClienteForm from "../../../../components/admin/ClienteForm.js";

export default function NewClientePage() {
  return (
    <AdminGuard>
      <AdminTopBar title="Nuevo cliente" />
      <div className="container admin-content">
        <ClienteForm />
      </div>
    </AdminGuard>
  );
}
