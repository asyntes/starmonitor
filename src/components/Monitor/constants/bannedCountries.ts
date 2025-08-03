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
    'Venezuela', 'Bolivarian Republic of Venezuela'
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