import CuentaNav from "../../components/CuentaNav.js";
import ProgresoDashboard from "../../components/progreso/ProgresoDashboard.js";

export const metadata = {
  title: "Mi progreso",
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return (
    <div className="container prog-page">
      <CuentaNav />
      <ProgresoDashboard />
    </div>
  );
}
