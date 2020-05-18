import React, { useEffect } from "react";
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3'
import Biconomy from "@biconomy/mexa";
const { config } = require("./config");

const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

const metaTransactionType = [
  { name: "holder", type: "address" },
  { name: "nonce", type: "uint256" }
];

let domainData = {
  name: "Compound-DApp",
  version: "1",
  chainId: "42", // Kovan
  verifyingContract: config.contract.address
};

let web3;
let contract;
let biconomy;
function App() {

  useEffect(() => {
    if (!window.ethereum) {
      alert("Metamask is required to use this DApp")
      return;
    }
    console.log(window.ethereum.networkVersion)
    if (window.ethereum.networkVersion != 42) {
      alert("Switch to Kovan Network")
    }
    biconomy = new Biconomy(window.ethereum, { apiKey: "GwiBC__tc.8c503ac0-dc5f-4e57-a738-fb44ca54847c" });
    web3 = new Web3(biconomy);
    biconomy.onEvent(biconomy.READY, async () => {
      // Initialize your dapp here like getting user accounts etc
      await window.ethereum.enable();
      contract = new web3.eth.Contract(config.contract.abi, config.contract.address);
      setTimeout(() => {
        startApp();
      }, 1000)
    }).onEvent(biconomy.ERROR, (error, message) => {
      // Handle error while initializing mexa
      console.log(error)
    });
  }, []);

  async function startApp() {
    const nonce = await contract.methods.nonces(window.ethereum.selectedAddress).call();
    let message = {
      holder: window.ethereum.selectedAddress,
      nonce: parseInt(nonce),
    };

    const dataToSign = JSON.stringify({
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message
    });

    window.web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        id: 999999999999,
        method: "eth_signTypedData_v4",
        params: [window.ethereum.selectedAddress, dataToSign]
      },
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        const signature = result.result.substring(2);
        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = parseInt(signature.substring(128, 130), 16);

        (async function withdraw() {
          console.log("USER ADDRESS:", window.ethereum.selectedAddress);
          console.log("SIGNATURE:", signature);
          const promiEvent = contract.methods.withdraw(window.ethereum.selectedAddress, nonce, r, s, v).send({ from: window.ethereum.selectedAddress })
          promiEvent.on("transactionHash", (hash) => {
            console.log("Meta transaction Sent!")
            console.log("Transaction Hash is ", hash)
          }).once("confirmation", (confirmationNumber, receipt) => {
            if (receipt.status) {
              console.log("Transaction Processed Successfully!")
            } else {
              console.log("Transaction Failed!")
            }
            console.log(receipt)
          })

        })();
      }
    );
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
