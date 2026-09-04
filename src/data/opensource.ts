// every number here came off the github api on 2026-09-05.
// if a line has no pr behind it, it does not go in this file.

export type Pr = {
  repo: string;
  num: number;
  title: string;
  add: number;
  del: number;
  files: number;
  reviews: number;
  date: string;
  url: string;
  merged: boolean;
  // only written where i can point at the exact thing that was wrong
  note?: string;
};

export type Org = {
  org: string;
  repo: string;
  stars: number;
  what: string;
  prs: Pr[];
};

const pr = (
  repo: string, num: number, title: string,
  add: number, del: number, files: number, reviews: number,
  date: string, merged: boolean, note?: string
): Pr => ({
  repo, num, title, add, del, files, reviews, date, merged, note,
  url: `https://github.com/${repo}/pull/${num}`,
});

export const orgs: Org[] = [
  {
    org: "tinygrad",
    repo: "tinygrad/tinygrad",
    stars: 33549,
    what: "a deep learning framework that fits in about 5000 lines",
    prs: [
      pr("tinygrad/tinygrad", 15925, "gradient: add TRUNC backward", 4, 0, 2, 1, "2026-05-08", true,
        "trunc had no backward pass, so any graph that touched it lost the gradient silently. four lines."),
    ],
  },
  {
    org: "supermemory",
    repo: "supermemoryai/supermemory",
    stars: 29227,
    what: "memory api for llm apps",
    prs: [
      pr("supermemoryai/supermemory", 1164, "treat an empty profile as no memories, not a retrieval error", 90, 7, 3, 1, "2026-07-11", true,
        "a first time user with nothing stored got an error instead of an empty list."),
      pr("supermemoryai/supermemory", 1236, "cap the sdk below 3.5 so a fresh install imports", 2, 2, 1, 4, "2026-08-12", true,
        "i filed the issue first (#1235), then sent the pin."),
    ],
  },
  {
    org: "helix-db",
    repo: "HelixDB/helix-db",
    stars: 5889,
    what: "graph and vector database written in rust",
    prs: [
      pr("HelixDB/helix-db", 1075, "check the simd kernels against the scalar reference on rounding sensitive input", 112, 0, 2, 4, "2026-09-04", true,
        "the neon and scalar distance kernels disagree on 21% of vector pairs. the existing equivalence test fed them integers, where every intermediate is exactly representable, so it could not fail."),
      pr("HelixDB/helix-db", 1050, "assert the louvain local move never lowers modularity", 159, 0, 1, 3, "2026-09-02", true,
        "proved the old whole phase test could not fail. injected one bug, made the old test pass and the new per move test fail on it."),
      pr("HelixDB/helix-db", 1051, "only report a truncated cycle result when a cycle was left out", 52, 8, 1, 1, "2026-09-02", true),
      pr("HelixDB/helix-db", 1039, "name the missing container runtime in logs and status", 158, 2, 3, 6, "2026-08-31", true),
      pr("HelixDB/helix-db", 1038, "drop the system openssl dependency from the cli", 6, 115, 3, 1, "2026-08-27", true,
        "net minus 109 lines. the build stopped needing openssl on the machine at all."),
      pr("HelixDB/helix-db", 1036, "check the container runtime is available in stop and restart", 2, 0, 1, 2, "2026-08-26", true),
      pr("HelixDB/helix-db", 1037, "document the linux c toolchain and openssl build prerequisites", 9, 0, 1, 2, "2026-08-26", true),
      pr("HelixDB/helix-db", 947, "treat an existing volume as success in ensure_volume", 149, 2, 3, 2, "2026-08-10", true),
    ],
  },
  {
    org: "apache",
    repo: "apache/arrow-rs",
    stars: 3600,
    what: "the rust implementation of apache arrow",
    prs: [
      pr("apache/arrow-rs", 10981, "reject FixedSizeBinary concat widths that overflow i32", 21, 1, 1, 6, "2026-09-04", true,
        "concat multiplied the element width by the row count into an i32. a schema value the user controls could overflow it and panic. the guard i needed already existed eight lines up, on the sibling path."),
    ],
  },
  {
    org: "rux",
    repo: "rux-lang/Rux",
    stars: 496,
    what: "a systems language with a rust style compiler",
    prs: [
      pr("rux-lang/Rux", 72, "coerce constant integer expressions to sized int types, not just bare literals", 192, 0, 7, 2, "2026-06-08", true),
      pr("rux-lang/Rux", 71, "let hex, binary and octal literals take a type suffix like decimals do", 107, 39, 7, 1, "2026-06-02", true),
      pr("rux-lang/Rux", 58, "decode \\u{...} escapes in HIR string and char literals", 185, 0, 7, 0, "2026-05-30", true),
      pr("rux-lang/Rux", 62, "give a clear error for out of range int literals everywhere, not just let", 56, 28, 1, 1, "2026-05-30", true),
      pr("rux-lang/Rux", 34, "fix the integer ** operator, it crashed every program that used it", 180, 3, 8, 0, "2026-05-29", true),
    ],
  },
  {
    org: "ratel",
    repo: "ratel-ai/ratel",
    stars: 434,
    what: "an ai agent runtime",
    prs: [
      pr("ratel-ai/ratel", 162, "point contributors at main, not the removed revamp branch", 2, 3, 1, 2, "2026-09-03", true),
    ],
  },
  {
    org: "dodopayments",
    repo: "dodopayments/dodo-adapters",
    stars: 21,
    what: "payment adapters",
    prs: [
      pr("dodopayments/dodo-adapters", 90, "parse the send_email query param so the string 'false' is false", 49, 41, 6, 5, "2025-12-20", true),
    ],
  },
  {
    org: "dxlander",
    repo: "dxlander/dxlander",
    stars: 16,
    what: "zero config deployment platform",
    prs: [
      pr("dxlander/dxlander", 16, "add gitlab and bitbucket repository import", 1196, 486, 29, 13, "2025-10-30", true),
      pr("dxlander/dxlander", 30, "rebuild the setup wizard as a stepper onboarding flow", 945, 466, 17, 9, "2025-11-10", true),
      pr("dxlander/dxlander", 18, "add a playwright e2e suite with global auth setup", 444, 5, 13, 5, "2025-10-31", true),
      pr("dxlander/dxlander", 38, "replace the mock database stats with real data", 286, 86, 11, 5, "2025-11-01", true),
      pr("dxlander/dxlander", 13, "add postgresql support alongside sqlite", 196, 3, 5, 2, "2025-10-28", true),
      pr("dxlander/dxlander", 56, "use relative paths so renaming the folder stops breaking the app", 137, 25, 8, 6, "2026-02-01", true),
      pr("dxlander/dxlander", 32, "branding metadata, favicon and seo assets", 122, 8, 11, 1, "2025-10-31", true),
    ],
  },
];

