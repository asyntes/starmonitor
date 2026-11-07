import { NextResponse } from 'next/server';
import {
    catalogNumber,
    mergeSupGpWithGpFallback,
    parseTLEText,
    type TLEData,
} from '@/src/lib/tle';

const CELESTRAK_SUP_GP_URL =
    'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle';
const CELESTRAK_GP_URL =
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';

const CELESTRAK_USER_AGENT =
    'Starmonitor/1.0 (+https://starmonitor.vercel.app; info@asyntes.com)';

const REVALIDATE_SECONDS = 7200;

let lastGoodTle: TLEData[] | null = null;

const cacheHeaders = {
    'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
};

const fetchCelestrakText = async (url: string): Promise<string | null> => {
    const response = await fetch(url, {
        headers: {
            'User-Agent': CELESTRAK_USER_AGENT,
            Accept: 'text/plain',
        },
        next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
        console.error(`CelesTrak non-200 for ${url}: ${response.status}`);
        return null;
    }

    return response.text();
};

const loadMergedTle = async (): Promise<TLEData[]> => {
    const [supGpText, gpText] = await Promise.all([
        fetchCelestrakText(CELESTRAK_SUP_GP_URL),
        fetchCelestrakText(CELESTRAK_GP_URL),
    ]);

    const supGp = supGpText ? parseTLEText(supGpText) : [];
    const gp = gpText ? parseTLEText(gpText) : [];

    if (supGp.length === 0 && gp.length === 0) {
        throw new Error('Failed to fetch TLE data');
    }

    if (supGp.length === 0) {
        console.warn('SupGP unavailable, using 18 SDS GP fallback');
        return gp;
    }

    if (gp.length === 0) {
        console.warn('GP fallback unavailable; using SupGP only');
        return supGp;
    }

    const merged = mergeSupGpWithGpFallback(supGp, gp);
    const supGpIds = new Set(
        supGp.map((sat) => catalogNumber(sat)).filter((id): id is string => id !== null)
    );
    const filledFromGp = gp.filter((sat) => {
        const id = catalogNumber(sat);
        return id !== null && !supGpIds.has(id);
    }).length;
    if (filledFromGp > 0) {
        console.info(`SupGP missing ${filledFromGp} Starlink objects; filled from 18 SDS GP`);
    }

    return merged;
};

export async function GET() {
    try {
        const records = await loadMergedTle();
        lastGoodTle = records;
        return NextResponse.json(records, { headers: cacheHeaders });
    } catch (error) {
        console.error('Error fetching TLE data:', error);

        if (lastGoodTle && lastGoodTle.length > 0) {
            return NextResponse.json(lastGoodTle, {
                headers: {
                    ...cacheHeaders,
                    'X-TLE-Cache': 'last-good',
                },
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch TLE data' },
            { status: 502 }
        );
    }
}
