// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract Escrow {
    //VARIABLES

    enum State {
        NOT_INITIATED,
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        COMPLETE
    } //used to check the state of the contract.

    State public currState; //used to measure the current state of the contract

    bool public isBuyerIn; //to show if buyer accepts the contract
    bool public isSellerIn; //to show if seller accepts the contract

    uint256 public price;

    address public buyer;
    address payable public seller;

    //MODIFIERS
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this function");
        _;
    }

    modifier escrowNotStarted() {
        require(currState == State.NOT_INITIATED);
        _;
    }

    //FUNCTIONS

    constructor(
        address _buyer,
        address payable _seller,
        uint256 _price
    ) {
        //
        buyer = _buyer;
        seller = _seller;
        price = _price;
    }

    function initContract() public escrowNotStarted {
        // initiates the contract, called by both the buyer and the sell, that initiates the state where the buyers and sellers can transfer their funds.

        if (msg.sender == buyer) {
            isBuyerIn = true;
        }
        if (msg.sender == seller) {
            isSellerIn = true;
        }
        if (isBuyerIn && isSellerIn) {
            currState = State.AWAITING_PAYMENT;
        }
    }

    function deposit() public payable onlyBuyer {
        //function that allows the buyer to deposit his funds
        require(
            currState = State.AWAITING_PAYMENT, 
            "Already paid"
            );
        require(msg.value = price, "Wrong deposit amount");
        currState = State.AWAITING_DELIVERY;
    }

    function confirmDelivery() public payable onlyBuyer {
        //a way for the buyer to confirm delivery.
        require(
            currState == State.AWAITING_DELIVERY,
            "Cannot confirm Delivery"
        );
        seller.transfer(price);
        currState = State.AWAITING_DELIVERY;
    }

    function withdraw() public payable onlyBuyer {
        // a way for buyer to take away his funds, if he never receives anything from the seller.
        require(
            currState == State.AWAITING_DELIVERY,
            "Cannot withdraw at this stage"
        );
        payable(msg.sender).transfer(price);
        currState = State.COMPLETE;
    }
}
