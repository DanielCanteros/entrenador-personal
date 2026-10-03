import ClientePerfil from "../../../components/ClientePerfil.js";
import CuentaNav from "../../../components/CuentaNav.js";

export const metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false },
};

export default function CuentaPerfilPage() {
  return (
    <div className="container prog-page">
      <CuentaNav />
      <div style={{ maxWidth: 560 }}>
        <ClientePerfil />
      </div>
    </div>
  );
}