// open, under review, not landed yet. shown as open, never counted as merged.
export const openPrs: Pr[] = [
  pr("LMCache/LMCache", 4904, "reject cache key tags that contain the serialization delimiters", 96, 1, 2, 1, "2026-09-03", false,
    "two different tag sets serialise to the same string. that string is the disk filename and the remote object key, so one entry silently reads back as the other."),
  pr("ai-dynamo/dynamo", 14329, "match header capture entries by prefix and add a denylist", 388, 37, 6, 3, "2026-09-04", false,
    "nvidia's inference runtime. rust."),
  pr("apache/arrow-rs", 10984, "add a fallible collect_bool", 52, 3, 1, 3, "2026-09-04", false),
  pr("HelixDB/helix-db", 1059, "make the runtime start hint match the runtime that was detected", 67, 6, 2, 2, "2026-09-02", false),
  pr("hydra-db/hydradb", 162, "check the optimizer returns the same rows whichever way it expands", 181, 0, 1, 2, "2026-09-01", false),
  pr("hydra-db/hydradb", 149, "compare the sparse kernels over randomised graphs", 174, 0, 1, 1, "2026-08-30", false),
  pr("hydra-db/hydradb", 147, "bound row results by a row cap rather than the vertex cap", 89, 3, 4, 2, "2026-08-30", false),
  pr("hydra-db/hydradb", 163, "keep synthetic bolt relationship ids out of the real id range", 59, 1, 1, 1, "2026-09-01", false),
  pr("hydra-db/hydradb", 146, "drop the window row from the sparse kernel capability table", 6, 3, 1, 1, "2026-08-30", false),
];

export type Issue = {
  repo: string; num: number; title: string; state: string; date: string; url: string; note?: string;
};

export const issues: Issue[] = [
  {
    repo: "apache/arrow-rs", num: 10983, state: "open", date: "2026-09-04",
    title: "substring silently wraps start and length to i32 on Utf8 but not on LargeUtf8",
    url: "https://github.com/apache/arrow-rs/issues/10983",
    note: "same call, same data, different answer depending on which offset width the array happens to use.",
  },
  {
    repo: "hydra-db/hydradb", num: 148, state: "open", date: "2026-08-30",
    title: "sparse kernels disagree on a zero hop start that has no edges",
    url: "https://github.com/hydra-db/hydradb/issues/148",
  },
  {
    repo: "hydra-db/hydradb", num: 136, state: "open", date: "2026-08-28",
    title: "`just ci` cannot pass on a clean checkout, fmt-check and clippy both fail on current stable",
    url: "https://github.com/hydra-db/hydradb/issues/136",
  },
  {
    repo: "supermemoryai/supermemory", num: 1235, state: "closed", date: "2026-07-11",
    title: "the openai sdk fails to import with the latest release",
    url: "https://github.com/supermemoryai/supermemory/issues/1235",
    note: "filed it, then sent the fix.",
  },
];

export const totals = {
  merged: orgs.reduce((n, o) => n + o.prs.length, 0),
  open: openPrs.length,
  opened: 62,
  orgsMerged: orgs.length,
  orgsTouched: 12,
  starsMerged: orgs.reduce((n, o) => n + o.stars, 0),
  issues: issues.length,
  since: "oct 2025",
};
