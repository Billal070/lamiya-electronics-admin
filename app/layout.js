import './globals.css';
import AdminLayout from '../components/AdminLayout';

export const metadata = {
  title: 'Lamiya Electronics - Admin Panel',
  description: 'Control center for Lamiya Electronics and IPS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  );
}
