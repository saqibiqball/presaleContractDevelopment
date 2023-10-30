// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BEP20Token {
    string public name = "SOFT TECH";
    string public symbol = "SOFT";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10 ** uint256(decimals);
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0), "Invalid address");
        
        allowance[msg.sender][_spender] = _value;
        
        emit Approval(msg.sender, _spender, _value);
        
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_from != address(0) && _to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        
        return true;
    }
}

contract SoftTokenPresale {
    BEP20Token public token; // The BEP-20 token being sold
    address public owner; // The owner of the presale contract
    uint256 public tokenPrice; // Price of 1 token in BNB (1 BNB = 1e18 wei)
    uint256 public tokensSold; // Number of tokens sold
    uint256 public minPurchase; // Minimum purchase amount in BNB
    uint256 public maxPurchase; // Maximum purchase amount in BNB
    uint256 public presaleStartTime; // Start time of the presale
    uint256 public presaleEndTime; // End time of the presale

    event Purchase(address indexed buyer, uint256 amount);
    event PresaleFinalized(uint256 tokensSold, uint256 totalAmountRaised);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier duringPresale() {
        require(
            block.timestamp >= presaleStartTime &&
                block.timestamp <= presaleEndTime,
            "Presale is not active"
        );
        _;
    }

    constructor(address _tokenAddress, uint256 _durationInMinutes, uint256 _tokenPrice, uint256 _minPurchase, uint256 _maxPurchase) {
        token = BEP20Token(_tokenAddress);
        owner = msg.sender;
        tokenPrice = _tokenPrice;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + _durationInMinutes * 1 minutes;
        tokensSold = 0;
    }

    function buyTokens(uint256 _numTokens) external payable duringPresale {
        require(
            msg.value >= minPurchase,
            "Amount sent is less than the minimum purchase"
        );
        require(
            msg.value <= maxPurchase,
            "Amount sent exceeds the maximum purchase"
        );

        uint256 cost = _numTokens * tokenPrice;
        require(
            cost == msg.value,
            "Incorrect amount sent for the requested number of tokens"
        );

        uint256 availableTokens = token.balanceOf(address(this));
        require(
            availableTokens >= _numTokens,
            "Not enough tokens left for sale"
        );

        tokensSold += _numTokens;

        emit Purchase(msg.sender, _numTokens);

        // Transfer tokens to the buyer
        require(
            token.transfer(msg.sender, _numTokens),
            "Token transfer failed"
        );
    }

    function finalizePresale() external onlyOwner {
        require(block.timestamp > presaleEndTime, "Presale has not ended yet");

        uint256 totalAmountRaised = address(this).balance;

        // Transfer the BNB to the owner
        payable(owner).transfer(totalAmountRaised);

        emit PresaleFinalized(tokensSold, totalAmountRaised);
    }

    // In case any BNB or tokens are sent to the contract, the owner can withdraw them
    function withdrawBNB() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // In case any tokens are mistakenly sent to the contract, the owner can withdraw them
    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(token.transfer(owner, balance), "Token transfer failed");
    }
}