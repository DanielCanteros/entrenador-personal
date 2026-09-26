import ClienteLoginForm from "../../../components/ClienteLoginForm.js";

export const metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default function ClienteLoginPage() {
  return (
    <div
      className="container"
      style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 0" }}
    >
      <ClienteLoginForm />
    </div>
  );
}
