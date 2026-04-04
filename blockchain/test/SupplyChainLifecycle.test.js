// test/SupplyChainLifecycle.test.js  (CommonJS)
// ══════════════════════════════════════════════════════════════════════════════
//  HerbChain — Full End-to-End Supply Chain Lifecycle Test
//  Tests the complete flow:
//    Collector (Farmer) → Processor → Lab → Manufacturer → Distributor → Retailer
//
//  Run:  npx hardhat test test/SupplyChainLifecycle.test.js
// ══════════════════════════════════════════════════════════════════════════════

"use strict";

const { expect }    = require("chai");
const { ethers }    = require("hardhat");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Pretty-print a section header */
function banner(title) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ✦  ${title}`);
  console.log(line);
}

/** Format bytes32 as short hex for display */
function short(bytes32) {
  const h = typeof bytes32 === "string" ? bytes32 : ethers.hexlify(bytes32);
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

/** Wait for a tx and return its receipt */
async function send(txPromise, label) {
  const tx      = await txPromise;
  const receipt = await tx.wait();
  console.log(`    ✅ ${label}  [tx: ${receipt.hash.slice(0, 12)}…]`);
  return receipt;
}

/** Parse a named event from a receipt */
function parseEvent(contract, receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === eventName) return parsed;
    } catch { /* skip unrelated logs */ }
  }
  return null;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("HerbChain — Full Supply Chain Lifecycle", function () {

  // Give plenty of time — blockchain calls can be slow in CI
  this.timeout(120_000);

  // Signers (each will get a specific supply chain role)
  let deployer, collector, processor, lab, manufacturer, distributor, retailer, consumer;

  // The single deployed contract (Provenance inherits everything)
  let provenance;

  // Role hashes fetched from contract
  let COLLECTOR_ROLE, PROCESSOR_ROLE, LAB_ROLE, MANUFACTURER_ROLE,
      DISTRIBUTOR_ROLE, RETAILER_ROLE;

  // State shared across tests
  let batchId;       // bytes32 returned by createBatch
  let formulationId; // bytes32 returned by recordFormulation

  // ── Deploy & Role Setup ────────────────────────────────────────────────────

  before(async function () {
    banner("SETUP — Deploying Provenance Contract & Granting Roles");

    [deployer, collector, processor, lab, manufacturer, distributor, retailer, consumer]
      = await ethers.getSigners();

    console.log("  Deployer    :", deployer.address);
    console.log("  Collector   :", collector.address);
    console.log("  Processor   :", processor.address);
    console.log("  Lab         :", lab.address);
    console.log("  Manufacturer:", manufacturer.address);
    console.log("  Distributor :", distributor.address);
    console.log("  Retailer    :", retailer.address);
    console.log("  Consumer    :", consumer.address);

    // Deploy
    const Provenance = await ethers.getContractFactory("Provenance");
    provenance = await Provenance.deploy();
    await provenance.waitForDeployment();
    console.log("\n  Contract deployed at:", await provenance.getAddress());

    // Fetch role hashes from the contract (authoritative source of truth)
    COLLECTOR_ROLE    = await provenance.COLLECTOR_ROLE();
    PROCESSOR_ROLE    = await provenance.PROCESSOR_ROLE();
    LAB_ROLE          = await provenance.LAB_ROLE();
    MANUFACTURER_ROLE = await provenance.MANUFACTURER_ROLE();
    DISTRIBUTOR_ROLE  = await provenance.DISTRIBUTOR_ROLE();
    RETAILER_ROLE     = await provenance.RETAILER_ROLE();

    // Grant roles via deployer (who holds DEFAULT_ADMIN_ROLE)
    const grants = [
      [COLLECTOR_ROLE,    collector.address,    "COLLECTOR_ROLE"],
      [PROCESSOR_ROLE,    processor.address,    "PROCESSOR_ROLE"],
      [LAB_ROLE,          lab.address,          "LAB_ROLE"],
      [MANUFACTURER_ROLE, manufacturer.address, "MANUFACTURER_ROLE"],
      [DISTRIBUTOR_ROLE,  distributor.address,  "DISTRIBUTOR_ROLE"],
      [RETAILER_ROLE,     retailer.address,     "RETAILER_ROLE"],
    ];

    for (const [role, acct, name] of grants) {
      await send(
        provenance.connect(deployer).grantSupplyChainRole(role, acct),
        `Granted ${name} to ${acct.slice(0, 8)}…`
      );
    }
  });

  // ── Step 1 : Collector creates an herb batch ───────────────────────────────

  describe("Step 1 — Collector creates a Herb Batch", function () {

    it("should reject batch creation by a non-collector", async function () {
      await expect(
        provenance.connect(consumer).createBatch(
          "Ashwagandha", "22.7196", "75.8577",
          Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          true,
          "Withania somnifera", 500, "kg",
          "Sunny", 28, "Fresh", ""
        )
      ).to.be.revertedWith("HerbBatch: caller is not a collector");
    });

    it("should reject a future harvest date", async function () {
      await expect(
        provenance.connect(collector).createBatch(
          "Ashwagandha", "22.7196", "75.8577",
          Math.floor(Date.now() / 1000) + 9999, // future
          true,
          "Withania somnifera", 500, "kg",
          "Sunny", 28, "Fresh", ""
        )
      ).to.be.revertedWith("HerbBatch: harvest date cannot be in the future");
    });

    it("should allow a collector to create a batch and emit BatchCreated", async function () {
      banner("STEP 1 — createBatch (Collector)");

      const harvestDate = Math.floor(Date.now() / 1000) - 3600;

      const receipt = await send(
        provenance.connect(collector).createBatch(
          "Ashwagandha",          // herbName
          "22.7196",              // geoLatitude
          "75.8577",              // geoLongitude
          harvestDate,            // harvestDate
          true,                   // isSustainable
          "Withania somnifera",   // herbSpecies
          500,                    // quantity (500 kg)
          "kg",                   // unit
          "Sunny / 45% humidity", // weather
          28,                     // temperature (°C)
          "Grade A — no visible damage", // initialQuality
          "ipfs://QmBatchDoc001"  // ipfsHash
        ),
        "createBatch()"
      );

      // Extract batchId from event
      const event = parseEvent(provenance, receipt, "BatchCreated");
      expect(event, "BatchCreated event not found").to.not.be.null;

      batchId = event.args.batchId;
      console.log(`    Batch ID: ${short(batchId)}`);

      // Validate event fields
      expect(event.args.herbName).to.equal("Ashwagandha");
      expect(event.args.collector).to.equal(collector.address);
      expect(event.args.isSustainable).to.be.true;

      // Validate CollectionRecorded event
      const collEvt = parseEvent(provenance, receipt, "CollectionRecorded");
      expect(collEvt).to.not.be.null;
      expect(collEvt.args.herbSpecies).to.equal("Withania somnifera");
    });

    it("should persist the batch data correctly", async function () {
      const batch = await provenance.getBatch(batchId);
      expect(batch.herbName).to.equal("Ashwagandha");
      expect(batch.collector).to.equal(collector.address);
      expect(batch.currentOwner).to.equal(collector.address);
      expect(batch.isSustainable).to.be.true;
      expect(batch.exists).to.be.true;
      console.log("    Batch on-chain ✓  currentOwner:", batch.currentOwner.slice(0, 8) + "…");
    });

    it("should increment totalBatches", async function () {
      const total = await provenance.totalBatches();
      expect(total).to.be.gte(1n);
    });
  });

  // ── Step 2 : Collector transfers to Processor ──────────────────────────────

  describe("Step 2 — Collector transfers batch to Processor (collectBatch)", function () {

    it("should reject transfer to an address without a role", async function () {
      await expect(
        provenance.connect(collector).transferOwnership(
          batchId, consumer.address,
          "Indore Sorting Facility", "No notes", ""
        )
      ).to.be.revertedWith("SupplyChain: recipient has no supply chain role");
    });

    it("should allow collector to transfer to processor and emit OwnershipTransferred", async function () {
      banner("STEP 2 — transferOwnership: Collector → Processor");

      const receipt = await send(
        provenance.connect(collector).transferOwnership(
          batchId,
          processor.address,
          "Indore Processing Facility",
          "Batch handed to processor for sorting and drying",
          "ipfs://QmTransfer001"
        ),
        "transferOwnership() Collector→Processor"
      );

      const event = parseEvent(provenance, receipt, "OwnershipTransferred");
      expect(event).to.not.be.null;
      expect(event.args.from).to.equal(collector.address);
      expect(event.args.to).to.equal(processor.address);
      console.log(`    Transfer: ${event.args.from.slice(0,8)}… → ${event.args.to.slice(0,8)}…`);
    });

    it("should update currentOwner to processor", async function () {
      const batch = await provenance.getBatch(batchId);
      expect(batch.currentOwner).to.equal(processor.address);
    });
  });

  // ── Step 3 : Processor adds processing steps ───────────────────────────────

  describe("Step 3 — Processor adds processing steps", function () {

    it("should reject processing by non-processor", async function () {
      await expect(
        provenance.connect(consumer).addProcessingStep(
          batchId, 0, "dry shed", "notes", 35, 40, "FAC-001", ""
        )
      ).to.be.revertedWith("Processing: caller is not a processor");
    });

    it("should add a Drying step", async function () {
      banner("STEP 3 — addProcessingStep (Processor)");

      const receipt = await send(
        provenance.connect(processor).addProcessingStep(
          batchId,
          0,             // ProcessType.DRYING
          "Dry shed — temp 38°C, 35% humidity",
          "Spread on drying racks for 48h",
          38,            // temperature
          35,            // humidity
          "FAC-INDORE-001",
          "ipfs://QmProcessDrying001"
        ),
        "addProcessingStep(DRYING)"
      );

      const event = parseEvent(provenance, receipt, "ProcessingStepAdded");
      expect(event).to.not.be.null;
      expect(event.args.processType).to.equal(0n); // DRYING = 0
    });

    it("should add a Grinding step", async function () {
      const receipt = await send(
        provenance.connect(processor).addProcessingStep(
          batchId,
          1,             // ProcessType.GRINDING
          "Cold room — 22°C, 55% humidity",
          "Coarse grind to 80-mesh particle size",
          22,
          55,
          "FAC-INDORE-001",
          "ipfs://QmProcessGrind001"
        ),
        "addProcessingStep(GRINDING)"
      );
      const event = parseEvent(provenance, receipt, "ProcessingStepAdded");
      expect(event.args.processType).to.equal(1n);
    });

    it("should verify 2 processing steps on-chain", async function () {
      const steps = await provenance.getProcessingSteps(batchId);
      expect(steps.length).to.equal(2);
      expect(steps[0].processType).to.equal(0n); // DRYING
      expect(steps[1].processType).to.equal(1n); // GRINDING
      console.log(`    Processing steps recorded: ${steps.length}`);
    });
  });

  // ── Step 4 : Processor transfers to Lab ───────────────────────────────────

  describe("Step 4 — Processor transfers batch to Lab", function () {

    it("should allow processor to transfer to lab", async function () {
      banner("STEP 4 — transferOwnership: Processor → Lab");

      const receipt = await send(
        provenance.connect(processor).transferOwnership(
          batchId,
          lab.address,
          "Chennai QA Lab",
          "Processed batch dispatched for quality testing",
          "ipfs://QmTransfer002"
        ),
        "transferOwnership() Processor→Lab"
      );

      const event = parseEvent(provenance, receipt, "OwnershipTransferred");
      expect(event.args.to).to.equal(lab.address);
    });

    it("should update currentOwner to lab", async function () {
      expect((await provenance.getBatch(batchId)).currentOwner).to.equal(lab.address);
    });
  });

  // ── Step 5 : Lab records quality test ─────────────────────────────────────

  describe("Step 5 — Lab records quality test (collectBatch logic)", function () {

    it("should reject quality test by non-lab", async function () {
      await expect(
        provenance.connect(consumer).recordQualityTest(
          batchId, 850, 2, true, true, "notes", ""
        )
      ).to.be.revertedWith("QualityTest: caller is not a certified lab");
    });

    it("should reject moisture content > 100%", async function () {
      await expect(
        provenance.connect(lab).recordQualityTest(
          batchId, 10001, 2, true, true, "notes", "" // 10001 > 10000
        )
      ).to.be.revertedWith("QualityTest: moisture cannot exceed 100.00%");
    });

    it("should allow lab to record a passing quality test", async function () {
      banner("STEP 5 — recordQualityTest (Lab)");

      const receipt = await send(
        provenance.connect(lab).recordQualityTest(
          batchId,
          850,    // moistureContent (8.50%)
          2,      // pesticideLevel (2 ppb)
          true,   // dnaAuthenticated
          true,   // passed
          "Grade A — all parameters within limits",
          "ipfs://QmLabReport001"
        ),
        "recordQualityTest(passed=true)"
      );

      const event = parseEvent(provenance, receipt, "QualityTestRecorded");
      expect(event).to.not.be.null;
      expect(event.args.passed).to.be.true;
      console.log(`    Lab verdict: ${event.args.passed ? "PASSED ✅" : "FAILED ❌"}`);
    });

    it("should confirm batch is approved via isBatchApproved()", async function () {
      const approved = await provenance.isBatchApproved(batchId);
      expect(approved).to.be.true;
    });
  });

  // ── Step 6 : Lab transfers to Manufacturer ────────────────────────────────

  describe("Step 6 — Lab transfers to Manufacturer", function () {

    it("should allow lab to transfer to manufacturer", async function () {
      banner("STEP 6 — transferOwnership: Lab → Manufacturer");

      const receipt = await send(
        provenance.connect(lab).transferOwnership(
          batchId,
          manufacturer.address,
          "Mumbai Manufacturing Plant",
          "QA-approved batch transferred for formulation",
          "ipfs://QmTransfer003"
        ),
        "transferOwnership() Lab→Manufacturer"
      );

      const event = parseEvent(provenance, receipt, "OwnershipTransferred");
      expect(event.args.to).to.equal(manufacturer.address);
    });
  });

  // ── Step 7 : Manufacturer creates formulation ──────────────────────────────

  describe("Step 7 — Manufacturer creates Formulation (createFormulation)", function () {

    it("should reject formulation by non-manufacturer", async function () {
      await expect(
        provenance.connect(consumer).recordFormulation(
          "Test Capsule", "500mg", ["Ashwagandha"], [100], ""
        )
      ).to.be.revertedWith("Formulation: caller is not a manufacturer");
    });

    it("should reject formulation if percentages don't sum to 100", async function () {
      await expect(
        provenance.connect(manufacturer).recordFormulation(
          "Herb Mix", "500mg",
          ["Ashwagandha", "Brahmi"],
          [60, 30], // sums to 90, not 100
          ""
        )
      ).to.be.revertedWith("Formulation: total percentage must be 100");
    });

    it("should allow manufacturer to record a formulation", async function () {
      banner("STEP 7 — recordFormulation (Manufacturer)");

      const receipt = await send(
        provenance.connect(manufacturer).recordFormulation(
          "HerbChain Ashwagandha Gold Capsule", // productName
          "500mg — 2 capsules twice daily",      // dosage
          ["Ashwagandha Root", "Black Pepper Extract"], // herbNames
          [95, 5],                               // percentages (must sum to 100)
          "ipfs://QmFormula001"
        ),
        "recordFormulation()"
      );

      const event = parseEvent(provenance, receipt, "FormulationCreated");
      expect(event).to.not.be.null;
      formulationId = event.args.formulationId;
      console.log(`    Formulation ID: ${short(formulationId)}`);
      expect(event.args.manufacturer).to.equal(manufacturer.address);
    });

    it("should persist formulation data on-chain", async function () {
      const f = await provenance.getFormulation(formulationId);
      expect(f.productName).to.equal("HerbChain Ashwagandha Gold Capsule");
      expect(f.manufacturer).to.equal(manufacturer.address);
    });
  });

  // ── Step 8 : Manufacturer ships to Distributor (shipProduct) ──────────────

  describe("Step 8 — Manufacturer ships to Distributor (shipProduct)", function () {

    it("should allow manufacturer to transfer to distributor", async function () {
      banner("STEP 8 — transferOwnership: Manufacturer → Distributor");

      const receipt = await send(
        provenance.connect(manufacturer).transferOwnership(
          batchId,
          distributor.address,
          "Delhi Distribution Hub",
          "Finished product dispatched with BoL #DL2024-001",
          "ipfs://QmShipment001"
        ),
        "transferOwnership() Manufacturer→Distributor"
      );

      const event = parseEvent(provenance, receipt, "OwnershipTransferred");
      expect(event.args.to).to.equal(distributor.address);
      console.log(`    Shipped from: ${event.args.from.slice(0,8)}… to: ${event.args.to.slice(0,8)}…`);
    });

    it("should update currentOwner to distributor", async function () {
      expect((await provenance.getBatch(batchId)).currentOwner).to.equal(distributor.address);
    });
  });

  // ── Step 9 : Distributor sends to Retailer (receiveProduct) ───────────────

  describe("Step 9 — Distributor ships to Retailer (receiveProduct)", function () {

    it("should allow distributor to transfer to retailer", async function () {
      banner("STEP 9 — transferOwnership: Distributor → Retailer");

      const receipt = await send(
        provenance.connect(distributor).transferOwnership(
          batchId,
          retailer.address,
          "Pune Retail Store #42",
          "Last-mile delivery completed",
          "ipfs://QmDelivery001"
        ),
        "transferOwnership() Distributor→Retailer"
      );

      const event = parseEvent(provenance, receipt, "OwnershipTransferred");
      expect(event.args.to).to.equal(retailer.address);
    });

    it("should update currentOwner to retailer", async function () {
      expect((await provenance.getBatch(batchId)).currentOwner).to.equal(retailer.address);
    });
  });

  // ── Step 10 : Full Provenance Verification ─────────────────────────────────

  describe("Step 10 — Consumer reads full provenance (viewBatchProvenance)", function () {

    it("should return complete provenance with all steps", async function () {
      banner("STEP 10 — viewBatchProvenance (Consumer / Public)");

      // viewBatchProvenance is a view call — anyone can call it (no role needed)
      const prov = await provenance.viewBatchProvenance(batchId);

      console.log("    BatchId         :", short(prov.batchId));
      console.log("    Herb            :", prov.herbName);
      console.log("    Collector       :", prov.collector.slice(0, 8) + "…");
      console.log("    Current Owner   :", prov.currentOwner.slice(0, 8) + "…");
      console.log("    Sustainable     :", prov.isSustainable);
      console.log("    QA Passed       :", prov.hasPassedLatestQualityTest);
      console.log("    Processing Steps:", prov.processingSteps.length.toString());
      console.log("    Quality Tests   :", prov.qualityTests.length.toString());
      console.log("    Transfers       :", prov.transfers.length.toString());

      // Assertions
      expect(prov.herbName).to.equal("Ashwagandha");
      expect(prov.collector).to.equal(collector.address);
      expect(prov.currentOwner).to.equal(retailer.address); // final owner
      expect(prov.hasPassedLatestQualityTest).to.be.true;
      expect(prov.processingSteps.length).to.equal(2);
      expect(prov.qualityTests.length).to.equal(1);

      // We expect 5 transfers:
      // Collector→Processor, Processor→Lab, Lab→Mfr, Mfr→Distrib, Distrib→Retailer
      expect(prov.transfers.length).to.equal(5);
      expect(prov.transfers[0].from).to.equal(collector.address);
      expect(prov.transfers[4].to).to.equal(retailer.address);
    });

    it("should return a correct batch summary", async function () {
      const [herbName, col, , isSust, qualOk, procCount, txCount]
        = await provenance.getBatchSummary(batchId);

      expect(herbName).to.equal("Ashwagandha");
      expect(col).to.equal(collector.address);
      expect(isSust).to.be.true;
      expect(qualOk).to.be.true;
      expect(procCount).to.equal(2n);
      expect(txCount).to.equal(5n);
      console.log(`    Summary: herb=${herbName}, processing=${procCount}, transfers=${txCount}`);
    });
  });

  // ── Step 11 : Transfer History ─────────────────────────────────────────────

  describe("Step 11 — Full transfer history verification", function () {

    it("should have exactly 5 transfer records in the correct order", async function () {
      banner("STEP 11 — getTransferHistory");

      const history = await provenance.getTransferHistory(batchId);
      expect(history.length).to.equal(5);

      const expected = [
        { from: collector.address,    to: processor.address,    idx: 0n },
        { from: processor.address,    to: lab.address,          idx: 1n },
        { from: lab.address,          to: manufacturer.address, idx: 2n },
        { from: manufacturer.address, to: distributor.address,  idx: 3n },
        { from: distributor.address,  to: retailer.address,     idx: 4n },
      ];

      for (const [i, exp] of expected.entries()) {
        expect(history[i].from).to.equal(exp.from,  `Transfer[${i}].from mismatch`);
        expect(history[i].to).to.equal(exp.to,      `Transfer[${i}].to mismatch`);
        expect(history[i].transferIndex).to.equal(exp.idx);
        console.log(
          `    [${i}] ${history[i].from.slice(0,8)}… → ${history[i].to.slice(0,8)}…  @${history[i].location}`
        );
      }
    });
  });

  // ── Step 12 : Edge Cases ───────────────────────────────────────────────────

  describe("Step 12 — Edge cases & security checks", function () {

    it("retailer cannot transfer to themselves", async function () {
      await expect(
        provenance.connect(retailer).transferOwnership(
          batchId, retailer.address, "Same store", "self-transfer", ""
        )
      ).to.be.revertedWith("SupplyChain: cannot transfer to yourself");
    });

    it("old owner (distributor) cannot transfer after giving up ownership", async function () {
      await expect(
        provenance.connect(distributor).transferOwnership(
          batchId, consumer.address, "Fake", "replay attack", ""
        )
      ).to.be.revertedWith("SupplyChain: caller is not the current batch owner");
    });

    it("should revert getBatch for non-existent batchId", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      await expect(provenance.getBatch(fakeId))
        .to.be.revertedWith("HerbBatch: batch does not exist");
    });

    it("should revert isBatchApproved for batch with no tests", async function () {
      // Create a fresh batch with no lab tests
      const harvestDate = Math.floor(Date.now() / 1000) - 100;
      const receipt = await send(
        provenance.connect(collector).createBatch(
          "Brahmi", "9.9312", "76.2673",
          harvestDate, false,
          "Bacopa monnieri", 100, "kg",
          "Cloudy", 25, "Fresh", ""
        ),
        "createBatch(Brahmi) — no tests"
      );
      const ev = parseEvent(provenance, receipt, "BatchCreated");
      const freshId = ev.args.batchId;

      await expect(provenance.isBatchApproved(freshId))
        .to.be.revertedWith("QualityTest: no tests recorded for this batch");
    });
  });

  // ── Final Summary ─────────────────────────────────────────────────────────

  after(async function () {
    banner("FINAL SUMMARY");
    const total       = await provenance.totalBatches();
    const formulCount = await provenance.getAllFormulationIds();
    const history     = await provenance.getTransferHistory(batchId);

    console.log("  Total Batches     :", total.toString());
    console.log("  Total Formulations:", formulCount.length.toString());
    console.log("  Transfer Steps    :", history.length.toString());
    console.log("  Main Batch ID     :", short(batchId));
    console.log("  Formulation ID    :", short(formulationId));
    console.log("\n  🌿  Full lifecycle from Collector → Retailer verified on-chain! ✅\n");
  });
});
