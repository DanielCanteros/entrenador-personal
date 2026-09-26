import ClientePerfil from "../../components/ClientePerfil.js";

export const metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <div className="container admin-content" style={{ maxWidth: 560 }}>
      <ClientePerfil />
    </div>
  );
}
