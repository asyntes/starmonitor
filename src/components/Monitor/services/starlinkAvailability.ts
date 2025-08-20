interface StarlinkAvailabilityData {
    admin0: Record<string, {
        status: string;
        expected?: string;
    }>;
    admin1?: Record<string, {
        status: string;
        expected?: string;
    }>;
}

export interface GeoFeature {
    properties?: Record<string, unknown>;
}

export type StarlinkStatus = 'available' | 'waiting_list' | 'coming_soon' | 'unavailable';

let availabilityData: StarlinkAvailabilityData | null = null;

const COUNTRY_NAME_TO_CODE_MAP: Record<string, string> = {
    'United States of America': 'US',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Russia': 'RU',
    'Russian Federation': 'RU',
    'China': 'CN',
    "People's Republic of China": 'CN',
    'Iran': 'IR',
    'Islamic Republic of Iran': 'IR',
    'North Korea': 'KP',
    "Democratic People's Republic of Korea": 'KP',
    'South Korea': 'KR',
    'Korea Republic of': 'KR',
    'Republic of Korea': 'KR',
    'Syria': 'SY',
    'Syrian Arab Republic': 'SY',
    'Myanmar': 'MM',
    'Burma': 'MM',
    'Venezuela': 'VE',
    'Bolivarian Republic of Venezuela': 'VE',
    'Bolivia': 'BO',
    'Plurinational State of Bolivia': 'BO',
    'Turkey': 'TR',
    'Türkiye': 'TR',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'UAE': 'AE',
    'South Africa': 'ZA',
    'Republic of South Africa': 'ZA',
    'Democratic Republic of the Congo': 'CD',
    'Republic of the Congo': 'CG',
    'Congo-Brazzaville': 'CG',
    'Central African Republic': 'CF',
    'République Centrafricaine': 'CF',
    'Côte d\'Ivoire': 'CI',
    'Ivory Coast': 'CI',
    'Republic of the Sudan': 'SD',
    'Sudan': 'SD',
    'French Guiana': 'GF',
    'New Caledonia': 'NC',
    'Nouvelle-Calédonie': 'NC',
    'French Polynesia': 'PF',
    'Polynésie Française': 'PF',
    'Western Sahara': 'EH',
    'Sahara Occidental': 'EH',
    'Bosnia and Herzegovina': 'BA',
    'Cape Verde': 'CV',
    'Cabo Verde': 'CV',
    'Republic of Moldova': 'MD',
    'Moldova': 'MD',
    'North Macedonia': 'MK',
    'Macedonia': 'MK',
    'Guinea Ecuatorial': 'GQ',
    'Equatorial Guinea': 'GQ',
    'Cameroun': 'CM',
    'Cameroon': 'CM',
    'Sénégal': 'SN',
    'Senegal': 'SN',
    'República de Cuba': 'CU',
    'Cuba': 'CU',
    'Taiwan': 'TW',
    'Afghanistan': 'AF',
    'Albania': 'AL',
    'Algeria': 'DZ',
    'Angola': 'AO',
    'Argentina': 'AR',
    'Armenia': 'AM',
    'Australia': 'AU',
    'Austria': 'AT',
    'Azerbaijan': 'AZ',
    'Belarus': 'BY',
    'Belgium': 'BE',
    'Benin': 'BJ',
    'Bhutan': 'BT',
    'Brazil': 'BR',
    'Bulgaria': 'BG',
    'Canada': 'CA',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Croatia': 'HR',
    'Czech Republic': 'CZ',
    'Czechia': 'CZ',
    'Denmark': 'DK',
    'Ecuador': 'EC',
    'Egypt': 'EG',
    'Estonia': 'EE',
    'Ethiopia': 'ET',
    'Finland': 'FI',
    'France': 'FR',
    'Germany': 'DE',
    'Ghana': 'GH',
    'Greece': 'GR',
    'Greenland': 'GL',
    'Hungary': 'HU',
    'Iceland': 'IS',
    'India': 'IN',
    'Indonesia': 'ID',
    'Iraq': 'IQ',
    'Ireland': 'IE',
    'Israel': 'IL',
    'Italy': 'IT',
    'Japan': 'JP',
    'Kazakhstan': 'KZ',
    'Kenya': 'KE',
    'Latvia': 'LV',
    'Libya': 'LY',
    'Lithuania': 'LT',
    'Luxembourg': 'LU',
    'Madagascar': 'MG',
    'Mali': 'ML',
    'Mexico': 'MX',
    'Mongolia': 'MN',
    'Morocco': 'MA',
    'Netherlands': 'NL',
    'New Zealand': 'NZ',
    'Niger': 'NE',
    'Nigeria': 'NG',
    'Norway': 'NO',
    'Pakistan': 'PK',
    'Peru': 'PE',
    'Philippines': 'PH',
    'Poland': 'PL',
    'Portugal': 'PT',
    'Romania': 'RO',
    'Serbia': 'RS',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'Somalia': 'SO',
    'Spain': 'ES',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Thailand': 'TH',
    'Tunisia': 'TN',
    'Ukraine': 'UA',
    'Uruguay': 'UY',
    'Vietnam': 'VN',
    'Zimbabwe': 'ZW'
};

