export interface TLEData {
    name: string;
    tleLine1: string;
    tleLine2: string;
}

export const catalogNumber = (sat: TLEData): string | null => {
    const line1 = sat.tleLine1;
    const line2 = sat.tleLine2;
    if (line1.length < 7 || line2.length < 7) return null;
    const id = line1.slice(2, 7);
    if (id !== line2.slice(2, 7) || !/\d/.test(id)) return null;
    return id;
};

export const parseTLEText = (tleText: string): TLEData[] => {
    const lines = tleText.trim().split(/\r?\n/);
    const records: TLEData[] = [];

    for (let i = 0; i < lines.length; i += 3) {
        const name = lines[i]?.trim();
        const tleLine1 = lines[i + 1]?.trim();
        const tleLine2 = lines[i + 2]?.trim();
        if (!name || !tleLine1 || !tleLine2) continue;
        if (!tleLine1.startsWith('1 ') || !tleLine2.startsWith('2 ')) continue;

        const record = { name, tleLine1, tleLine2 };
        if (!catalogNumber(record)) continue;
        records.push(record);
    }

    return records;
};

export const mergeSupGpWithGpFallback = (supGp: TLEData[], gp: TLEData[]): TLEData[] => {
    const seen = new Set<string>();
    const selected: TLEData[] = [];

    const take = (records: TLEData[]) => {
        for (const sat of records) {
            const id = catalogNumber(sat);
            if (!id || seen.has(id)) continue;
            seen.add(id);
            selected.push(sat);
        }
    };

    take(supGp);
    take(gp);
    return selected;
};
