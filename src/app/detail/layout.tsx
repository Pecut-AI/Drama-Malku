// Popup donasi QRIS dimatikan untuk DramaMalku (sesuai petunjuk README upstream):
// import QrisDonationPopup from '@/components/QrisDonationPopup';

export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* <QrisDonationPopup /> */}
    </>
  );
}
