// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.6/tests/VRFCoordinatorMock.sol";
import "./ILottery.sol";

/**
 * @dev THIS CONTRACT IS FOR TESTING PURPOSES ONLY.
 */
contract Mock_VRFCoordinator is VRFCoordinatorMock {
    
    bytes32 internal keyHash;
    uint256 internal fee;
    address internal requester;
    uint256 public randomResult;
    uint256 public currentLotteryId;
    
    constructor(
        address _linkToken,
        bytes32 _keyHash,
        uint256 _fee
    ) 
        VRFCoordinatorMock( 
            _linkToken  
        ) public
    {
        keyHash = _keyHash;
        fee = _fee; 
    }
}