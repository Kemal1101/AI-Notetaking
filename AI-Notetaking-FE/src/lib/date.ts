export function formatUpdatedAt(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const formattedTime = dateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `Last updated: ${formattedDate} at ${formattedTime}`;
}