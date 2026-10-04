// The preview is cut into sections, so typing in one of them re-renders that section and leaves the rest
// of a long post alone. A cut is only ever made where markdown cannot be changed by it: before a top level
// heading, or between two plain paragraphs once a section has grown long, and never inside a code fence.

export interface Section {
  text: string;
  /** how many fenced code blocks come before this section, so a block keeps its place in the whole post */
  fenceBase: number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^#{1,2}\s/;
const PROSE = /^[A-Za-z]/;
/** link definitions and footnotes reach across blocks, so a post that has any stays in one piece */
const CROSS_REFERENCES = /^\[[^\]]+\]:\s|^\[\^[^\]]+\]:/m;

export function splitSections(markdown: string, softLimit = 6000): Section[] {
  if (CROSS_REFERENCES.test(markdown)) return [{ text: markdown, fenceBase: 0 }];

  const sections: Section[] = [];
  let current: string[] = [];
  let chars = 0;
  let fences = 0;
  let startFences = 0;
  let open: string | null = null;
  let prevBlank = true;
  let prevEnds = false; // the last line with text ended a paragraph or a code fence

  const flush = () => {
    if (!current.length) return;
    sections.push({ text: current.join("\n"), fenceBase: startFences });
    startFences = fences;
    current = [];
    chars = 0;
  };

  for (const line of markdown.split("\n")) {
    const fence = FENCE.exec(line);

    if (open) {
      current.push(line);
      chars += line.length + 1;
      if (fence && fence[1][0] === open[0] && fence[1].length >= open.length && line.trim() === fence[1]) {
        open = null;
        prevEnds = true;
        prevBlank = false;
      }
      continue;
    }

    if (HEADING.test(line) && current.length) flush();
    else if (chars > softLimit && prevBlank && prevEnds && PROSE.test(line)) flush();

    current.push(line);
    chars += line.length + 1;
    if (fence) {
      open = fence[1];
      fences++;
    }
    if (line.trim()) {
      prevBlank = false;
      prevEnds = !fence && PROSE.test(line);
    } else prevBlank = true;
  }
  flush();
  return sections.length ? sections : [{ text: markdown, fenceBase: 0 }];
}
