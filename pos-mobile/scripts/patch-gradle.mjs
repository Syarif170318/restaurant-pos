import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const file = join(
  process.cwd(),
  "node_modules/@react-native/gradle-plugin/settings.gradle.kts",
);

if (!existsSync(file)) {
  console.log("patch-gradle: skip (gradle-plugin not found)");
  process.exit(0);
}

let content = readFileSync(file, "utf8");
const next = content.replace(
  /foojay-resolver-convention"\)\.version\("0\.5\.0"\)/g,
  'foojay-resolver-convention").version("1.0.0")',
);

if (next !== content) {
  writeFileSync(file, next);
  console.log("patch-gradle: foojay-resolver-convention -> 1.0.0");
} else {
  console.log("patch-gradle: already patched");
}
