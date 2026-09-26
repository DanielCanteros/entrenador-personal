"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { adminLogout } from "../../lib/api.js";

const NAV_LINKS = [
  { href: "/admin", label: "Artículos" },
  { href: "/admin/contactos", label: "Mensajes" },
  { href: "/admin/clientes", label: "Clientes" },
];

export default function AdminTopBar({ title }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await adminLogout();
    } finally {
      router.push("/admin/login");
    }
  }

  return (
    <div className="admin-topbar">
      <div>
        <Link href="/admin" className="admin-topbar__brand">
          Panel de administración
        </Link>
        {title && <p className="admin-topbar__title">{title}</p>}
      </div>
      <nav className="admin-topbar__nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-topbar__nav-link${pathname === link.href ? " is-active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="admin-topbar__actions">
        <Link href="/" className="btn btn-outline" target="_blank">
          Ver web
        </Link>
        <button type="button" className="btn btn-dark" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
