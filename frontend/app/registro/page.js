import { Suspense } from "react";
import RegistroForm from "../../components/RegistroForm.js";

export const metadata = {
  title: "Completa tu registro",
  robots: { index: false, follow: false },
};

export default function RegistroPage() {
  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: "3rem", paddingBottom: "3rem" }}>
      <h1>Completa tu registro</h1>
      <Suspense fallback={<p>Cargando…</p>}>
        <RegistroForm />
      </Suspense>
    </div>
  );
}
