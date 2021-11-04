// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;
pragma abicoder v2;

import "./interfaces/ILottery.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is ILottery, Ownable {
}