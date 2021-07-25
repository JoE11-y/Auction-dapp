import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import auctionAbi from '../contract/auction.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const AuctionContractAddress = "0x29FF447f6ee63D397D3480b317776edfFCc88571"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let auctions = []
let contract
let kit


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
      let p = await contract.methods.readProduct(i).call()
      resolve({
        index: i,
        owner: p[0],
        image: p[1],
        itemDetails: p[2],
        startTime: p[3],
        endTime: p[4],
        startPrice: new BigNumber(p[5]),
        biddingFee: new BigNumber(p[6]),
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
    })
}

function auctionTemplate(_auction) {
  return `

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

document
.querySelector("#newAuctionBtn")
.addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newItemDetails").value,
    document.getElementById("newImgUrl").value,
    document.getElementById("auctionEndTime").value,
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


window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getAuctions()
  notificationOff()
});

