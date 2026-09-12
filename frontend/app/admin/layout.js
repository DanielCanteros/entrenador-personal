export const metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <div className="admin-shell">{children}</div>;
}
