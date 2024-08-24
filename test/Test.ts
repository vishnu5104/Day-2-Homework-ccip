const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainNameService Test", function () {
  let CCIPLocalSimulator;
  let CrossChainNameServiceRegister;
  let CrossChainNameServiceReceiver;
  let CrossChainNameServiceLookup;

  let ccipLocalSimulator;
  let ccnsRegister;
  let ccnsReceiver;
  let ccnsLookupSource;
  let ccnsLookupReceiver;

  let routerAddress;

  before(async function () {
    CCIPLocalSimulator = await ethers.getContractFactory("CCIPLocalSimulator");
    ccipLocalSimulator = await CCIPLocalSimulator.deploy();
    await ccipLocalSimulator.deployed();

    const config = await ccipLocalSimulator.configuration();
    routerAddress = config.sourceRouter;

    CrossChainNameServiceRegister = await ethers.getContractFactory(
      "CrossChainNameServiceRegister"
    );
    CrossChainNameServiceReceiver = await ethers.getContractFactory(
      "CrossChainNameServiceReceiver"
    );
    CrossChainNameServiceLookup = await ethers.getContractFactory(
      "CrossChainNameServiceLookup"
    );

    ccnsRegister = await CrossChainNameServiceRegister.deploy(
      routerAddress,
      ethers.constants.AddressZero
    );
    await ccnsRegister.deployed();

    ccnsReceiver = await CrossChainNameServiceReceiver.deploy(
      routerAddress,
      ethers.constants.AddressZero
    );
    await ccnsReceiver.deployed();

    ccnsLookupSource = await CrossChainNameServiceLookup.deploy();
    await ccnsLookupSource.deployed();

    ccnsLookupReceiver = await CrossChainNameServiceLookup.deploy();
    await ccnsLookupReceiver.deployed();
  });

  it("Should configure and register 'alice.ccns'", async function () {
    const [owner] = await ethers.getSigners();
    const aliceEOA = owner.address;

    await ccnsRegister.enableChain(1, ccnsReceiver.address, 200000);
    await ccnsReceiver.enableChain(1, ccnsRegister.address, 200000);

    await ccnsLookupSource.setCrossChainNameServiceAddress(
      ccnsRegister.address,
      ccnsReceiver.address
    );
    await ccnsLookupReceiver.setCrossChainNameServiceAddress(
      ccnsRegister.address,
      ccnsReceiver.address
    );

    await ccnsRegister.register("alice.ccns", aliceEOA);

    const returnedAddress = await ccnsLookupSource.lookup("alice.ccns");

    expect(returnedAddress).to.equal(aliceEOA);
  });
});
