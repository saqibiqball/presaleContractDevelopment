import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SoftTokenPresaleABI from '../abis/SoftTokenPresaleABI.json'; // Import the ABI for your presale contract
import BEP20TokenABI from '../abis/BEP20TokenABI.json'; // Import the ABI for your token contract

const PresaleComponent = () => {
    const [web3, setWeb3] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [presaleContract, setPresaleContract] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenBalance, setTokenBalance] = useState(0);
    const [ethBalance, setEthBalance] = useState(0);
    const [buyAmount, setBuyAmount] = useState(0);
    const [presaleTime, setPresaleTime] = useState(null);
    const [totalTokens, setTotalTokens] = useState(0);
    const [tokensSold, setTokensSold] = useState(0);

    const presaleContractAddress = '0xd93fe0f13c552c0bd8b44894e07aad1ec5969624';
    const tokenAddress = '0x7971DB718685Bd2FB9de43de3d04B3fD2cBD3533';

    const connectWallet = () => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            window.ethereum.enable().then(() => {
                web3Instance.eth.getAccounts().then((accs) => {
                    if (accs.length > 0) {
                        setAccounts(accs);
                    }
                });
            });
        }
    };

    useEffect(() => {

        if (accounts.length > 0) {
            const acc = accounts[0];

            web3.eth.getBalance(acc).then((balance) => {
                setEthBalance(web3.utils.fromWei(balance, 'ether'));
            });

            const presaleContract = new web3.eth.Contract(SoftTokenPresaleABI, presaleContractAddress);
            setPresaleContract(presaleContract);


            const tokenContract = new web3.eth.Contract(BEP20TokenABI, tokenAddress);
            setTokenContract(tokenContract);


            tokenContract.methods.balanceOf(acc).call().then((balance) => {
                setTokenBalance(Number(balance));
            });

            tokenContract.methods.name().call().then((name) => {
                setTokenName(name);
            });

            tokenContract.methods.symbol().call().then((symbol) => {
                setTokenSymbol(symbol);
            });

            tokenContract.methods.totalSupply().call().then((supply) => {
                setTotalTokens(Number(supply));
            });


            presaleContract.methods.presaleStartTime().call().then((startTime) => {
                const startTimeNumber = Number(startTime.toString());
                setPresaleTime(new Date(startTimeNumber * 1000).toString());
            });

            presaleContract.methods.tokensSold().call().then((sold) => {
                setTokensSold(Number(sold));
            });



        }
    }, [accounts]);


    const handleBuyTokens = async () => {
        if (presaleContract && accounts.length > 0) {
            try {
                const buyAmountWei = web3.utils.toWei(buyAmount.toString(), 'ether');
                await presaleContract.methods.buyTokens(buyAmountWei).send({ from: accounts[0], value: buyAmountWei });


                // Refresh token and ETH balances
                const tokenBalance = await tokenContract.methods.balanceOf(accounts[0]).call();
                setTokenBalance(tokenBalance);
                const ethBalance = await web3.eth.getBalance(accounts[0]);
                setEthBalance(web3.utils.fromWei(ethBalance, 'ether'));

                // Refresh tokens sold
                const tokensSold = await presaleContract.methods.tokensSold().call();
                setTokensSold(tokensSold);
            } catch (error) {
                console.error('Error buying tokens:', error);
            }
        }
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '20px', marginRight: '20px' }}>
                <h2>Soft Presale</h2>
                <button style={{
                    border: 'none',
                    cursor: 'pointer',

                }} onClick={connectWallet}>{accounts[0] ? accounts[0].slice(0, 5) + '...' + accounts[0].slice(-4) : 'Connect Wallet'}</button>
            </div>
            {accounts.length > 0 && (
                <div>
                    <p>Connected Account: {accounts[0].slice(0, 5) + '...' + accounts[0].slice(-4)}</p>
                    <p>wallet Balance: {ethBalance} tBNB</p>

                    <p>Token Name: {tokenName}</p>
                    <p>Token Symbol: {tokenSymbol}</p>
                    <p>Token Balance: {tokenBalance}</p>
                    <p>Presale Time: {presaleTime}</p>
                    <p>Total Tokens: {totalTokens}</p>
                    <p>Tokens Sold: {tokensSold}</p>
                    <p>Remaining Tokens: {totalTokens - tokensSold}</p>
                    <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                    />
                    <button onClick={handleBuyTokens}>Buy Tokens</button>
                </div>
            )}
        </div>
    );
};

export default PresaleComponent;
