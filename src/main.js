import Web3 from 'web3'
import {
  newKitFromWeb3
} from '@celo/contractkit'
import BigNumber from "bignumber.js"
import auctionAbi from '../contract/auction.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const AuctionContractAddress = "0x29FF447f6ee63D397D3480b317776edfFCc88571"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let contract
let kit
let recentAuctions
let currentEventID


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

$(document).ready(()=>{
  $('.close-btn').click(function(){
    notificationOff()
   });
});
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

const setUser = async function(){
  document.getElementById("userAddr").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.innerHTML = renderUserIcon(kit.defaultAccount)
  document.getElementById("userAddr").appendChild(newDiv)
}

const getAuctions = async function() {
  const _auctionsLength = await contract.methods.getAuctionsLength().call()
  const _auctions = []
  for (let i = 0; i >_auctionsLength; i++) {
      let _auction = new Promise(async (resolve, reject) => {
        let p = await contract.methods.getAuction(i).call()
        let q = await contract.methods.hasAuctionStarted(i).call()
        let r = await contract.methods._hasPaidBidFee(i).call()
        let s = await contract.methods.getBidDetails(i).call()
        let t = await contract.methods.hasAuctionEnded(i).call()
        resolve({
          index: i,
          owner: p[0],
          image: p[1],
          itemName: p[2],
          endTime: p[3],
          startPrice: new BigNumber(p[4]),
          biddingFee: new BigNumber(p[5]),
          noOfBids: p[6],
          hasAuctionStarted: q[0],
          remainingTimeTillStart: q[1],
          hasPaidBidFee: r,
          highestBidder: s[0],
          highestBid: s[1],
          hasAuctionEnded: t,
        })
      })
    _auctions.push(_auction)

  }
  auctions = await Promise.all(_auctions)
  renderRecentAuctions()
}


