import Web3 from 'web3'
import {
  newKitFromWeb3
} from '@celo/contractkit'
import BigNumber from "bignumber.js"
import auctionAbi from '../contract/auction.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const AuctionContractAddress = "0x82220Ab813545e6942911964147DED841b8Bf347"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let contract
let kit
let recentAuctions
let currentAuctionID
let auctions = []
let activeListings = []
let closedListings = []



/*
const auctions = [{
    name: "Giant BBQ",
    image: "https://i.imgur.com/yPreV19.png",
    itemName: `Grilled chicken, beef, fish, sausages, bacon, 
      vegetables served with chips.`,
    location: "Kimironko Market",
    owner: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
    endTime: 23492875,
    noOfBids: 27,
    index: 0,
    startPrice: 50,
    highestBid: 70,
    hasAuctionStarted: true,
    remainingTimeTillStart: 0,
    biddingFee: 5,
    hasPaidBidFee: false,
    hasAuctionEnded: false,
    highestBidder: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
  },
  {
    name: "BBQ Chicken",
    image: "https://i.imgur.com/NMEzoYb.png",
    itemName: `French fries and grilled chicken served with gacumbari 
      and avocados with cheese.`,
    location: "Afrika Fresh KG 541 St",
    owner: "0x3275B7F400cCdeBeDaf0D8A9a7C8C1aBE2d747Ea",
    endTime: 40000000,
    noOfBids: 12,
    index: 1,
    startPrice: 60,
    highestBid: 133,
    hasAuctionStarted: true,
    remainingTimeTillStart: 0,
    biddingFee: 6,
    hasPaidBidFee: true,
    hasAuctionEnded: false,
    highestBidder: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
  },
  {
    name: "Beef burrito",
    image: "https://i.imgur.com/RNlv3S6.png",
    itemName: `Homemade tortilla with your choice of filling, cheese, 
      guacamole salsa with Mexican refried beans and rice.`,
    location: "Asili - KN 4 St",
    owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
    endTime: 36743893,
    noOfBids: 35,
    index: 2,
    startPrice: 70,
    highestBid: 70,
    hasAuctionStarted: false,
    remainingTimeTillStart: 4000,
    biddingFee: 7,
    hasPaidBidFee: true,
    hasAuctionEnded: true,
    highestBidder: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
  },
  {
    name: "Barbecue Pizza",
    image: "https://i.imgur.com/fpiDeFd.png",
    itemName: `Barbecue Chicken Pizza: Chicken, gouda, pineapple, onions 
      and house-made BBQ sauce.`,
    location: "Kigali Hut KG 7 Ave",
    owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
    endTime: 23492735,
    noOfBids: 2,
    index: 3,
    startPrice: 80,
    highestBid: 80,
    hasAuctionStarted: false,
    remainingTimeTillStart: 50000,
    biddingFee: 8,
    hasPaidBidFee: false,
    hasAuctionEnded: false,
    highestBidder: "0x3275B7F400cCdeBeDaf0D8A9a7C8C1aBE2d747Ea"
  },
]
*/

//Celo Blockchain Functions
const connectCeloWallet = async function() {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(auctionAbi, AuctionContractAddress)

    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(AuctionContractAddress, _price)
    .send({
      from: kit.defaultAccount
    })
  return result
}


