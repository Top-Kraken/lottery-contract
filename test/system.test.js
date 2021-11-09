const { expect, assert } = require("chai");
const { network, ethers } = require("hardhat");
const { 
    lotto,
    BigNumber,
    generateLottoNumbers
} = require("./settings.js");

describe("Lottery contract", function() {
    let mock_erc20Contract;
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the luchow token contract
    let luchowInstance;
    // Creating the instance and contract info for the timer contract
    let timerInstance, timerContract;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance, randGenContract;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem. 
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;
    
    // Creating the users
    let owner, buyer, operator, treasury, charity, injector;

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        owner = signers[0];
        buyer = signers[1];
        operator = signers[2];
        treasury = signers[3];
        charity = signers[4];
        injector = signers[5];

        // Getting the lottery code (abi, bytecode, name)
        lotteryContract = await ethers.getContractFactory("LunaChowLottery");
        // Getting the lotteryNFT code (abi, bytecode, name)
        mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
        // Getting the timer code (abi, bytecode, name)
        timerContract = await ethers.getContractFactory("Timer");
        // Getting the ChainLink contracts code (abi, bytecode, name)
        randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
        mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

        // Deploying the instances
        timerInstance = await timerContract.deploy();
        luchowInstance = await mock_erc20Contract.deploy(
            lotto.buy.luchow,
        );
        linkInstance = await mock_erc20Contract.deploy(
            lotto.buy.luchow,
        );
        mock_vrfCoordInstance = await mock_vrfCoordContract.deploy(
            linkInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        randGenInstance = await randGenContract.deploy(
            mock_vrfCoordInstance.address,
            linkInstance.address,
        );
        lotteryInstance = await lotteryContract.deploy(
            luchowInstance.address,
            randGenInstance.address,
        );
    
        // Final set up of contracts
        await randGenInstance.setLotteryAddress(
            lotteryInstance.address
        );
        await randGenInstance.setKeyHash(
            lotto.chainLink.keyHash
        );
        await randGenInstance.setFee(
            lotto.chainLink.fee
        );

        // Making sure the lottery has some luchow
        await luchowInstance.mint(
            lotteryInstance.address,
            lotto.newLotto.prize
        );
        // Sending link to lottery
        await linkInstance.transfer(
            randGenInstance.address,
            lotto.buy.luchow
        );

        await lotteryInstance.connect(owner).setOperatorAndTreasuryAndCharityAndInjectorAddresses(
            operator.address,
            treasury.address,
            charity.address,
            injector.address
        );
    });

    describe("Creating a new lottery tests", function() {
        /**
         * Tests that in the nominal case nothing goes wrong
         */
        it("Nominal case", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await lotteryInstance.connect(operator).startLottery(
                    timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                    lotto.newLotto.cost,
                    lotto.newLotto.discountDivisor,
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                );
        });
        /**
         * Testing that non-operator cannot start a lotto
         */
        it("Invalid operator", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await expect(
                lotteryInstance.connect(buyer).startLottery(
                    timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                    lotto.newLotto.cost,
                    lotto.newLotto.discountDivisor,
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_operator);
        });
        /**
         * Testing that an invalid rewards breakdown will fail
         */
        it("Invalid rewards breakdown total", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await expect(
                lotteryInstance.connect(operator).startLottery(
                    timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                    lotto.newLotto.cost,
                    lotto.newLotto.discountDivisor,
                    lotto.errorData.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_rewards_breakdown_total);
        })
    });
});