function renderRecentAuctions() {
  let dummy = auctions;
  dummy.push("");
  recentAuctions = dummy.slice(-4, -1);
  document.getElementById("gallery").innerHTML = ""
  recentAuctions.forEach((_auction) => {
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
  setUserID(auctions[index])
  document.getElementById("auctionDisplay").innerHTML = ""
  const newDiv = document.createElement("div")
  newDiv.className = "modal-content"
  newDiv.innerHTML = auctionModalTemplate(auctions[index])
  document.getElementById("auctionDisplay").appendChild(newDiv)
  editAuctionModal(auctions[index])
  $("#auctionModal").modal('show');
  notificationOff()
}

function setUserID(_auction){
  if(kit.defaultAccount == _auction.owner){
    _auction["isUserOwner"] == true;
  }else{
    _auction["isUserOwner"] == false;
  }

  if(_auction.hasAuctionEnded && kit.defaultAccount == _auction.highestBidder){
    _auction["isUserWinner"] == true;
  }else{
    _auction["isUserWinner"] == false;
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
        <div id="bid">
          &emsp;&emsp;<input id="bidAmount" type="text" size="9">&nbsp;cUSD&nbsp;&emsp;&emsp;<button type="button" class="btn btn-dark placeBid">Place bid</button><br>
        </div>
        <div>
          <br>
          <p>&emsp;&emsp;Bid Fee: 10% of starting bid price</p>
          &emsp;&emsp;<button type="button" id="${_auction.index}" class="btn btn-dark payBidBtn">
            Pay Bid Fee
          </button>
          <button type="button" id="withdrawBtn" class="btn btn-dark">
            Withdraw Bid Fee
          </button>
        </div>
      </div>     
    </div>
    <hr>
    <div style="height:400px; background-color:white; overflow:auto">
      <h4 style="padding-top: 20px; padding-left: 20px;">ITEM DETAILS</h4>
      <p style="padding: 20px; margin:auto;">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sed euismod lacus, eget rutrum dolor. Ut placerat nulla a tellus lobortis, ac tincidunt mi viverra. Sed sit amet diam arcu. Etiam tincidunt tincidunt elit, a molestie mauris pretium eu. Suspendisse vitae dolor cursus, elementum leo id, faucibus enim. Vivamus pulvinar, ex a tincidunt pellentesque, odio libero varius ligula, ut porta justo orci vitae nisi. Ut lacinia elit quis finibus gravida. Quisque id eros sit amet elit condimentum rhoncus at at leo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In risus justo, ornare at urna vel, placerat auctor felis. Etiam nibh lorem, fringilla suscipit metus non, commodo placerat neque. Integer tincidunt neque imperdiet bibendum feugiat. Integer fermentum, quam vitae posuere blandit, ante erat ornare nulla, ac dapibus purus dolor congue metus. Nullam et nunc libero. Aliquam gravida, lorem vel accumsan rutrum, tortor orci volutpat purus, at finibus justo tortor id lectus. Vestibulum gravida sapien id enim euismod, sed efficitur erat porttitor.

      Sed semper risus porta pharetra vulputate. Morbi quis metus vel enim viverra pharetra in in sem. Morbi id turpis vitae felis tincidunt porta a condimentum metus. Maecenas tortor lectus, elementum sit amet rutrum ac, ullamcorper in lacus. Phasellus nec ipsum vestibulum velit congue mollis non vitae diam. Vestibulum dui tortor, mattis quis nibh in, ultrices porta sapien. Integer tortor lorem, imperdiet ut aliquet in, pharetra vel sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam feugiat leo eget ligula pulvinar, vitae scelerisque dui faucibus. Donec justo arcu, molestie in metus in, aliquam dictum turpis. Nulla vel nibh placerat, faucibus quam non, dictum magna. Nullam ut mattis eros. Nullam viverra bibendum massa ut porta. Maecenas dolor libero, hendrerit ut sagittis quis, ornare eu est.
      
      Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris tempus lacus eu arcu lobortis consectetur. Cras libero ligula, eleifend non velit ut, venenatis blandit libero. Donec placerat aliquam metus, ac ornare magna pharetra in. In egestas tempor varius. Aenean rhoncus vel nisi tempus aliquam. Etiam in tortor finibus, iaculis velit id, facilisis velit.
      
      Cras dignissim justo sit amet felis venenatis, id facilisis elit euismod. Quisque ac augue consectetur, scelerisque ex at, tempus nulla. Nulla dictum nisl id urna rutrum, in bibendum metus pellentesque. Integer elementum rhoncus purus ut convallis. Phasellus fermentum augue eget nisl aliquam dignissim. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean varius sapien non lectus iaculis venenatis at in velit. Vestibulum nec ligula sed sapien ultrices interdum non a nibh. Maecenas a bibendum nibh. Nunc et massa nisl. Sed mollis erat vitae est convallis, eget commodo neque luctus. Aliquam vitae fermentum orci. Duis vehicula quis ex ut dictum. Vivamus ac risus neque.
      
      Nullam a tortor lorem. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse mollis tempus sem, vel volutpat turpis aliquam a. Nunc vitae tincidunt eros. Pellentesque ut urna quis urna iaculis maximus. Vestibulum nec nisi tempor, sagittis nibh vel, blandit elit. In ultrices euismod porta. Maecenas eleifend egestas ligula at vestibulum. Morbi in sapien gravida, lacinia sem quis, fermentum velit. Fusce rhoncus, urna at placerat lobortis, ante dolor vestibulum dolor, at viverra lectus justo id urna. Suspendisse ornare augue ut porta commodo.
      
      Vivamus sit amet elementum enim. Nunc quis rhoncus magna. Nam urna diam, egestas ac est in, dapibus mollis arcu. Integer gravida semper porttitor. Morbi mauris ipsum, laoreet et porttitor congue, imperdiet at enim. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi ac blandit nibh, vitae viverra velit. Integer semper diam ac placerat fermentum.
      
      Curabitur nec varius orci. Maecenas sollicitudin facilisis orci, ac eleifend leo facilisis id. Phasellus egestas tristique erat. Fusce id mauris mauris. Aenean id ex eget ipsum semper iaculis. Nulla vel tincidunt sapien. Ut at massa elit. Aenean non semper orci. Nullam tempus, felis at tempor vestibulum, dolor ex suscipit mauris, ac bibendum velit sapien vel diam. Quisque finibus purus in neque pulvinar molestie vitae vehicula enim. Suspendisse gravida turpis a tempus auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus.
      
      Sed congue imperdiet nibh non porta. Vivamus elementum sapien non tincidunt placerat. Maecenas scelerisque odio lacus, quis ullamcorper arcu fringilla ac. Sed quis pulvinar nisl. Nunc euismod massa sit amet lacus molestie, et sollicitudin urna efficitur. Suspendisse maximus tempus ligula, quis fermentum nunc pulvinar ut. Cras mattis tellus sit amet tellus vehicula, id porta elit congue. Suspendisse sollicitudin ipsum sed est egestas, sit amet efficitur augue pulvinar.
      
      Ut eu nunc enim. Morbi a mauris metus. Suspendisse odio risus, lacinia vitae convallis id, finibus quis sapien. Pellentesque scelerisque sagittis dictum. Mauris elementum pellentesque tortor sit amet mollis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed dui neque, efficitur eu lacus et, rutrum rhoncus lacus. In quis massa accumsan urna ultrices faucibus. Proin in leo vitae nunc aliquam dapibus in scelerisque lacus. Fusce congue tempus leo, a mattis metus fermentum a. In volutpat pulvinar imperdiet.
      
      Nullam dui magna, lacinia id tincidunt a, efficitur semper est. Curabitur varius diam eros, a tempor elit tincidunt ac. Cras id neque ut mi porttitor aliquet. Duis sit amet turpis ac magna imperdiet vulputate et quis ligula. Suspendisse potenti. Ut tincidunt lacus non mi fringilla imperdiet. Pellentesque venenatis nibh eget eros luctus fermentum. Praesent condimentum efficitur nisi a cursus. Pellentesque dictum orci dolor, vitae auctor urna elementum nec. Vestibulum malesuada ipsum ex, sed pellentesque orci viverra et.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sed euismod lacus, eget rutrum dolor. Ut placerat nulla a tellus lobortis, ac tincidunt mi viverra. Sed sit amet diam arcu. Etiam tincidunt tincidunt elit, a molestie mauris pretium eu. Suspendisse vitae dolor cursus, elementum leo id, faucibus enim. Vivamus pulvinar, ex a tincidunt pellentesque, odio libero varius ligula, ut porta justo orci vitae nisi. Ut lacinia elit quis finibus gravida. Quisque id eros sit amet elit condimentum rhoncus at at leo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In risus justo, ornare at urna vel, placerat auctor felis. Etiam nibh lorem, fringilla suscipit metus non, commodo placerat neque. Integer tincidunt neque imperdiet bibendum feugiat. Integer fermentum, quam vitae posuere blandit, ante erat ornare nulla, ac dapibus purus dolor congue metus. Nullam et nunc libero. Aliquam gravida, lorem vel accumsan rutrum, tortor orci volutpat purus, at finibus justo tortor id lectus. Vestibulum gravida sapien id enim euismod, sed efficitur erat porttitor.

      Sed semper risus porta pharetra vulputate. Morbi quis metus vel enim viverra pharetra in in sem. Morbi id turpis vitae felis tincidunt porta a condimentum metus. Maecenas tortor lectus, elementum sit amet rutrum ac, ullamcorper in lacus. Phasellus nec ipsum vestibulum velit congue mollis non vitae diam. Vestibulum dui tortor, mattis quis nibh in, ultrices porta sapien. Integer tortor lorem, imperdiet ut aliquet in, pharetra vel sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam feugiat leo eget ligula pulvinar, vitae scelerisque dui faucibus. Donec justo arcu, molestie in metus in, aliquam dictum turpis. Nulla vel nibh placerat, faucibus quam non, dictum magna. Nullam ut mattis eros. Nullam viverra bibendum massa ut porta. Maecenas dolor libero, hendrerit ut sagittis quis, ornare eu est.
      
      Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris tempus lacus eu arcu lobortis consectetur. Cras libero ligula, eleifend non velit ut, venenatis blandit libero. Donec placerat aliquam metus, ac ornare magna pharetra in. In egestas tempor varius. Aenean rhoncus vel nisi tempus aliquam. Etiam in tortor finibus, iaculis velit id, facilisis velit.
      
      Cras dignissim justo sit amet felis venenatis, id facilisis elit euismod. Quisque ac augue consectetur, scelerisque ex at, tempus nulla. Nulla dictum nisl id urna rutrum, in bibendum metus pellentesque. Integer elementum rhoncus purus ut convallis. Phasellus fermentum augue eget nisl aliquam dignissim. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean varius sapien non lectus iaculis venenatis at in velit. Vestibulum nec ligula sed sapien ultrices interdum non a nibh. Maecenas a bibendum nibh. Nunc et massa nisl. Sed mollis erat vitae est convallis, eget commodo neque luctus. Aliquam vitae fermentum orci. Duis vehicula quis ex ut dictum. Vivamus ac risus neque.
      
      Nullam a tortor lorem. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse mollis tempus sem, vel volutpat turpis aliquam a. Nunc vitae tincidunt eros. Pellentesque ut urna quis urna iaculis maximus. Vestibulum nec nisi tempor, sagittis nibh vel, blandit elit. In ultrices euismod porta. Maecenas eleifend egestas ligula at vestibulum. Morbi in sapien gravida, lacinia sem quis, fermentum velit. Fusce rhoncus, urna at placerat lobortis, ante dolor vestibulum dolor, at viverra lectus justo id urna. Suspendisse ornare augue ut porta commodo.
      
      Vivamus sit amet elementum enim. Nunc quis rhoncus magna. Nam urna diam, egestas ac est in, dapibus mollis arcu. Integer gravida semper porttitor. Morbi mauris ipsum, laoreet et porttitor congue, imperdiet at enim. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi ac blandit nibh, vitae viverra velit. Integer semper diam ac placerat fermentum.
      
      Curabitur nec varius orci. Maecenas sollicitudin facilisis orci, ac eleifend leo facilisis id. Phasellus egestas tristique erat. Fusce id mauris mauris. Aenean id ex eget ipsum semper iaculis. Nulla vel tincidunt sapien. Ut at massa elit. Aenean non semper orci. Nullam tempus, felis at tempor vestibulum, dolor ex suscipit mauris, ac bibendum velit sapien vel diam. Quisque finibus purus in neque pulvinar molestie vitae vehicula enim. Suspendisse gravida turpis a tempus auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus.
      
      Sed congue imperdiet nibh non porta. Vivamus elementum sapien non tincidunt placerat. Maecenas scelerisque odio lacus, quis ullamcorper arcu fringilla ac. Sed quis pulvinar nisl. Nunc euismod massa sit amet lacus molestie, et sollicitudin urna efficitur. Suspendisse maximus tempus ligula, quis fermentum nunc pulvinar ut. Cras mattis tellus sit amet tellus vehicula, id porta elit congue. Suspendisse sollicitudin ipsum sed est egestas, sit amet efficitur augue pulvinar.
      
      Ut eu nunc enim. Morbi a mauris metus. Suspendisse odio risus, lacinia vitae convallis id, finibus quis sapien. Pellentesque scelerisque sagittis dictum. Mauris elementum pellentesque tortor sit amet mollis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed dui neque, efficitur eu lacus et, rutrum rhoncus lacus. In quis massa accumsan urna ultrices faucibus. Proin in leo vitae nunc aliquam dapibus in scelerisque lacus. Fusce congue tempus leo, a mattis metus fermentum a. In volutpat pulvinar imperdiet.
      
      Nullam dui magna, lacinia id tincidunt a, efficitur semper est. Curabitur varius diam eros, a tempor elit tincidunt ac. Cras id neque ut mi porttitor aliquet. Duis sit amet turpis ac magna imperdiet vulputate et quis ligula. Suspendisse potenti. Ut tincidunt lacus non mi fringilla imperdiet. Pellentesque venenatis nibh eget eros luctus fermentum. Praesent condimentum efficitur nisi a cursus. Pellentesque dictum orci dolor, vitae auctor urna elementum nec. Vestibulum malesuada ipsum ex, sed pellentesque orci viverra et.
      </p>
    </div>
  </div>
</div>

`
}

function editAuctionModal(_auction){
  if(_auction.hasPaidBidFee){
    $(".payBidBtn").addClass('is-hidden')
  }else{
    $("#withdrawBtn").addClass('is-hidden')
    $("#bid").addClass('is-hidden')
  }
  if(_auction.auctionEnded){
    $("#time").addClass('is-hidden')
    $("#bid").addClass('is-hidden')
    $(".payBidBtn").addClass('is-hidden')
  }else{
    $("#ended").addClass('is-hidden')
  }
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

function renderUserIcon(_address){
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

document
  .querySelector("#newAuctionBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newitemName").value,
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
    currentEventID = e.target.id
    renderAuctionModal(currentEventID)
  }
})

document.querySelector("#activeListings").addEventListener("click", async (e) => {
  notification("⌛ Loading...")
  document.getElementById("gallery").innerHTML = ""
})

document.querySelector("#closedListings").addEventListener("click", async (e) => {
  notification("⌛ Loading...")
  document.getElementById("gallery").innerHTML = ""
})

document.querySelector("#auctionDisplay").addEventListener("click", async (e) => {
  if (e.target.className.includes("payBidBtn")) {
    $('#auctionModal').modal('hide');
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(auctions[index].biddingFee)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment of ${auctions[index].biddingFee}cUSD for Auction...`)
    try {
      const result = await contract.methods
        .payBidFee(index)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 You can now bid for "${auctions[index].itemName}".`)
      //getProducts()
      renderRecentAuctions()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
  if (e.target.className.includes("closeModal")) {
    $('#auctionModal').modal('hide');
  }
  if (e.target.className.includes("placeBid")) {
    $('#auctionModal').modal('hide');
    let bidAmount = document.getElementById("bidAmount").value
    index = currentEventID
    notification("⌛ Waiting for payment approval...")
    try {
      const result = await contract.methods
        .placeBid(index, bidAmount)
        .send({
          from: kit.defaultAccount
        })
      notification(`🎉 You can have successfully bid for "${auctions[index].itemName}".`)
      renderRecentAuctions()
    }catch (error) {
      notification(`⚠️ ${error}.`)
    }

  }
  
  if (e.target.className.includes("withdrawBtn")) {
    $('#auctionModal').modal('hide');
  }
})

window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await setUser()
  //await getRecentAuctions()
  notification("⌛ Loading...")
  renderRecentAuctions()
  notificationOff()
});
