export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function TODAY(offset?: number): number {
    return toEpoch(new Date()) + (offset ?? 0);
}

export function toEpoch(date: Date | number): number {
    const ms = typeof date === 'number' ? date : date.getTime();
    return Math.floor(ms / MS_PER_DAY);
}

export function epochToDate(dayNumber: number): Date {
    return new Date(dayNumber * MS_PER_DAY);
}

export function toDateString(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}