export interface LyricLine {
    time: number;
    text: string;
}

export const parseLrc = (lrcString: string): LyricLine[] => {
    const lines = lrcString.split('\n');
    const lyrics: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = parseInt(match[3], 10) / (match[3].length === 2 ? 100 : 1000);
            
            const timeInSeconds = minutes * 60 + seconds + milliseconds;
            const text = line.replace(timeRegex, '').trim();
            
            // Bỏ qua dòng trống để đỡ giật
            if (text) {
                lyrics.push({ 
                    time: timeInSeconds, 
                    text 
                });
            }
        }
    });

    return lyrics;
};