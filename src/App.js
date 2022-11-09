import React, { useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract } from "ethers";
import FlipperContract from "./contracts/Flipper.json";
import Uik from "@reef-defi/ui-kit";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";

const FactoryAbi = FlipperContract.abi;
const factoryContractAddress = FlipperContract.address;

const URL = "wss://rpc-testnet.reefscan.com/ws";

function App() {
  const [getBool, setGetBool] = useState(null);
  const [signer, setSigner] = useState();
  const [isWalletConnected, setWalletConnected] = useState(false);

  const checkExtension = async () => {
    let allInjected = await web3Enable("Reef");

    if (allInjected.length === 0) {
      return false;
    }

    let injected;
    if (allInjected[0] && allInjected[0].signer) {
      injected = allInjected[0].signer;
    }

    const evmProvider = new Provider({
      provider: new WsProvider(URL),
    });

    evmProvider.api.on("ready", async () => {
      const allAccounts = await web3Accounts();

      allAccounts[0] && allAccounts[0].address && setWalletConnected(true);

      console.log(allAccounts);

      const wallet = new Signer(evmProvider, allAccounts[0].address, injected);

      // Claim default account
      if (!(await wallet.isClaimed())) {
        console.log(
          "No claimed EVM account found -> claimed default EVM account: ",
          await wallet.getAddress()
        );
        await wallet.claimDefaultAccount();
      }

      setSigner(wallet);
    });
  };

  const checkSigner = async () => {
    if (!signer) {
      await checkExtension();
    }
    return true;
  };

  const getFlip = async () => {
    await checkSigner();
    const factoryContract = new Contract(
      factoryContractAddress,
      FactoryAbi,
      signer
    );
    const result = await factoryContract.get();
    console.log(result);
    setGetBool(result);
  };

  const flip = async () => {
    await checkSigner();
    const factoryContract = new Contract(
      factoryContractAddress,
      FactoryAbi,
      signer
    );
    await factoryContract.flip();
    getFlip();
  };

  return (
    <Uik.Container className="main">
      <Uik.Container vertical>
        <Uik.Container>
          <Uik.ReefLogo /> <Uik.Text text="Flipper Workshop" type="headline" />
        </Uik.Container>
        {isWalletConnected ? (
          <>
            <br />
            <Uik.Card>
              <Uik.Container flow="spaceBetween">
                <Uik.Container flow="start">
                  <Uik.Text
                    text={
                      <a
                        target={"_blank"}
                        rel="noopener noreferrer"
                        href={`https://testnet.reefscan.com/contract/${factoryContractAddress}`}
                      >
                        Flipper value{" "}
                      </a>
                    }
                    type="lead"
                  />
                  <Uik.Tag
                    text={
                      getBool !== null
                        ? getBool.toString()
                        : "Nothing on contract yet | Click Get"
                    }
                    color={getBool === null ? "" : getBool ? "green" : "red"}
                  />
                </Uik.Container>
                <Uik.Container flow="end">
                  <Uik.Button onClick={flip} text="Flip" icon={faRepeat} />
                  <Uik.Button onClick={getFlip} text="Get" icon={faArrowDown} />
                </Uik.Container>
              </Uik.Container>
            </Uik.Card>
          </>
        ) : (
          <>
            <br />
            <Uik.Button text="Connect Wallet" onClick={checkExtension} />
          </>
        )}
      </Uik.Container>
    </Uik.Container>
  );
}

export default App;
