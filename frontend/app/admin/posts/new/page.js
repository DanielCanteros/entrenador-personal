import AdminGuard from "../../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../../components/admin/AdminTopBar.js";
import PostForm from "../../../../components/admin/PostForm.js";

export default function NewPostPage() {
  return (
    <AdminGuard>
      <AdminTopBar title="Nuevo artículo" />
      <div className="container admin-content">
        <PostForm />
      </div>
    </AdminGuard>
  );
}