const getBalance = async function() {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const setUser = async function() {
  document.getElementById("userAddr").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.innerHTML = renderUserIcon(kit.defaultAccount)
  document.getElementById("userAddr").appendChild(newDiv)
}

const getAuctions = async function() {
  const _auctionsLength = await contract.methods.getAuctionsLength().call()
  const _auctions = []
  for (let i = 0; i > _auctionsLength; i++) {
    let _auction = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getAuction(i).call()
      let q = await contract.methods.getPricing(i).call()
      let r = await contract.methods.hasAuctionStarted(i).call()
      let s = await contract.methods._hasPaidBidFee(i).call()
      let t = await contract.methods.getBidDetails(i).call()
      let u = await contract.methods.hasAuctionEnded(i).call()
      let v = await contract.methods.hasPlacedBid(i).call()
      let w = await contract.methods.noOfBids(i).call()
      resolve({
        index: i,
        owner: p[0],
        itemName: p[1],
        itemDescription: p[2],
        image: p[3],
        endTime: [p3],
        startPrice: new BigNumber(q[0]),
        biddingFee: new BigNumber(q[1]),
        hasAuctionStarted: r[0],
        remainingTimeTillStart: r[1],
        hasPaidBidFee: s,
        highestBidder: t[0],
        highestBid: t[1],
        hasAuctionEnded: u,
        hasPlacedBid: v,
        noOfBids: w,
      })
    })
    _auctions.push(_auction)

  }
  auctions = await Promise.all(_auctions)
  sortListings()
  setUserID()
  getRecent()
  renderAuctions(recentAuctions)
  displayUserOutBid()
  displayWinningNotification()
}



// Created Functions
function setUserID() {
  auctions.forEach((_auction) => {
    if (kit.defaultAccount == _auction.owner) {
      _auction["isUserOwner"] == true;
    } else {
      _auction["isUserOwner"] == false;
    }
    if (_auction.hasAuctionEnded && kit.defaultAccount == _auction.highestBidder) {
      _auction["isUserWinner"] == true;
    } else {
      _auction["isUserWinner"] == false;
    }
  })
}

function displayWinningNotification() {
  closedListings.forEach((_auction) => {
    if (_auction.hasAuctionEnded && kit.defaultAccount == _auction.highestBidder) {
      notification(`🎉 Congratulations you won auction ${_auction.name}.`)
      setTimeout(function() {}, 30000);
    }
  })
}

function displayUserOutBid() {
  activeListings.forEach((_auction) => {
    if (_auction.hasPlacedBid && kit.defaultAccount != _auction.highestBidder) {
      notification(`🎉 Your Bid for ${_auction.name} has been outbid.`)
      setTimeout(function() {}, 30000);
    }
  })
}

function sortListings() {
  auctions.forEach((_auction) => {
    if (_auction.hasAuctionEnded) {
      closedListings.push(_auction)
    } else {
      activeListings.push(_auction)
    }
  })
}

function notification(_text) {
  document.querySelector("#notification").textContent = _text
  $('._alert').addClass("show");
  $('._alert').removeClass("hide");
  $('._alert').addClass("showAlert");
}

function notificationOff() {
  $('._alert').removeClass("show");
  $('._alert').addClass("hide");
}

function getRecent() {
  let dummy = [...activeListings];
  dummy.push("");
  recentAuctions = dummy.slice(-4, -1);
}

function renderAuctions(_auctions) {
  document.getElementById("gallery").innerHTML = ""
  _auctions.forEach((_auction) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = auctionTemplate(_auction)
    document.getElementById("gallery").appendChild(newDiv)
  })
}


function checkTime(_auction) {
  var endingTime = _auction.endTime;
  var remainingTime = _auction.remainingTimeTillStart;
  if (_auction.hasAuctionStarted) {
    var seconds = parseInt(endingTime, 10);
    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hrs = Math.floor(seconds / 3600);
    return `
    <span> Auction Ends in ${days}d ${hrs}h</span>
  `
  } else {
    var seconds = parseInt(remainingTime, 10);
    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hrs = Math.floor(seconds / 3600);
    return `
    <span> Auction Starts in ${hrs}h</span>
  `
  }

}

function convertDays(_days) {
  var seconds = Math.floor(_days * 24 * 3600);
  return seconds;
}

function auctionTemplate(_auction) {
  return `
  <div class="card mb-4">
  <img class="card-img-top" src="${_auction.image}" alt="...">
  <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
  <i class="fas fa-gavel"></i>&nbsp;${_auction.noOfBids} Bids
  </div>
  <div class="card-body text-left p-4 position-relative">
    <div class="translate-middle-y position-absolute top-0">
    ${identiconTemplate(_auction.owner)}
    </div>
    <h6 class="card-title fs-4 fw-bold mt-2" style=" font-size: 17px !important; min-height: 120px; text-transform:uppercase;">
    ${_auction.itemName}
    </h6>
    <h3 class="card-text mt-4">
      $${_auction.highestBid}
    </h3>
    <p class="card-text mt-4">
    <i class="fas fa-hourglass-half"></i>&nbsp;
      ${checkTime(_auction)}
    </p>
    <div class="d-grid gap-2">
      <a class="btn btn-lg btn-outline-dark viewAuction fs-6 p-3" id=${
        _auction.index
      }>
       View Auction
      </a>
    </div>
  </div>
</div>

  `
}

