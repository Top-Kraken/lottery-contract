const { expect, assert } = require("chai");
const { network, ethers } = require("hardhat");
const { 
    lotto,
    BigNumber,
    generateLottoNumbers,
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
        /**
         * Testing that an invalid cost 
         */
        it("Invalid cost", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await expect(
                lotteryInstance.connect(operator).startLottery(
                    timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                    lotto.errorData.cost,
                    lotto.newLotto.discountDivisor,
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_cost);
        })
        /**
         * Testing that an invalid timestamp 
         */
        it("Invalid timestamp", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await expect(
                lotteryInstance.connect(operator).startLottery(
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    lotto.newLotto.cost,
                    lotto.newLotto.discountDivisor,
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
        })
        /**
         * Testing that an invalid discount divisor 
         */
        it("Invalid discount divisor", async function() {
            // Getting the current block timestamp
            let currentTime = await timerInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());

            // Starting a new lottery
            await expect(
                lotteryInstance.connect(operator).startLottery(
                    timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                    lotto.newLotto.cost,
                    lotto.errorData.discountDivisor,
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_divisor);
        })
        /**
         * Testing that an invalid charity fee
         */
        it("Invalid charity fee", async function() {
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
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.newLotto.treasuryFee,
                    lotto.errorData.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_charity);
        })
        /**
         * Testing that an invalid treasury fee
         */
        it("Invalid treasury fee", async function() {
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
                    lotto.newLotto.rewardsBreakdown,
                    lotto.newLotto.burnFee,
                    lotto.errorData.treasuryFee,
                    lotto.newLotto.charityFee,
                )
            ).to.be.revertedWith(lotto.errors.invalid_treasury);
        })
    });

    describe("Buying tickets tests", function() {
        /**
         * Creating a lottery for all buying tests to use. Will be a new instance
         * for each lottery
         */
        beforeEach( async() => {
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
        })
        /**
         * Tests the batch buying of one ticket
         */
        it("Batch buying 1 tickets", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tickets
            await lotteryInstance.buyTickets(
                lotteryId,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.one.cost,
                "Incorrect cost for batch buy of 1"
            );
        })
        /**
         * Tests the batch buying of ten token
         */
        it("Batch buying 10 tickets", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                10
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tickets
            await lotteryInstance.buyTickets(
                lotteryId,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
        })
        /**
         * Tests the batch buying with invalid ticket numbers
         */
        it("Invalid chosen numbers", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );

            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tickets
            await expect(
                    lotteryInstance.buyTickets(
                    lotteryId,
                    lotto.errorData.ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_ticket_number)
        })
        /**
         * Tests the batch buying with invalid buying ticket numbers count
         */
        it("Invalid buying ticket numbers count", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                105
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 105,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tickets
            await expect(
                    lotteryInstance.buyTickets(
                    lotteryId,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_ticket_numbers_count)
        })
        /**
         * Tests the batch buying with invalid buying lottery id
         */
        it("Invalid buying lottery id", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tickets
            await expect(
                    lotteryInstance.buyTickets(
                    lotteryId + 1,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_lottery)
        })
        /**
         * Tests the batch buying with invalid buying time
         */
        it("Invalid buying time", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lottery to spend cost
            await luchowInstance.approve(
                lotteryInstance.address,
                price
            );
            
            await ethers.provider.send("evm_increaseTime", [36000]);
            await ethers.provider.send("evm_mine", []);

            // Batch buying tickets
            await expect(
                    lotteryInstance.buyTickets(
                    lotteryId,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_buying_time)
        })
        /**
         * Tests the batch buying with invalid approve
         */
        it("Invalid luchow transfer", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tickets
            await expect(
                    lotteryInstance.buyTickets(
                    lotteryId,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_approve)
        })
    })
});
