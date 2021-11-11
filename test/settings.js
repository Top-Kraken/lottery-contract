const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const lotto = {
    setup: {
        sizeOfLottery: 6,
        maxValidRange: 10,
        bucket: {
            one: 20,
            two: 50
        },
        bucketDiscount: {
            one: 5,
            two: 10,
            three: 15
        }
    },
    update: {
        sizeOfLottery: 5,
        maxValidRange: 100,
        bucket: {
            one: 30,
            two: 50
        },
        bucketDiscount: {
            one: 1,
            two: 5,
            three: 10
        }
    },
    newLotto: {
        rewardsBreakdown: [250, 375, 625, 1250, 2500, 5000],
        burnFee: 100,
        treasuryFee: 900,
        charityFee: 1000,
        distribution: [5, 10, 35, 50],
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 10000,
        endIncrease: 20000,
        discountDivisor: 2000,
        win: {
            winningNumber: 1940628,
            winningNumber_five: 1040628,
            winningNumber_four: 1000628,
            winningNumber_none: 1940620,
            match_all: ethers.utils.parseUnits("1991", 17),
            match_five: ethers.utils.parseUnits("9955", 16),
            match_four: ethers.utils.parseUnits("49775", 15),
        }
    }, 
    chainLink: {
        keyHash: "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
        fee: ethers.utils.parseUnits("1", 19)
    },
    events: {
        new: "LotteryOpen",
        mint: "NewBatchMint",
        request: "requestNumbers"
    },
    buy: {
        luchow: ethers.utils.parseUnits("10000000", 18),
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "99550000000000000000"
        },
        fifty: {
            cost: "500000000000000000000"
        },
        max: {
            cost: "560000000000000000000"
        }
    },
    discount: {
        ten: {
            cost: "100000000000000000000",
            discount: "5000000000000000000",
            discountCost: "95000000000000000000"
        },
        thirty_five: {
            cost: "350000000000000000000",
            discount: "35000000000000000000",
            discountCost: "315000000000000000000"
        },
        fifty_one: {
            cost: "510000000000000000000",
            discount: "76500000000000000000",
            discountCost: "433500000000000000000"
        },
    },
    draw: {
        random: ethers.utils.parseUnits("71812290232383789158325313353218754072886144180308695307717334628590412940628", 0)
    },
    errorData: {
        rewardsBreakdown: [250, 375, 625, 1250, 2500, 3000],
        discountDivisor: 100,
        charityFee: 5000,
        treasuryFee: 5000,
        cost: ethers.utils.parseUnits("0", 18),
        ticketNumbers: [123412],

        distribution_length: [5, 10, 15, 20, 10],
        distribution_total: [5, 10, 15, 20],
        prize: ethers.utils.parseUnits("0", 18),
        startTime: ethers.utils.parseUnits("0", 18),
        bucket: 0
    },
    errors: {
        invalid_operator: "Not operator",
        invalid_rewards_breakdown_total: "Rewards must equal 10000",
        invalid_cost: "Outside of limits",
        invalid_timestamp: "Lottery length outside of range",
        invalid_divisor: "Discount divisor too low",
        invalid_charity: "Charity fee too high",
        invalid_treasury: "Treasury fee too high",
        invalid_ticket_number: "Outside range",
        invalid_ticket_numbers_count: "Too many tickets",
        invalid_lottery: "Lottery is not open",
        invalid_buying_time: "Lottery is over",
        invalid_mint_approve: "ERC20: transfer amount exceeds allowance",
        invalid_close_repeat: "Lottery not open",
        invalid_close_time: "Lottery not over",
        invalid_draw_not_closed: "Lottery not close",
        invalid_prize: "No prize for this bracket",
        invalid_claim_draw: "Lottery not claimable",
        invalid_claim_owner: "Not the owner",

        invalid_admin: "Ownable: caller is not the owner",
        invalid_distribution_length: "Invalid distribution",
        invalid_distribution_total: "Prize distribution is not 100%",
        invalid_mint_timestamp: "Invalid time for mint",
        invalid_mint_numbers: "Invalid chosen numbers",
        invalid_draw_time: "Cannot set winning numbers during lottery",
        invalid_draw_repeat: "Lottery State incorrect for draw",
        invalid_claim_time: "Wait till end to claim",
        invalid_claim_duplicate: "Ticket already claimed",
        invalid_claim_lottery: "Ticket not for this lottery",
        invalid_size_update_duplicate: "Cannot set to current size",
        invalid_numbers_range: "Numbers for ticket invalid",
        invalid_bucket_range: "Bucket range cannot be 0",
        invalid_bucket_discount: "Discounts must increase"
    }
}
function generateLottoNumbers({
    numberOfTickets,
    lottoSize,
}) {
    var numberOfNumbers = [];
    let counterForNumbers = 0;
    for (let i = 0; i < numberOfTickets; i++) {
        numberOfNumbers[counterForNumbers] = Math.floor(Math.random() * (10 ** lottoSize)) + (10 ** lottoSize); 
        counterForNumbers += 1;
    }
    return numberOfNumbers;
}
function getMatchBrackets(
    userTicketIds,
    userTicketNumbers,
    winning_number
) {
    var ticketIds = [];
    var ticketNumbers = [];
    var ticketBuckets = [];
    for ( let i = 0; i < userTicketNumbers.length; i ++ ) {
        for ( let j = 0; j < 6; j ++ ) {
            let divisor = 10**(6 -j);
            if ( userTicketNumbers[i] % divisor == winning_number % divisor ) {
                ticketIds.push(userTicketIds[i]);
                ticketNumbers.push(userTicketNumbers[i]);
                ticketBuckets.push(5 - j);
                break;
            }
        }
    }
    return {
        ticketIds,
        ticketNumbers,
        ticketBuckets
    };
}

module.exports = {
    lotto,
    BigNumber,
    generateLottoNumbers,
    getMatchBrackets,
}