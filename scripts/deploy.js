const { 
    lotto,
} = require("../test/settings.js");

// The deployment script
const main = async() => {
    // Getting the first signer as the deployer
    const [deployer] = await ethers.getSigners();
    // Saving the info to be logged in the table (deployer address)
    var deployerLog = { Label: "Deploying Address", Info: deployer.address };
    // Saving the info to be logged in the table (deployer address)
    var deployerBalanceLog = {
        Label: "Deployer ETH Balance",
        Info: (await deployer.getBalance()).toString()
    };

    let mock_erc20Contract;
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the luchow token contract
    let luchowInstance;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance, randGenContract;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem.
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;

    // Getting the lottery code (abi, bytecode, name)
    lotteryContract = await ethers.getContractFactory("LunaChowLottery");
    mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
    // Getting the ChainLink contracts code (abi, bytecode, name)
    randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
    mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

    // Deploys the contracts
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
    // Saving the info to be logged in the table (deployer address)
    var luchowLog = { Label: "Deployed Mock LuChow Token Address", Info: luchowInstance.address };
    var lotteryLog = { Label: "Deployed Lottery Address", Info: lotteryInstance.address };

    console.table([
        deployerLog,
        deployerBalanceLog,
        luchowLog,
        lotteryLog
    ]);
}
// Runs the deployment script, catching any errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });