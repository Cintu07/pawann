// where every piece of art sits. these are the values that ship.
//
// to change them: open any page with ?tune=1, drag the art, scroll on it to
// resize, then hit "copy values" and paste the result over this object.
//
// the dragon is keyed per page ("dragon-work", "dragon-projects", ...) because
// each page's heading is a different width, so the spot that clears the title
// on one page collides with it on another. the panel only ever shows the keys
// present on the page you are looking at, so pasting a copied block cannot
// clobber another page's numbers.

export type ArtPos = {
  /** horizontal nudge in px. positive moves right. */
  x: number;
  /** vertical nudge in px. positive moves down. */
  y: number;
  /** rendered width in px. ignored by skyline, which is full bleed. */
  w: number;
  /** visible band height in px. the sprite gifs are mostly empty frame, so
   *  this clips them and the image is pinned to the bottom of the band. */
  h?: number;
};

export type ArtKey = string;

export const DEFAULT_POS: ArtPos = { x: 0, y: 0, w: 120 };

export const ART: Record<ArtKey, { mobile: ArtPos; desktop: ArtPos }> = {
  "dragon-work": {
    mobile: { x: -6, y: 19, w: 112 },
    desktop: { x: 0, y: 24, w: 112 },
  },
  "dragon-open-source": {
    mobile: { x: -42, y: -51, w: 112 },
    desktop: { x: 0, y: 24, w: 112 },
  },
  "dragon-projects": {
    mobile: { x: -14, y: -48, w: 112 },
    desktop: { x: 0, y: 24, w: 112 },
  },
  sprites: {
    mobile: { x: 0, y: 0, w: 260, h: 130 },
    desktop: { x: 0, y: 0, w: 300, h: 130 },
  },
  pagoda: {
    mobile: { x: 0, y: 0, w: 240 },
    desktop: { x: -2, y: 44, w: 240 },
  },
  skyline: {
    mobile: { x: 0, y: 0, w: 0, h: 120 },
    desktop: { x: 0, y: 0, w: 0, h: 150 },
  },
};
