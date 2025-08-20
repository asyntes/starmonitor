// List of banned and restricted countries updated weekly by hand after verification with Grok
export const STARLINK_BANNED_COUNTRIES = new Set([
    'China', 'People\'s Republic of China', 'PRC', '中国',
    'Russia', 'Russian Federation', 'Россия',
    'Iran', 'Islamic Republic of Iran', 'ایران',
    'North Korea', 'Democratic People\'s Republic of Korea', 'DPRK', '북한',
    'Belarus', 'Беларусь',
    'Syria', 'Syrian Arab Republic', 'سوريا',
    'Afghanistan', 'افغانستان',
    'Myanmar', 'Burma', 'မြန်မာ',
    'Cuba', 'República de Cuba',
    'Venezuela', 'Bolivarian Republic of Venezuela',
    'Niue',
    'Turkmenistan', 'Туркменистан',
    'Sudan', 'Republic of the Sudan', 'سودان',
    'South Africa', 'Republic of South Africa', 'Republiek van Suid-Afrika', 'Sudafrica',
    'Burkina Faso',
    'Cameroon', 'Cameroun',
    'Côte d\'Ivoire', 'Ivory Coast',
    'Mali',
    'Senegal', 'Sénégal',
    'Eritrea',
    'Libya', 'ليبيا',
    'Central African Republic', 'République Centrafricaine',
    'Taiwan',
]);

export const STARLINK_RESTRICTED_COUNTRIES = new Set([
    'Equatorial Guinea', 'Guinea Ecuatorial',
    'Comoros', 'جزر القمر',
    'Djibouti',
    'Ethiopia',
    'Gambia',
    'Guinea',
    'Seychelles',
    'Togo',
    'Uganda',
    'Pakistan', 'پاکستان',
    'Saudi Arabia', 'المملكة العربية السعودية',
    'United Arab Emirates', 'UAE', 'الإمارات العربية المتحدة',
    'Thailand', 'ประเทศไทย',
    'Egypt', 'مصر',
    'Algeria', 'الجزائر',
    'Tunisia', 'تونس',
    'Iraq', 'العراق',
    'Lebanon', 'لبنان',
    'Kuwait', 'الكويت',
    'Uzbekistan', 'Oʻzbekiston',
    'Tajikistan', 'Тоҷикистон',
    'Kyrgyzstan', 'Кыргызстан',
    'Bolivia', 'Plurinational State of Bolivia',
    'Nicaragua',
    'French Guiana',
    'Serbia',
    'Montenegro',
    'Bosnia and Herzegovina',
    'Greenland',
    'South Korea', 'Korea Republic of',
    'Nepal',
    'New Caledonia', 'Nouvelle-Calédonie',
    'French Polynesia', 'Polynésie Française',
    'Turkey', 'Türkiye',
    'Angola',
    'Cape Verde', 'Cabo Verde',
    'Gabon',
    'Republic of the Congo', 'Congo-Brazzaville',
    'Morocco', 'المغرب',
    'Western Sahara', 'Sahara Occidental',
]);

export const hasStarlinkBanned = (feature: any): boolean => {
    if (!feature.properties) return false;

    const possibleNames = [
        feature.properties.name,
        feature.properties.NAME,
        feature.properties.ADMIN,
        feature.properties.NAME_EN,
        feature.properties.SOVEREIGNT,
        feature.properties.GEOUNIT,
        feature.properties.NAME_LONG
    ].filter(Boolean);

    return possibleNames.some(name => STARLINK_BANNED_COUNTRIES.has(name));
};

export const hasStarlinkRestricted = (feature: any): boolean => {
    if (!feature.properties) return false;

    const possibleNames = [
        feature.properties.name,
        feature.properties.NAME,
        feature.properties.ADMIN,
        feature.properties.NAME_EN,
        feature.properties.SOVEREIGNT,
        feature.properties.GEOUNIT,
        feature.properties.NAME_LONG
    ].filter(Boolean);

    return possibleNames.some(name => STARLINK_RESTRICTED_COUNTRIES.has(name));
};