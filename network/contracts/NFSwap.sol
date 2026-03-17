// contracts/NFSwap.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract NFSwap {
    address public owner;
    IERC20 public nfToken;
    IERC20 public usdtToken;

    // Price: how many USDT (in 6 decimals) per 1 NF (in 18 decimals)
    // e.g. rate = 10000 means 1 NF = 0.01 USDT
    // e.g. rate = 1000000 means 1 NF = 1 USDT
    uint256 public rate; // USDT per 1 whole NF token (in USDT smallest unit)

    event Swapped(address indexed user, string direction, uint256 amountIn, uint256 amountOut);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event Funded(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _nfToken, address _usdtToken, uint256 _rate) {
        owner = msg.sender;
        nfToken = IERC20(_nfToken);
        usdtToken = IERC20(_usdtToken);
        rate = _rate;
    }

    /// @notice Swap NF → USDT. User sends NF, receives USDT.
    /// @param _nfAmount Amount of NF tokens (in 18 decimals)
    function swapNFtoUSDT(uint256 _nfAmount) external {
        uint256 usdtAmount = (_nfAmount * rate) / (10 ** 18);
        require(usdtAmount > 0, "Amount too small");
        require(usdtToken.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT in pool");

        require(nfToken.transferFrom(msg.sender, address(this), _nfAmount), "NF transfer failed");
        require(usdtToken.transfer(msg.sender, usdtAmount), "USDT transfer failed");

        emit Swapped(msg.sender, "NF->USDT", _nfAmount, usdtAmount);
    }

    /// @notice Swap USDT → NF. User sends USDT, receives NF.
    /// @param _usdtAmount Amount of USDT (in 6 decimals)
    function swapUSDTtoNF(uint256 _usdtAmount) external {
        uint256 nfAmount = (_usdtAmount * 10 ** 18) / rate;
        require(nfAmount > 0, "Amount too small");
        require(nfToken.balanceOf(address(this)) >= nfAmount, "Insufficient NF in pool");

        require(usdtToken.transferFrom(msg.sender, address(this), _usdtAmount), "USDT transfer failed");
        require(nfToken.transfer(msg.sender, nfAmount), "NF transfer failed");

        emit Swapped(msg.sender, "USDT->NF", _usdtAmount, nfAmount);
    }

    /// @notice Update the exchange rate (owner only)
    function setRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be > 0");
        emit RateUpdated(rate, _newRate);
        rate = _newRate;
    }

    /// @notice Check how much USDT you get for a given NF amount
    function getUSDTAmount(uint256 _nfAmount) external view returns (uint256) {
        return (_nfAmount * rate) / (10 ** 18);
    }

    /// @notice Check how much NF you get for a given USDT amount
    function getNFAmount(uint256 _usdtAmount) external view returns (uint256) {
        return (_usdtAmount * 10 ** 18) / rate;
    }

    /// @notice Pool balances
    function poolNFBalance() external view returns (uint256) {
        return nfToken.balanceOf(address(this));
    }

    function poolUSDTBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    /// @notice Owner withdraws tokens from the pool
    function withdraw(address _token, uint256 _amount) external onlyOwner {
        require(IERC20(_token).transfer(msg.sender, _amount), "Withdraw failed");
        emit Withdrawn(_token, _amount);
    }
}
