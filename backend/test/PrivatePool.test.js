const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivatePool", function () {
  let pool, token, verifier, kybRegistry;
  let deployer, alice, relayer, outsider;

  const DUMMY_PROOF = "0x";
  const commitment1 = ethers.id("commitment1");
  const commitment2 = ethers.id("commitment2");
  const commitment3 = ethers.id("commitment3");
  const commitment4 = ethers.id("commitment4");
  const nullifier1 = ethers.id("nullifier1");
  const nullifier2 = ethers.id("nullifier2");
  const nullifier3 = ethers.id("nullifier3");
  const nullifier4 = ethers.id("nullifier4");
  const encryptedValue1 = ethers.id("encryptedValue1");
  const encryptedValue2 = ethers.id("encryptedValue2");

  beforeEach(async function () {
    [deployer, alice, relayer, outsider] = await ethers.getSigners();

    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    verifier = await MockVerifier.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();

    const MockKYBRegistry = await ethers.getContractFactory("MockKYBRegistry");
    kybRegistry = await MockKYBRegistry.deploy();

    const PrivatePool = await ethers.getContractFactory("PrivatePool");
    pool = await PrivatePool.deploy(
      await verifier.getAddress(),
      await token.getAddress(),
      await kybRegistry.getAddress()
    );

    // Approve alice and relayer for KYB
    await kybRegistry.approve(await alice.getAddress());
    await kybRegistry.approve(await relayer.getAddress());

    await token.mint(await alice.getAddress(), ethers.parseEther("1000"));
    await token.mint(await outsider.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("should set verifier and token", async function () {
      expect(await pool.verifier()).to.equal(await verifier.getAddress());
      expect(await pool.token()).to.equal(await token.getAddress());
    });

    it("should set KYB registry", async function () {
      expect(await pool.kybRegistry()).to.equal(await kybRegistry.getAddress());
    });

    it("should start with leaf index 0", async function () {
      expect(await pool.nextLeafIndex()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("should accept a deposit and emit event", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);

      await expect(pool.connect(alice).deposit(commitment1, amount))
        .to.emit(pool, "Deposit")
        .withArgs(commitment1, 0, amount);
    });

    it("should transfer tokens to the pool", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);

      expect(await token.balanceOf(await pool.getAddress())).to.equal(amount);
    });

    it("should increment leaf index", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);

      expect(await pool.nextLeafIndex()).to.equal(1);
    });

    it("should reject zero amount", async function () {
      await expect(
        pool.connect(alice).deposit(commitment1, 0)
      ).to.be.revertedWith("Zero amount");
    });
  });

  describe("Transact", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);
    });

    it("should accept a valid transaction (no fee)", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root,
        nullifier1,
        nullifier2,
        commitment2,
        commitment3,
        fee,
        relayerField,
        encryptedValue1,
        encryptedValue2,
      ];

      await expect(pool.connect(alice).transact(DUMMY_PROOF, publicInputs))
        .to.emit(pool, "Transact")
        .withArgs(nullifier1, nullifier2, commitment2, commitment3, encryptedValue1, encryptedValue2);
    });

    it("should mark nullifiers as spent", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await pool.connect(alice).transact(DUMMY_PROOF, publicInputs);

      expect(await pool.nullifierUsed(nullifier1)).to.be.true;
      expect(await pool.nullifierUsed(nullifier2)).to.be.true;
    });

    it("should reject double-spend (reused nullifier)", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await pool.connect(alice).transact(DUMMY_PROOF, publicInputs);

      const publicInputs2 = [
        await pool.getLastRoot(), nullifier1, nullifier3,
        commitment4, commitment2, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(alice).transact(DUMMY_PROOF, publicInputs2)
      ).to.be.revertedWith("Nullifier 1 spent");
    });

    it("should pay relayer fee", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.parseEther("5");
      const feePadded = ethers.zeroPadValue(ethers.toBeHex(fee), 32);
      const relayerAddr = await relayer.getAddress();
      const relayerField = ethers.zeroPadValue(relayerAddr, 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, feePadded, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      const balanceBefore = await token.balanceOf(relayerAddr);
      await pool.connect(relayer).transact(DUMMY_PROOF, publicInputs);
      const balanceAfter = await token.balanceOf(relayerAddr);

      expect(balanceAfter - balanceBefore).to.equal(fee);
    });

    it("should reject unknown merkle root", async function () {
      const fakeRoot = ethers.id("fake_root");
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        fakeRoot, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(alice).transact(DUMMY_PROOF, publicInputs)
      ).to.be.revertedWith("Unknown root");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);
    });

    it("should release tokens to recipient", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);
      const withdrawAmount = ethers.parseEther("50");

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      const recipient = await alice.getAddress();
      const balanceBefore = await token.balanceOf(recipient);

      await pool.connect(alice).withdraw(
        DUMMY_PROOF, publicInputs, recipient, withdrawAmount
      );

      const balanceAfter = await token.balanceOf(recipient);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
    });

    it("should pay relayer on withdraw", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.parseEther("2");
      const feePadded = ethers.zeroPadValue(ethers.toBeHex(fee), 32);
      const relayerAddr = await relayer.getAddress();
      const relayerField = ethers.zeroPadValue(relayerAddr, 32);
      const withdrawAmount = ethers.parseEther("48");

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, feePadded, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      const relayerBefore = await token.balanceOf(relayerAddr);

      await pool.connect(relayer).withdraw(
        DUMMY_PROOF, publicInputs, await alice.getAddress(), withdrawAmount
      );

      const relayerAfter = await token.balanceOf(relayerAddr);
      expect(relayerAfter - relayerBefore).to.equal(fee);
    });

    it("should reject zero withdraw", async function () {
      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(alice).withdraw(
          DUMMY_PROOF, publicInputs, await alice.getAddress(), 0
        )
      ).to.be.revertedWith("Zero withdraw");
    });
  });

  describe("KYB Gating", function () {
    it("should reject deposit from non-KYB address", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(outsider).approve(await pool.getAddress(), amount);

      await expect(
        pool.connect(outsider).deposit(commitment1, amount)
      ).to.be.revertedWith("Not KYB approved");
    });

    it("should reject transact from non-KYB address", async function () {
      // First deposit as alice (KYB-approved)
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);

      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(outsider).transact(DUMMY_PROOF, publicInputs)
      ).to.be.revertedWith("Not KYB approved");
    });

    it("should reject withdraw from non-KYB address", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);

      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(outsider).withdraw(
          DUMMY_PROOF, publicInputs, await outsider.getAddress(), ethers.parseEther("50")
        )
      ).to.be.revertedWith("Not KYB approved");
    });

    it("should reject withdraw to non-KYB recipient", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);
      await pool.connect(alice).deposit(commitment1, amount);

      const root = await pool.getLastRoot();
      const fee = ethers.zeroPadValue("0x00", 32);
      const relayerField = ethers.zeroPadValue("0x00", 32);

      const publicInputs = [
        root, nullifier1, nullifier2,
        commitment2, commitment3, fee, relayerField,
        encryptedValue1, encryptedValue2,
      ];

      await expect(
        pool.connect(alice).withdraw(
          DUMMY_PROOF, publicInputs, await outsider.getAddress(), ethers.parseEther("50")
        )
      ).to.be.revertedWith("Recipient not KYB approved");
    });

    it("should block a revoked address", async function () {
      // Alice is approved, revoke her
      await kybRegistry.revoke(await alice.getAddress());

      const amount = ethers.parseEther("100");
      await token.connect(alice).approve(await pool.getAddress(), amount);

      await expect(
        pool.connect(alice).deposit(commitment1, amount)
      ).to.be.revertedWith("Not KYB approved");
    });
  });
});
