import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import auctionAbi from '../contract/auction.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const AuctionContractAddress = "0x29FF447f6ee63D397D3480b317776edfFCc88571"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let contract
let kit

const auctions = [
  {
    name: "Giant BBQ",
    image: "https://i.imgur.com/yPreV19.png",
    itemDetails: `Grilled chicken, beef, fish, sausages, bacon, 
      vegetables served with chips.`,
    location: "Kimironko Market",
    owner: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
    endTime: 23492875,
    noOfBids: 27,
    index: 0,
    startPrice: 100,
    highestBid: 100,
    hasAuctionStarted: true,
    remainingTimeTillStart: 0,
  },
  {
    name: "BBQ Chicken",
    image: "https://i.imgur.com/NMEzoYb.png",
    itemDetails: `French fries and grilled chicken served with gacumbari 
      and avocados with cheese.`,
    location: "Afrika Fresh KG 541 St",
    owner: "0x3275B7F400cCdeBeDaf0D8A9a7C8C1aBE2d747Ea",
    endTime: 40000000,
    noOfBids: 12,
    index: 1,
    startPrice: 200,
    highestBid: 200,
    hasAuctionStarted: true,
    remainingTimeTillStart: 0,
  },
  {
    name: "Beef burrito",
    image: "https://i.imgur.com/RNlv3S6.png",
    itemDetails: `Homemade tortilla with your choice of filling, cheese, 
      guacamole salsa with Mexican refried beans and rice.`,
    location: "Asili - KN 4 St",
    owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
    endTime: 36743893,
    noOfBids: 35,
    index: 2,
    startPrice:300,
    highestBid: 300,
    hasAuctionStarted: false,
    remainingTimeTillStart: 86400,
  },
  {
    name: "Barbecue Pizza",
    image: "https://i.imgur.com/fpiDeFd.png",
    itemDetails: `Barbecue Chicken Pizza: Chicken, gouda, pineapple, onions 
      and house-made BBQ sauce.`,
    location: "Kigali Hut KG 7 Ave",
    owner: "0x2EF48F32eB0AEB90778A2170a0558A941b72BFFb",
    endTime: 23492735,
    noOfBids: 2,
    index: 3,
    startPrice: 400,
    highestBid: 400,
    hasAuctionStarted: false,
    remainingTimeTillStart: 50000,
  },
]

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

const connectCeloWallet = async function () {
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
    .send({ from: kit.defaultAccount })
  return result
}


const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}


const getAuctions = async function() {
  const _auctionsLength = await contract.methods.getAuctionsLength().call()
  const _auctions = []
  for (let i = 0; i < _auctionsLength; i++) {
    let _auction = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getAuction(i).call()
      let q = await contract.methods.hasAuctionStarted(i).call()
      resolve({
        index: i,
        owner: p[0],
        image: p[1],
        itemDetails: p[2],
        endTime: p[3],
        startPrice: new BigNumber(p[4]),
        biddingFee: new BigNumber(p[5]),
        noOfBids: p[6],
        hasAuctionStarted: q[0],
        remainingTimeTillStart: q[1],
      })
    })
    _auctions.push(_auction)
  }
  auctions = await Promise.all(_auctions)
  renderAuctions()
}

function renderAuctions() {
    document.getElementById("gallery").innerHTML = ""
    auctions.forEach((_auction) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = auctionTemplate(_auction)
      document.getElementById("gallery").appendChild(newDiv)
      editAuction(_a)
    })
}

function editAuction(_auction) {
  if (_auction.hasAuctionStarted){ 
     $("#starts").addClass('is-hidden')
  }else{
    $("#ends").addClass('is-hidden')
  }
}

function checkTime(_auction){
  var endingTime = _auction.endTime;
  var remainingTime = _auction.remainingTimeTillStart;
  if(_auction.hasAuctionStarted){
    var seconds = parseInt(endingTime, 10);
    var days = Math.floor(seconds / (3600*24));
    seconds  -= days*3600*24;
    var hrs   = Math.floor(seconds / 3600);
    return `
    <span> Auction Ends in ${days}d ${hrs}h</span>
  `
  } else{
    var seconds = parseInt(remainingTime, 10);
    var days = Math.floor(seconds / (3600*24));
    seconds  -= days*3600*24;
    var hrs   = Math.floor(seconds / 3600);
    return `
    <span> Auction Starts in ${hrs}h</span>
  `
  }
  
}

