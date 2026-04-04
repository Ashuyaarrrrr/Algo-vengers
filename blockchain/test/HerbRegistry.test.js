// test/HerbRegistry.test.js  (CommonJS)
// Run:  npx hardhat test

const { expect }        = require("chai");
const { ethers }        = require("hardhat");

describe("HerbRegistry", function () {
  let registry, owner, farmer, lab, manufacturer, other;

  const FARMER_ROLE       = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const LAB_ROLE          = ethers.keccak256(ethers.toUtf8Bytes("LAB_ROLE"));
  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));

  beforeEach(async function () {
    [owner, farmer, lab, manufacturer, other] = await ethers.getSigners();

    const HerbRegistry = await ethers.getContractFactory("HerbRegistry");
    registry = await HerbRegistry.deploy();
    await registry.waitForDeployment();

    // Grant roles
    await registry.grantRole(FARMER_ROLE,       farmer.address);
    await registry.grantRole(LAB_ROLE,          lab.address);
    await registry.grantRole(MANUFACTURER_ROLE, manufacturer.address);
  });

  // ─── Batch Registration ─────────────────────────────────────────────────────
  describe("Batch Registration", function () {
    it("should allow a farmer to register a herb batch", async function () {
      const tx = await registry.connect(farmer).registerBatch(
        "Ashwagandha", "Rajasthan", Math.floor(Date.now() / 1000), 5000, "ipfs://abc"
      );
      await tx.wait();

      expect(await registry.totalBatches()).to.equal(1);
      const batch = await registry.batches(1);
      expect(batch.herbName).to.equal("Ashwagandha");
      expect(batch.farmer).to.equal(farmer.address);
    });

    it("should reject non-farmers", async function () {
      await expect(
        registry.connect(other).registerBatch("Tulsi", "UP", 0, 100, "")
      ).to.be.reverted;
    });
  });

  // ─── Lab Reports ────────────────────────────────────────────────────────────
  describe("Lab Reports", function () {
    beforeEach(async function () {
      await registry.connect(farmer).registerBatch(
        "Brahmi", "Kerala", Math.floor(Date.now() / 1000), 2000, "ipfs://def"
      );
    });

    it("should allow lab to attach a passing report", async function () {
      await registry.connect(lab).attachLabReport(1, "ipfs://report1", true);
      const batch = await registry.batches(1);
      // status 2 = Approved
      expect(batch.status).to.equal(2);
    });

    it("should mark batch as Rejected on fail", async function () {
      await registry.connect(lab).attachLabReport(1, "ipfs://report2", false);
      const batch = await registry.batches(1);
      // status 3 = Rejected
      expect(batch.status).to.equal(3);
    });
  });

  // ─── Formulations ───────────────────────────────────────────────────────────
  describe("Formulations", function () {
    beforeEach(async function () {
      await registry.connect(farmer).registerBatch(
        "Neem", "Gujarat", Math.floor(Date.now() / 1000), 3000, "ipfs://neem"
      );
      await registry.connect(lab).attachLabReport(1, "ipfs://neem-report", true);
    });

    it("should allow manufacturer to create a formulation from approved batches", async function () {
      await registry.connect(manufacturer).createFormulation(
        "HerbChain Neem Capsules", [1], "ipfs://formula1"
      );
      expect(await registry.totalFormulations()).to.equal(1);
      const f = await registry.formulations(1);
      expect(f.productName).to.equal("HerbChain Neem Capsules");
    });

    it("should revert if ingredient batch is not approved", async function () {
      // register another batch (not lab-tested)
      await registry.connect(farmer).registerBatch(
        "Moringa", "TN", Math.floor(Date.now() / 1000), 1000, "ipfs://moringa"
      );
      await expect(
        registry.connect(manufacturer).createFormulation("BadProduct", [2], "ipfs://bad")
      ).to.be.reverted;
    });
  });
});
