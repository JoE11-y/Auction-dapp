//SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;


interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Auctions{

    //Variables
    address internal contractOwner;
    uint256 internal amount;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    uint index = 0;

    address testAddress = 0xBB3b4F6E962e138FeE39a9a944878fD7f33121f1;
   
   event highestBidIncrease(address bidder, uint amount);

    struct Auction {
        address payable beneficiary;
        string itemImage;
        string itemDetails;
        uint auctionStartTime;
        uint auctionEndTime;
        uint startPrice;
        uint biddingFee;
        address highestBidder;
        uint highestBid;
        bool auctionEnded;
        bool auctionSettled;

        
        mapping (address => bool) hasPaidBidFee;
    }

    mapping(uint => Auction) internal auctions;


    modifier onlyAfter(uint _time){
        // i.e function can only be activated after the time runs out
        require(block.timestamp > _time);
        _;
    }
    
    modifier onlyHighestbidder(uint _index) {
        require(msg.sender == auctions[_index].highestBidder, "You're not the Winner of the Auction");
        _;
    }
    
    modifier hasPaidBidFee(uint _index){
        require(auctions[_index].hasPaidBidFee[msg.sender] != true, "You have not paid bidding fee");
        _;
    }


    //Constructor
    constructor(){
        contractOwner = msg.sender;
    }

    //Functions

    function createAuction(
        string memory _itemDetails,
        string memory _itemImage,
        uint _startTime,
        uint _endTime,
        uint _startPrice
        )public {
            Auction storage _auction = auctions[index];
            _auction.beneficiary = payable(msg.sender);
            _auction.itemDetails = _itemDetails;
            _auction.itemImage = _itemImage;
            _auction.auctionStartTime = block.timestamp + _startTime;
            _auction.auctionEndTime = _auction.auctionStartTime + _endTime;
            _auction.startPrice = _startPrice;
            _auction.biddingFee = (_startPrice)/10;
            _auction.highestBid = _auction.startPrice;
            _auction.auctionEnded = false;
            _auction.auctionSettled = false;

            index++;
    }

    function getAuction(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        uint,
        uint,
        uint,
        uint
    ) {
        return(
            auctions[_index].beneficiary,
            auctions[_index].itemImage,
            auctions[_index].itemDetails,
            auctions[_index].auctionStartTime,
            auctions[_index].auctionEndTime,
            auctions[_index].startPrice,
            auctions[_index].biddingFee
        );
    }

    function payBidFee(uint _index) public payable{
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, testAddress, auctions[_index].biddingFee),
                "Transfer failed"
        );
        auctions[_index].hasPaidBidFee[msg.sender] = true;
    }

    function withdrawBidFee(uint _index) public onlyAfter(auctions[_index].auctionEndTime) hasPaidBidFee(_index){ 
        //if (auctions[_index].hasPaidBidFee[msg.sender] != true) {
           // revert("You have not paid bidding fee");
        //}
        if (msg.sender == auctions[_index].highestBidder){
            require(auctions[_index].auctionSettled == true, "You cannot withdraw Bid Fee until you have settled the auction.");
            amount = auctions[_index].biddingFee;
            IERC20Token(cUsdTokenAddress).transfer(msg.sender, amount);
        }else{
            amount = auctions[_index].biddingFee;
            IERC20Token(cUsdTokenAddress).transfer(msg.sender, amount);
        }
        
    }

    function placeBid(uint _index, uint bidAmount) public onlyAfter(auctions[_index].auctionStartTime) hasPaidBidFee(_index){
        if (block.timestamp > auctions[_index].auctionEndTime) {
            revert("The auction has already ended");
        }

        if (bidAmount <= auctions[_index].highestBid){
            revert("There is already a higher or equal bid");
        }

        auctions[_index].highestBidder = msg.sender;
        auctions[_index].highestBid = bidAmount;
        
        emit highestBidIncrease(msg.sender, bidAmount);
    }

    function settleAuction(uint _index, uint _highestBid) public payable onlyAfter(auctions[_index].auctionEndTime) onlyHighestbidder(_index){
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, auctions[_index].beneficiary, _highestBid),
                "Transfer failed"
        );

        auctions[_index].auctionSettled = true;
        auctions[_index].auctionEnded = true;
    }


}