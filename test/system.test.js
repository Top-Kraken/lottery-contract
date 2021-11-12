const { expect, assert } = require("chai");
const { network, ethers } = require("hardhat");
const { 
    lotto,
    BigNumber,
    generateLottoNumbers,
    getMatchBrackets,
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

    describe("Drawing numbers tests", function() {
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
         * Testing that the winning numbers can be set in the nominal case
         */
        it("Setting winning numbers", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );

            const winningNumber = await randGenInstance.viewRandomResult();
            
            //Testing
            assert.equal(
                winningNumber,
                lotto.newLotto.win.winningNumber,
                "Winning numbers incorrect"
            );
        })
        /**
         * Testing that numbers cannot be closed once closed
         */
        it("Invalid close lottery (already closed)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )

            await expect(
                lotteryInstance.connect(operator).closeLottery(
                    lotteryId
                )
            ).to.be.revertedWith(lotto.errors.invalid_close_repeat);
        })
        /**
         * Testing that numbers cannot be closed while lottery still in
         */
        it("Invalid close lottery (time)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await expect(
                lotteryInstance.connect(operator).closeLottery(
                    lotteryId
                )
            ).to.be.revertedWith(lotto.errors.invalid_close_time);
        })
        /**
         * Testing that cannot draw before closed
         */
        it("Invalid draw (not closed)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await expect(
                lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                    lotteryId,
                    false
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_not_closed);
        })
    })

    describe("Claiming tickets tests", function() {
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

            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                50
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50,
                lottoSize: lotto.setup.sizeOfLottery,
            });

            //Sending the buyer the needed amount of luchow
            await luchowInstance.connect(buyer).mint(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    ticketNumbers
            );
        });
        /**
         * Testing that claiming numbers (6 match) changes the users balance
         * correctly.
         */
        it("Claiming winning numbers (6 (all) match)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();

            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );
            // Sending the buyer the needed amount of luchow
            await luchowInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    [lotto.newLotto.win.winningNumber]
            );
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );
            let buyerLuchowBalanceBefore = await luchowInstance.balanceOf(buyer.address);

            await lotteryInstance.connect(buyer).claimTickets(
                lotteryId,
                [50],
                [5]
            );
            let buyerLuchowBalanceAfter = await luchowInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerLuchowBalanceBefore.toString(),
                0,
                "Buyer has luchow balance before claiming"
            );
            assert.equal(
                buyerLuchowBalanceAfter.toString(),
                lotto.newLotto.win.match_all.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (5 match) changes the users balance
         * correctly.
         */
        it("Claiming winning numbers (5 match)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();

            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );
            // Sending the buyer the needed amount of luchow
            await luchowInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    [lotto.newLotto.win.winningNumber_five]
            );
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );
            let buyerLuchowBalanceBefore = await luchowInstance.balanceOf(buyer.address);

            await lotteryInstance.connect(buyer).claimTickets(
                lotteryId,
                [50],
                [4]
            );
            let buyerLuchowBalanceAfter = await luchowInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerLuchowBalanceBefore.toString(),
                0,
                "Buyer has luchow balance before claiming"
            );
            assert.equal(
                buyerLuchowBalanceAfter.toString(),
                lotto.newLotto.win.match_five.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (4 match) changes the users balance
         * correctly.
         */
        it("Claiming winning numbers (4 match)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();

            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );
            // Sending the buyer the needed amount of luchow
            await luchowInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    [lotto.newLotto.win.winningNumber_four]
            );
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );
            let buyerLuchowBalanceBefore = await luchowInstance.balanceOf(buyer.address);

            await lotteryInstance.connect(buyer).claimTickets(
                lotteryId,
                [50],
                [3]
            );
            let buyerLuchowBalanceAfter = await luchowInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerLuchowBalanceBefore.toString(),
                0,
                "Buyer has luchow balance before claiming"
            );
            assert.equal(
                buyerLuchowBalanceAfter.toString(),
                lotto.newLotto.win.match_four.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (0 match) changes the users balance
         * correctly.
         */
        it("Claiming winning numbers (0 (none) match)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();

            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );
            // Sending the buyer the needed amount of luchow
            await luchowInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    [lotto.newLotto.win.winningNumber_none]
            );
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );
            let buyerLuchowBalanceBefore = await luchowInstance.balanceOf(buyer.address);

            await expect(lotteryInstance.connect(buyer).claimTickets(
                lotteryId,
                [50],
                [4]
            )).to.be.revertedWith(lotto.errors.invalid_prize);

            let buyerLuchowBalanceAfter = await luchowInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerLuchowBalanceBefore.toString(),
                0,
                "Buyer has luchow balance before claiming"
            );
            assert.equal(
                buyerLuchowBalanceAfter.toString(),
                0,
                "User won incorrect amount"
            );
        });
        /**
         * Testing that only the owner of a token can claim winnings
         */
        it("Invalid claim (not owner)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);

            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );

            await expect(
                    lotteryInstance.connect(owner).claimTickets(
                    lotteryId,
                    [25],
                    [5]
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_owner);
        });
    });
    
    describe("Batch claiming tickets tests", function() {
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

            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the price to buy
            let price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                49
            );

            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 49,
                lottoSize: lotto.setup.sizeOfLottery,
            });

            //Sending the buyer the needed amount of luchow
            await luchowInstance.connect(buyer).mint(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            
            // Batch buying tickets
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    ticketNumbers
            );
            price = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                1
            );
            // Sending the buyer the needed amount of luchow
            await luchowInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lottery to spend cost
            await luchowInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            await lotteryInstance.connect(buyer).buyTickets(
                    lotteryId,
                    [lotto.newLotto.win.winningNumber]
            );
            // Setting the time forward
            await ethers.provider.send("evm_increaseTime", [lotto.newLotto.endIncrease]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Batch claiming winning numbers (multiple match)", async function() {
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting all users bought tickets
            let userTicketInfo = await lotteryInstance.viewUserInfoForLotteryId(
                buyer.address,
                lotteryId,
                0,
                50
            );
            let userTicketIds = userTicketInfo[0];
            let userTicketNumbers = userTicketInfo[1];
            let bucketInfo = getMatchBrackets(
                userTicketIds,
                userTicketNumbers,
                lotto.newLotto.win.winningNumber
            );
            // Close Lottery
            await(await lotteryInstance.connect(operator).closeLottery(
                    lotteryId
            )).wait();

            const requestId = await randGenInstance.latestRequestId();
            
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );

            await lotteryInstance.connect(operator).drawFinalNumberAndMakeLotteryClaimable(
                lotteryId,
                false
            );
            let buyerLuchowBalanceBefore = await luchowInstance.balanceOf(buyer.address);

            await lotteryInstance.connect(buyer).claimTickets(
                lotteryId,
                bucketInfo.ticketIds,
                bucketInfo.ticketBuckets
            );
            let buyerLuchowBalanceAfter = await luchowInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerLuchowBalanceBefore.toString(),
                0,
                "Buyer has luchow balance before claiming"
            );
            assert.notEqual(
                buyerLuchowBalanceAfter.toString(),
                buyerLuchowBalanceBefore.toString(),
                "User balance has not changed"
            );
            assert.notEqual(
                buyerLuchowBalanceAfter.toString(),
                lotto.newLotto.win.match_all.toString(),
                "User won incorrect amount"
            );
        })
    });

    describe("Upgrade functionality tests", function() {
        /**
         * Tests that an admin can update the min and max ticket price in luchow
         */
        it("Update min and max ticket price in luchow", async function() {
            // Getting the min and max ticket price in luchow
            let minPriceTicketInLuchowBefore = await lotteryInstance.minPriceTicketInLuchow();
            let maxPriceTicketInLuchowBefore = await lotteryInstance.maxPriceTicketInLuchow();
            // Updating the min and max ticket price in luchow
            await lotteryInstance.setMinAndMaxTicketPriceInLuchow(
                lotto.update.minPriceTicket, 
                lotto.update.maxPriceTicket
            );
            // Getting the min and max ticket price in luchow after the update
            let minPriceTicketInLuchowAfter = await lotteryInstance.minPriceTicketInLuchow();
            let maxPriceTicketInLuchowAfter = await lotteryInstance.maxPriceTicketInLuchow();

            // Testing
            assert.equal(
                minPriceTicketInLuchowBefore.toString(),
                lotto.setup.minPriceTicket,
                "Min ticket price in luchow incorrect"
            );
            assert.equal(
                maxPriceTicketInLuchowBefore.toString(),
                lotto.setup.maxPriceTicket,
                "Max ticket price in luchow incorrect"
            );
            assert.equal(
                minPriceTicketInLuchowAfter.toString(),
                lotto.update.minPriceTicket,
                "Min ticket price in luchow incorrect after update"
            );
            assert.equal(
                maxPriceTicketInLuchowAfter.toString(),
                lotto.update.maxPriceTicket,
                "Max ticket price in luchow incorrect after update"
            );
        });
        /**
         * Tests that a non owner cannot update min and max ticket price in luchow
         */
        it("Invalid update min and max ticket price in luchow (non-owner)", async function() {
            // Updating the min and max ticket price in luchow
            await expect(
                    lotteryInstance.connect(buyer).setMinAndMaxTicketPriceInLuchow(
                    lotto.update.minPriceTicket, 
                    lotto.update.maxPriceTicket
                )
            ).to.be.revertedWith(lotto.errors.invalid_owner);
        });
        /**
         * Tests that an admin can update max number of tickets
         */
        it("Update max number of tickets", async function() {
            // Getting the max number of tickets
            let maxNumberTicketsPerBuyBefore = await lotteryInstance.maxNumberTicketsPerBuyOrClaim();
            // Updating max number of tickets
            await lotteryInstance.setMaxNumberTicketsPerBuy(
                lotto.update.maxNumberTicketsPerBuy
            );
            // Getting the max number of tickets after update
            let maxNumberTicketsPerBuyAfter = await lotteryInstance.maxNumberTicketsPerBuyOrClaim();

            // Testing
            assert.equal(
                maxNumberTicketsPerBuyBefore.toString(),
                lotto.setup.maxNumberTicketsPerBuy,
                "Max number of tickets incorrect"
            );
            assert.equal(
                maxNumberTicketsPerBuyAfter.toString(),
                lotto.update.maxNumberTicketsPerBuy,
                "Max number of tickets incorrect after update"
            );
        });
        /**
         * Tests that a non owner cannot set max number of tickets
         */
        it("Invalid update max number of tickets (non-owner)", async function() {
            // Setting the max number of tickets
            await expect(
                    lotteryInstance.connect(buyer).setMaxNumberTicketsPerBuy(
                    lotto.update.maxNumberTicketsPerBuy, 
                )
            ).to.be.revertedWith(lotto.errors.invalid_owner);
        });
    });

    describe("View function tests", function() {
        it("Get ticket price with discount", async function() {
            // Getting prices
            let pricesBucketOne = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                10
            );
            let pricesBucketTwo = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                35
            );
            let pricesBucketThree = await lotteryInstance.calculateTotalPriceForBulkTickets(
                lotto.newLotto.discountDivisor,
                lotto.newLotto.cost,
                51
            );
            // Testing
            assert.equal(
                pricesBucketOne.toString(),
                lotto.discount.ten,
                "Discount cost for buy of 10 incorrect"
            );
            assert.equal(
                pricesBucketTwo.toString(),
                lotto.discount.thirty_five,
                "Discount cost for buy of 35 incorrect"
            );
            assert.equal(
                pricesBucketThree.toString(),
                lotto.discount.fifty_one,
                "Discount cost for buy of 51 incorrect"
            );
        });

        it("Get Lottery Info", async function() {
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
            // Getting lottery id
            let lotteryId = await lotteryInstance.viewCurrentLotteryId();
            // Getting the info around this lottery
            let lotteryInfo = await lotteryInstance.viewLottery(lotteryId);
            // Testing they are correct
            assert.equal(
                lotteryInfo.endTime.toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                "Invalid end time"
            );
            assert.equal(
                lotteryInfo.discountDivisor.toString(),
                lotto.newLotto.discountDivisor.toString(),
                "Invalid discount divisor"
            );
            assert.equal(
                lotteryInfo.rewardsBreakdown.toString(),
                lotto.newLotto.rewardsBreakdown.toString(),
                "Invalid rewards breakdown"
            );
            assert.equal(
                lotteryInfo.burnFee.toString(),
                lotto.newLotto.burnFee.toString(),
                "Invalid burn fee"
            );
            assert.equal(
                lotteryInfo.treasuryFee.toString(),
                lotto.newLotto.treasuryFee.toString(),
                "Invalid treasury fee"
            );
            assert.equal(
                lotteryInfo.charityFee.toString(),
                lotto.newLotto.charityFee.toString(),
                "Invalid charity fee"
            );
        })
    });
});