function renderAuctionModal(index) {
  notification("⌛ Loading...")
  document.getElementById("auctionDisplay").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.className = "modal-content"
  newDiv.innerHTML = auctionModalTemplate(auctions[index])
  document.getElementById("auctionDisplay").appendChild(newDiv)
  editAuctionModal(auctions[index])
  $("#auctionModal").modal('show');
  notificationOff()
}

function editAuctionModal(_auction) {
  if (!_auction.hasAuctionStarted) {
    $("#auctiondets").addClass('is-hidden')
  }
  if (_auction.hasAuctionEnded) {
    $("#time").addClass('is-hidden')
    $("#bid").addClass('is-hidden')
    $(".payBidBtn").addClass('is-hidden')
  } else {
    $("#ended").addClass('is-hidden')
  }
  if (_auction.hasPaidBidFee) {
    $(".payBidBtn").addClass('is-hidden')
  } else {
    $("#withdrawBtn").addClass('is-hidden')
    $("#bid").addClass('is-hidden')
  }
  if (_auction.isUserWinner) {
    $("#settleBtn").removeClass('is-hidden')
    $("#bid").addClass('is-hidden')
  }
}




function auctionModalTemplate(_auction) {
  return `
<div class="modal-content" style="background-color: rgb(171, 161, 163);">
  <div class="modal-header">
    <div class="modal-title" id="auctionTitle">
      <span class="navbar-brand mb-0 h1"> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Crossed_Gavels.svg/200px-Crossed_Gavels.svg.png" height="30" alt="" loading="lazy" style="margin-top: -1px;" />BID-WAR</span>
    </div>
    <button type="button" class="btn-close closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <div class="modal-body" style="background-color: rgb(171, 161, 163);">
    <div class="flex_container">
      <div class="flex_row">
        <div id="carouselExampleIndicators" class="carousel slide carousel-fade" data-mdb-ride="carousel">
          <div class="carousel-indicators">
            <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="2" aria-label="Slide 3"></button>
          </div>
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="${_auction.image}" class="d-block w-100" alt="..." />
            </div>
            <div class="carousel-item">
              <img src="${_auction.image}" class="d-block w-100" alt="..." />
            </div>
            <div class="carousel-item">
              <img src="${_auction.image}" class="d-block w-100" alt="..." />
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
      </div>
      <div class="flex_row">
        <div>
        <h6 class="card-title fs-4 fw-bold mt-2" style=" font-size: 20px !important; min-height: 60px; text-transform:uppercase;">
        ${_auction.itemName}
        </h6>
        </div>
        <hr>
        <div id="time">
          &emsp;&emsp;${checkTime(_auction)}
        </div>
        <div id="ended">
          <p>&emsp;&emsp;Time Left: Listing has Ended</p>
        </div>
        <hr>
        <div>
          <p>&emsp;&emsp;Start Price:&ensp;${_auction.startPrice}&nbsp;cUSD</p>
          <p>&emsp;&emsp;Highest Bid:&ensp;${_auction.highestBid}&nbsp;cUSD</p>
          <p>&emsp;&emsp;No of Bids:&ensp;${_auction.noOfBids}&nbsp;<i class="fas fa-gavel"></i></p>  
        </div>
        <hr>
        <div id="auctiondets">
          <div id="bid">
            &emsp;&emsp;<input id="bidAmount" type="text" size="9" required>&nbsp;cUSD&nbsp;&emsp;&emsp;<button type="button" class="btn btn-dark placeBid">Place bid</button><br>
          </div>
          <br>
          <p>&emsp;&emsp;Bid Fee: 10% of starting bid price</p>
          &emsp;&emsp;<button type="button" id="payBidBtn" class="btn btn-dark payBidBtn">
          Pay Bid Fee
          </button>
          <button type="button" id="withdrawBtn" class="btn btn-dark withdrawBidFee">
            Withdraw Bid Fee
          </button>
          <button type="button" id="settleBtn" class="btn btn-dark is-hidden">
            Settle Bid
          </button>
        </div>
      </div>     
    </div>
    <hr>
    <div style="height:400px; background-color:white; overflow:auto">
      <h4 style="padding-top: 20px; padding-left: 20px;">ITEM DETAILS</h4>
      <p style="padding: 20px; margin:auto;">
        ${_auction.itemDescription}
      </p>
    </div>
  </div>
</div>

`
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
}

