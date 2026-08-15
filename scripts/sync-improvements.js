const fs = require("fs");
const path = require("path");

const root = process.cwd();

function firstTitle(content, fallback) {
  const line = content.split(/\r?\n/).find((l) => l.trim().startsWith("# "));
  return line ? line.replace(/^#\s+/, "").trim() : fallback;
}

function listMarkdownItems(folderName) {
  const folderPath = path.join(root, folderName);
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .filter((name) => !["README.md", "INDEX.md"].includes(name));

  return files
    .map((name) => {
      const filePath = path.join(folderPath, name);
      const content = fs.readFileSync(filePath, "utf8");
      const stats = fs.statSync(filePath);
      return {
        name,
        title: firstTitle(content, name.replace(/\.md$/i, "")),
        updatedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function writeIndex(folderName, heading, description) {
  const items = listMarkdownItems(folderName);
  const now = new Date().toISOString();

  const lines = [
    `# ${heading}`,
    "",
    description,
    "",
    `Last generated: ${now}`,
    "",
  ];

  if (items.length === 0) {
    lines.push("- No items yet.");
  } else {
    for (const item of items) {
      lines.push(
        `- [${item.name}](./${item.name}) - ${item.title} (updated ${item.updatedAt})`,
      );
    }
  }

  lines.push("");
  fs.writeFileSync(
    path.join(root, folderName, "INDEX.md"),
    lines.join("\n"),
    "utf8",
  );
}

writeIndex(
  "to-improve",
  "To Improve Index",
  "Backlog index for pending and in-progress work items.",
);
writeIndex("improved", "Improved Index", "Completed improvements log index.");

console.log(
  "Improvement indexes updated: to-improve/INDEX.md and improved/INDEX.md",
);
