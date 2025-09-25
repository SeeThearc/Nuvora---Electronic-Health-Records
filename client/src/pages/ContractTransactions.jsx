import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const ETHERSCAN_API_KEY = "6S615MA4SN2ZSZQ6C426K5F2WNKKWSKFSD";
const CONTRACT_ADDRESS = "0x57F51278F2659F12365dE11c2cD21752dEd9042b";

// Replace with your full contract ABI
const CONTRACT_ABI = [
  "function setValue(uint256 value)",
  "function transfer(address to, uint256 amount)",
  "event ValueChanged(address indexed by, uint256 newValue)"
];

const ContractTransactions = () => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true);

        // Fetch logs from Etherscan
        const logsUrl = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${CONTRACT_ADDRESS}&apikey=${ETHERSCAN_API_KEY}`;
        const res = await fetch(logsUrl);
        const data = await res.json();

        if (data.status !== "1") {
          console.log("No logs found or API returned 0:", data.message);
          setTxs([]);
          return;
        }

        const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/4-ErAkY6Vq40gJV2u3jaK");
        const iface = new ethers.Interface(CONTRACT_ABI);

        const formattedTxs = await Promise.all(
          data.result.map(async (log) => {
            // Convert blockNumber from hex to decimal
            const blockNumberDecimal = parseInt(log.blockNumber, 16);

            let decodedEvent = null;
            try {
              decodedEvent = iface.parseLog(log);
            } catch (err) {
              decodedEvent = null;
            }

            let txData = null;
            let timestamp = null;
            let methodName = null;

            try {
              const tx = await provider.getTransaction(log.transactionHash);
              const block = await provider.getBlock(blockNumberDecimal);

              timestamp = new Date(block.timestamp * 1000).toLocaleString();

              // Decode function name
              try {
                const parsedTx = iface.parseTransaction({ data: tx.data });
                methodName = parsedTx.name;
              } catch (err) {
                methodName = null;
              }

              txData = {
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                input: tx.data,
              };
            } catch (err) {
              txData = null;
            }

            return {
              hash: log.transactionHash,
              blockNumber: blockNumberDecimal,
              timestamp,
              decodedEvent,
              txData,
              methodName,
            };
          })
        );

        // Sort by block number descending
        formattedTxs.sort((a, b) => b.blockNumber - a.blockNumber);

        setTxs(formattedTxs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
  }, []);

  return (
    <div>
      <h1>Contract Interactions for {CONTRACT_ADDRESS}</h1>
      {loading ? (
        <p>Loading transactions...</p>
      ) : txs.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul>
          {txs.map((tx) => (
            <li key={tx.hash + tx.blockNumber}>
              <p><strong>Transaction Hash:</strong> {tx.hash}</p>
              <p><strong>Block Number:</strong> {tx.blockNumber}</p>
              <p><strong>Timestamp:</strong> {tx.timestamp}</p>
              {tx.methodName && <p><strong>Method Name:</strong> {tx.methodName}</p>}
              {tx.txData && (
                <>
                  <p><strong>From:</strong> {tx.txData.from}</p>
                  <p><strong>To:</strong> {tx.txData.to}</p>
                  <p><strong>Value:</strong> {tx.txData.value} ETH</p>
                  <p><strong>Input Data:</strong> {tx.txData.input}</p>
                </>
              )}
              {tx.decodedEvent && (
                <>
                  <p><strong>Event Name:</strong> {tx.decodedEvent.name}</p>
                  <p><strong>Event Args:</strong> {JSON.stringify(tx.decodedEvent.args)}</p>
                </>
              )}
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContractTransactions;