export const fetchStarlinkAvailability = async (): Promise<void> => {
    const starlinkUrl = 'https://www.starlink.com/public-files/availability.json';

    let finalUrl: string;

    // In development: use CORS proxy
    // In production: use direct HTTPS URL (this code block gets removed in production build)
    if (import.meta.env.DEV) {
        finalUrl = `https://corsproxy.io/?${encodeURIComponent(starlinkUrl)}`;
    } else {
        finalUrl = starlinkUrl;
    }

    try {
        const response = await fetch(finalUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        availabilityData = await response.json();
    } catch (error) {
        console.error('Error fetching Starlink availability data:', error);
        availabilityData = null;
    }
};

const getCountryCode = (feature: GeoFeature): string | null => {
    if (!feature.properties) return null;

    // Special case for Kosovo: GeoJSON uses KO but Starlink API uses XK
    if (feature.properties.iso_a2 === 'KO' ||
        feature.properties.postal === 'KO' ||
        feature.properties.sovereignt === 'Kosovo' ||
        feature.properties.NAME === 'Kosovo') {
        return 'XK';
    }

    // Special case for Northern Cyprus: should map to Turkey (TR)
    if (feature.properties.NAME === 'N. Cyprus' ||
        feature.properties.name === 'N. Cyprus' ||
        feature.properties.NAME === 'Northern Cyprus') {
        return 'TR';
    }

    const isoFields = ['iso_a2', 'postal', 'ISO_A2', 'wb_a2'];
    for (const field of isoFields) {
        const value = feature.properties[field];
        if (value && typeof value === 'string' && value.length === 2 && value !== '-99' && value !== 'XX') {
            return value.toUpperCase();
        }
    }

    const possibleNames = [
        feature.properties.NAME,
        feature.properties.name,
        feature.properties.ADMIN,
        feature.properties.admin,
        feature.properties.NAME_EN,
        feature.properties.SOVEREIGNT,
        feature.properties.GEOUNIT,
        feature.properties.NAME_LONG
    ];

    for (const name of possibleNames) {
        if (name && typeof name === 'string' && COUNTRY_NAME_TO_CODE_MAP[name]) {
            return COUNTRY_NAME_TO_CODE_MAP[name];
        }
    }

    return null;
};

export const getStarlinkStatus = (feature: GeoFeature): StarlinkStatus => {
    if (!availabilityData || !availabilityData.admin0) {
        return 'unavailable';
    }

    const countryCode = getCountryCode(feature);
    if (!countryCode) {
        return 'unavailable';
    }

    const countryData = availabilityData.admin0[countryCode];
    if (!countryData) {
        return 'unavailable';
    }

    const status = countryData.status;

    if (status === 'launched' || status === 'available' || status === 'exclude') {
        return 'available';
    } else if (status === 'coming_soon') {
        return 'coming_soon';
    } else if (status === 'pending_regulatory' || status === 'faq' || status === 'unknown') {
        return 'waiting_list';
    }

    return 'unavailable';
};