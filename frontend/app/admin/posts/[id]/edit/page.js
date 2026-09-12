"use client";

import { use } from "react";
import AdminGuard from "../../../../../components/admin/AdminGuard.js";
import AdminTopBar from "../../../../../components/admin/AdminTopBar.js";
import PostForm from "../../../../../components/admin/PostForm.js";

export default function EditPostPage({ params }) {
  const { id } = use(params);

  return (
    <AdminGuard>
      <AdminTopBar title="Editar artículo" />
      <div className="container admin-content">
        <PostForm postId={id} />
      </div>
    </AdminGuard>
  );
}
