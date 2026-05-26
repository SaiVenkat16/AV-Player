export interface Cue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export function parseSRT(content: string): Cue[] {
  const clean = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = clean.split('\n\n');
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length >= 3) {
      const id = lines[0];
      const timeLine = lines[1];
      const text = lines.slice(2).join(' ');

      const match = timeLine.match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
      if (match) {
        const parseTime = (h: string, m: string, s: string, ms: string) => {
          return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000;
        };
        const startTime = parseTime(match[1], match[2], match[3], match[4]);
        const endTime = parseTime(match[5], match[6], match[7], match[8]);
        cues.push({ id, startTime, endTime, text });
      }
    }
  }
  return cues;
}
