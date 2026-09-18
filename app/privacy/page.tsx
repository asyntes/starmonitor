import type { Metadata, Viewport } from 'next';
import Header from '../../src/components/Header/Header';
import PrivacyNotice from '../../src/components/PrivacyNotice/PrivacyNotice';

export const metadata: Metadata = {
    title: 'Informativa sulla privacy - Starmonitor',
    description:
        'Informativa sul trattamento dei dati personali di Starmonitor ai sensi degli articoli 13 e 14 del GDPR.',
    openGraph: {
        title: 'Informativa sulla privacy - Starmonitor',
        description:
            'Informativa sul trattamento dei dati personali di Starmonitor ai sensi degli articoli 13 e 14 del GDPR.',
        url: 'https://starmonitor.vercel.app/privacy',
        siteName: 'Starmonitor',
        type: 'website',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    userScalable: true,
};

export default function PrivacyPage() {
    return (
        <>
            <Header variant="solid" />
            <PrivacyNotice />
        </>
    );
}
