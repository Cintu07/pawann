// which resumes the site offers. three, not nine: a personal site listing
// every variant reads like casting a wide net rather than knowing what you do.
// the other six stay for direct applications.
//
// to swap one out, change this array. drop the matching pdf in
// public/resumes/ under the same filename.
//
// PUBLISH WITHOUT THE PHONE NUMBER. comment out \showphone in the .tex before
// exporting these. an email can be filtered, a scraped phone number cannot.

export type ResumeOption = {
  /** what the button says */
  label: string;
  /** one line under it, so a reader knows which one they want */
  blurb: string;
  /** file in public/resumes/ */
  file: string;
};

export const RESUMES: ResumeOption[] = [
  {
    label: "systems, rust",
    blurb: "arrow-rs, helix-db, hydradb, Rux, nvidia dynamo",
    file: "/resumes/pawan-systems-rust.pdf",
  },
  {
    label: "ai + inference infra",
    blurb: "production voice agents, LMCache, tinygrad, ciot, strata",
    file: "/resumes/pawan-ai-inference.pdf",
  },
  {
    label: "backend + product",
    blurb: "dhanamcollections.com end to end, 12.4M invocations traced, 72% off hosting",
    file: "/resumes/pawan-backend-product.pdf",
  },
];
