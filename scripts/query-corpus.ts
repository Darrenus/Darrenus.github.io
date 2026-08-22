import fs from "node:fs";
import path from "node:path";
import { Corpus, type Kind } from "../src/rag/corpus";

const ROOT = path.resolve(import.meta.dirname, "..");
const bundlePath = path.join(ROOT, "public", "corpus", "index.json");

if (!fs.existsSync(bundlePath)) {
  console.error("No corpus yet. Run `npm run corpus` first.");
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8")) as {
  chunks: Record<string, string>;
};
const corpus = Corpus.fromBundle(bundle);
const argv = process.argv.slice(2);
const selfTest = argv.includes("--self-test");
const kindIndex = argv.indexOf("--kind");
const kinds = kindIndex >= 0 ? ([argv[kindIndex + 1]] as Kind[]) : undefined;
const query = argv
  .filter(
    (arg, index) =>
      arg !== "--self-test" &&
      (kindIndex < 0 || (index !== kindIndex && index !== kindIndex + 1)),
  )
  .join(" ")
  .trim();

const tests = [
  { query: "贺融 NUS KAIST", hit: /^about-(about|education)#/ },
  { query: "Planner Executor SQL 安全", hit: /^about-experience#/ },
  { query: "codeloop Python SWE-bench 工具调用", hit: /^about-projects#/ },
  { query: "hanserong NUS 邮箱", hit: /^about-(contact|links)#/ },
  { query: "专利 正在审查", hit: /^about-achievements#/ },
];

if (selfTest) {
  let failed = 0;
  for (const test of tests) {
    const hits = corpus.search(test.query, { limit: 6 });
    const passed = hits.some((hit) => test.hit.test(hit.id));
    console.log(`${passed ? "ok  " : "FAIL"}  ${test.query}`);
    if (!passed) failed++;
  }

  const forbidden = Object.entries(bundle.chunks).filter(([, text]) =>
    /legacy-author|legacy-project|1[3-9][0-9]{9}/i.test(text),
  );
  if (forbidden.length) {
    console.log(`FAIL  forbidden private or legacy text in: ${forbidden.map(([id]) => id).join(", ")}`);
    failed++;
  } else {
    console.log("ok    no private project name, phone number, or legacy identity");
  }

  console.log(`\n${tests.length + 1 - failed}/${tests.length + 1} passed`);
  process.exit(failed ? 1 : 0);
}

if (!query) {
  console.log(corpus.outline());
  process.exit(0);
}

const hits = corpus.search(query, { kinds, limit: 6 });
for (const hit of hits) {
  console.log(`${hit.score.toFixed(1)}  ${hit.id}  ${hit.heading}`);
  console.log(`${hit.text.replace(/\s+/g, " ").slice(0, 180)}\n`);
}
