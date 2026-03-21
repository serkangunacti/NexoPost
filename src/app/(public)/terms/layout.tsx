import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları (Terms of Service) | NexoPost',
  description: 'NexoPost bulut tabanlı sosyal medya yönetim sistemleri genel kullanım koşulları, iptal, iade ve spam (fair use) kuralları.',
  keywords: ['Terms of Service', 'Kullanım Koşulları', 'NexoPost Terms', 'Uptexx hizmet şartları', 'iade koşulları', 'spam politikası'],
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