function convertDays(_days){
  var seconds = Math.floor(_time * 24 * 3600);
  return seconds;
}

function auctionTemplate(_auction) {
  return `
  <div class="card mb-4">
  <img class="card-img-top" src="${_auction.image}" alt="...">
  <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
  <i class="far fa-handshake"></i>&nbsp;${_auction.noOfBids} Bids
  </div>
  <div class="card-body text-left p-4 position-relative">
    <div class="translate-middle-y position-absolute top-0">
    ${identiconTemplate(_auction.owner)}
    </div>
    <h6 class="card-title fs-4 fw-bold mt-2" style="min-height: 120px; text-transform:uppercase;">
    ${_auction.itemDetails}
    </h6>
    <h3 class="card-text mt-4">
      $${_auction.highestBid}
    </h3>
    <p class="card-text mt-4" id="starts">
    <i class="fas fa-hourglass-half"></i>&nbsp;
      ${checkTime(_auction.remainingTimeTillStart)}
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
  $("#auctionModal").modal('show');
  notificationOff()
}

function auctionModalTemplate(_auction){ 
    return`
    <div class="modal-content" style="background-color: rgb(171, 161, 163);">
          <div class="modal-header">
            <h5 class="modal-title" id="auctionTitle">Auction name</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="background-color: rgb(171, 161, 163); display: flex; overflow: hidden; height: 500px; width: max-content">
            <div id="carouselExampleIndicators" class="carousel slide carousel-fade" data-mdb-ride="carousel" style="background-color: rgb(171, 161, 163); height:max-content; float:left; padding: 10px; width: max-content;">
              <div class="carousel-indicators">
                <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-mdb-target="#carouselExampleIndicators" data-mdb-slide-to="2" aria-label="Slide 3"></button>
              </div>
              <div class="carousel-inner large">
                <div class="carousel-item active">
                  <img src="https://mdbootstrap.com/img/new/slides/041.jpg" class="d-block w-100" alt="..." />
                </div>
                <div class="carousel-item">
                  <img src="https://mdbootstrap.com/img/new/slides/042.jpg" class="d-block w-100" alt="..." />
                </div>
                <div class="carousel-item">
                  <img src="https://mdbootstrap.com/img/new/slides/043.jpg" class="d-block w-100" alt="..." />
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
   
   
            <div style="text-align: left; padding: 20px; height: 500px; float: left; width: 500px;">
              <div>
                <h1>
                  &ensp;Item Details
                </h1>
              </div>
              <hr>
              <div>
                <p>&emsp;&emsp;Starts in:</p>
              </div>
              <div class="is-hidden">
                <p>&emsp;&emsp;Time Left:</p>
              </div>
              <div class="is-hidden">
                <p>&emsp;&emsp;Time Left: Listing has Ended</p>
              </div>
              <hr>
              <div>
                <p>&emsp;&emsp;Start Price:&ensp;US $100.00</p>
                <p>&emsp;&emsp;Current Bid:&ensp;US $100.00</p>
              </div>
              <div class="is-hidden">
                &emsp;&emsp;<input type="text"> <button type="button" class="btn btn-dark">Place bid</button><br>
              </div>
              <div>
                <br>
                <p>&emsp;&emsp;Bid Fee: 10% of starting bid price</p>
                &emsp;&emsp;<button type="button" class="btn btn-dark">
                  Pay Bid Fee
                </button>
                &emsp;&emsp;<button type="button" class="btn btn-dark is-hidden">
                  Withdraw Bid Fee
                </button>
              </div>
            </div>
          </div>
        </div>

`}

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

document
.querySelector("#newAuctionBtn")
.addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newItemDetails").value,
    document.getElementById("newImgUrl").value,
    convertDays(document.getElementById("auctionEndTime").value),
    new BigNumber(document.getElementById("startPrice").value)
    .shiftedBy(ERC20_DECIMALS)
    .toString()
  ]
  notification(`⌛ Adding New Auction...`)
  try {
    const result = await contract.methods
      .createAuction(...params)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(`🎉 You successfully added a new auction.`)
  getAuctions()
})

document.querySelector("#gallery").addEventListener("click", async (e) => {
  if (e.target.className.includes("viewAuction")) {
    const index = e.target.id
    renderAuctionModal(index)
  }
})

window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  //await getAuctions()
  renderAuctions()
  notificationOff()
});

