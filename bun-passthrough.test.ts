import { test } from "bun:test";
import { spawnSync } from "child_process";

test("passthrough to npm", () => {
  const result = spawnSync("npm", ["run", "--workspaces", "--if-present", "test"], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`npm test failed with status ${result.status}`);
  }
}, 300000);
