import type { Metadata, Viewport } from 'next';
import Header from '../../src/components/Header/Header';
import PrivacyNotice from '../../src/components/PrivacyNotice/PrivacyNotice';

export const metadata: Metadata = {
    title: 'Privacy | Starmonitor',
    description:
        'Informativa privacy di Starmonitor di Asyntes. Privacy notice for the Starmonitor Starlink tracker by Asyntes.',
    openGraph: {
        title: 'Privacy | Starmonitor',
        description:
            'Informativa privacy di Starmonitor di Asyntes. Privacy notice for the Starmonitor Starlink tracker by Asyntes.',
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
