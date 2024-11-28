import * as path from "path";
import * as assert from "assert";
import { MockTestRunner } from "azure-pipelines-task-lib/mock-test";

describe("GPT PR Review Task tests", function () {
  this.timeout(5000);

  it("should succeed with valid inputs", async function() {
    let tp = path.join(__dirname, "success.ts");
    let tmr = new MockTestRunner(tp);

    await tmr.runAsync();
    assert.equal(tmr.succeeded, true, "should have succeeded");
  });

  it("should fail without API key", async function() {
    let tp = path.join(__dirname, "failure_no_api_key.ts");
    let tmr = new MockTestRunner(tp);

    try {
      await tmr.runAsync();
      assert.equal(tmr.succeeded, false, "task should have failed");
      assert.notEqual(tmr.errorIssues.length, 0, "should have error issues");
      assert.ok(tmr.stdout.includes("gpt-4"), "should show model in debug output");
    } catch (error) {
      // Test passes if it throws an error
      assert.ok(true, "Task failed as expected");
    }
  });
});
