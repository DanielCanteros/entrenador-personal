"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clienteLogout } from "../lib/api.js";

const LINKS = [
  { href: "/cuenta", label: "Mi progreso" },
  { href: "/cuenta/perfil", label: "Mi perfil" },
];

export default function CuentaNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await clienteLogout();
    } finally {
      router.push("/cuenta/login");
    }
  }

  return (
    <nav className="cuenta-nav" aria-label="Mi cuenta">
      <div className="cuenta-nav__links">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`cuenta-nav__link${pathname === link.href ? " is-active" : ""}`}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button type="button" className="btn btn-outline cuenta-nav__logout" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </nav>
  );
}