function renderUserIcon(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
<div id="userAddr" class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm">
<a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
  target="_blank">
  <img src="${icon}" width="35" alt="${_address}">
</a>
</div>
  `
}

// DOM Queries
$(document).ready(() => {
  $('.close-btn').click(function() {
    notificationOff()
  });
});

document
  .querySelector("#newAuctionBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("itemName").value,
      document.getElementById("item-desc").value,
      document.getElementById("newImgUrl").value,
      convertDays(document.getElementById("listing-duration").value),
      new BigNumber(document.getElementById("startPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding New Auction...`)
    try {
      const result = await contract.methods
        .createAuction(...params)
        .send({
          from: kit.defaultAccount
        })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added a new auction.`)
    getAuctions()
  })

document.querySelector("#gallery").addEventListener("click", async (e) => {
  if (e.target.className.includes("viewAuction")) {
    currentAuctionID = e.target.id
    renderAuctionModal(currentAuctionID)
  }
})

document.querySelector("#activeListings").addEventListener("click", async (e) => {
  notification("⌛ Loading...")
  renderAuctions(activeListings)
  notification("Complete")
})

document.querySelector("#closedListings").addEventListener("click", async (e) => {
  notification("⌛ Loading...")
  renderAuctions(closedListings)
  notification("Complete")
})

document.querySelector("#auctionDisplay").addEventListener("click", async (e) => {
  // Paying Bid Fee
  if (e.target.className.includes("payBidBtn")) {
    $('#auctionModal').modal('hide');
    const index = currentAuctionID
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(auctions[index].biddingFee)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment of ${auctions[index].biddingFee}cUSD for Auction...`)
    try {
      const result4 = await contract.methods
        .payBidFee(index)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 You can now bid for "${auctions[index].itemName}".`)
      //getProducts()
      getAuctions()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }

  $('#button').click(disable);
  if (e.target.className.includes("placeBid")) {
    if (!$('#bidAmount').val()) {
      return;
    }
    $('#auctionModal').modal('hide');
    let bidAmount = document.getElementById("bidAmount").value
    index = currentAuctionID
    notification("⌛ Placing your bid...")
    try {
      const result3 = await contract.methods
        .placeBid(index, bidAmount)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 You have successfully placed a bid for "${auctions[index].itemName}".`)
      renderRecentAuctions()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }

  // Withdrawing Bid Fee
  if (e.target.className.includes("withdrawBidFee")) {
    $('#auctionModal').modal('hide');
    const index = currentAuctionID
    notification(`⌛ Withdrawing funds`)
    try {
      const result2 = await contract.methods
        .withdrawBidFee(index)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 Withdrawal of Bid Fee ${auctions[index].biddingFee}cUSD complete.`)
      getAuctions()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }

  // Settle Auction
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(auctions[index].highestBid)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${auctions[index].itemName}"...`)
    try {
      const result1 = await contract.methods
        .settleAuction(index)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 You successfully bought "${auctions[index].itemName}".`)
      getAuctions()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }

  if (e.target.className.includes("closeModal")) {
    $('#auctionModal').modal('hide');
  }

})


window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await setUser()
  //await getAuctions()
  notification("⌛ Loading...")
  sortListings()
  getRecent()
  renderAuctions(recentAuctions)
  notificationOff()
});
