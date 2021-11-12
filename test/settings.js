const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const lotto = {
    setup: {
        minPriceTicket: ethers.utils.parseUnits("5", "15"),
        maxPriceTicket: ethers.utils.parseUnits("50", "18"),
        maxNumberTicketsPerBuy: 100,
        sizeOfLottery: 6,
    },
    update: {
        minPriceTicket: ethers.utils.parseUnits("10", "15"),
        maxPriceTicket: ethers.utils.parseUnits("60", "18"),
        maxNumberTicketsPerBuy: 120,
    },
    newLotto: {
        rewardsBreakdown: [100, 300, 500, 1000, 2000, 4000],
        burnFee: 100,
        treasuryFee: 1000,
        charityFee: 1000,
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
    buy: {
        luchow: ethers.utils.parseUnits("10000000", 18),
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "99550000000000000000"
        },
    },
    discount: {
        ten: "99550000000000000000",
        thirty_five: "344050000000000000000",
        fifty_one: "497250000000000000000",
    },
    draw: {
        random: ethers.utils.parseUnits("71812290232383789158325313353218754072886144180308695307717334628590412940628", 0)
    },
    errorData: {
        rewardsBreakdown: [100, 300, 500, 1000, 2000, 3000],
        discountDivisor: 100,
        charityFee: 5000,
        treasuryFee: 5000,
        cost: ethers.utils.parseUnits("0", 18),
        ticketNumbers: [123412],
    },
    errors: {
        invalid_operator: "Not operator",
        invalid_rewards_breakdown_total: "Sum of rewards and fees must equal 10000",
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
        invalid_owner: "Ownable: caller is not the owner",
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