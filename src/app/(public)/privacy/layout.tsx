import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni | NexoPost - Uptexx Information Technologies',
  description: 'NexoPost veri gizliliği politikamız ve 6698 Sayılı KVKK kapsamındaki yasal bildirimlerimiz. Sosyal medya API verilerinizin nasıl güvenli saklandığını öğrenin.',
  keywords: ['KVKK', 'privacy policy', 'gizlilik politikası', 'data security', 'NexoPost KVKK', 'Uptexx Bilgi Teknolojileri', 'sosyal medya veri güvenliği', 'GDPR compliance'],
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
