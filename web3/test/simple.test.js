const { expect } = require("chai");

describe("Simple Test", function() {
  it("should pass a basic test", async function() {
    console.log("Running simple test...");
    expect(1 + 1).to.equal(2);
  });
});
