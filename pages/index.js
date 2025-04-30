
// ENS Lookup App with Basic & Advanced Mode
// Full Version Scaffold using Next.js and Tailwind

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

export default function Home() {
  const [input, setInput] = useState('');
  const [ensData, setEnsData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/demo");
    let address = input;
    try {
      if (input.endsWith(".eth")) {
        address = await provider.resolveName(input);
      }
      const ensName = await provider.lookupAddress(address);
      const resolver = await provider.getResolver(ensName);
      const avatar = await resolver.getText("avatar");
      const bio = await resolver.getText("description");
      const twitter = await resolver.getText("com.twitter");
      const btc = await resolver.getAddress(0);
      const ltc = await resolver.getAddress(2);
      const records = isAdvanced ? await resolver.getTexts(["url", "email", "com.discord"]) : {};

      const txs = isAdvanced ? await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=YourApiKey`) : { data: { result: [] } };

      const balance = isAdvanced ? await provider.getBalance(address) : null;

      const nftResult = isAdvanced ? await axios.get(`https://api.opensea.io/api/v1/assets?owner=${address}`) : { data: { assets: [] } };

      setEnsData({ ensName, address, avatar, bio, twitter, btc, ltc, records });
      setWalletData({ balance, txs: txs.data.result });
      setNfts(nftResult.data.assets);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check the ENS name or address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 ENS Name Lookup</h1>

      <div className="mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter ENS or address"
          className="p-2 border w-full rounded"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label>Advanced Mode:</label>
        <input
          type="checkbox"
          checked={isAdvanced}
          onChange={() => setIsAdvanced(!isAdvanced)}
        />
      </div>

      <button
        onClick={handleLookup}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Lookup"}
      </button>

      {ensData && (
        <div className="mt-6 border p-4 rounded">
          <h2 className="text-xl font-semibold">{ensData.ensName || ensData.address}</h2>
          {ensData.avatar && <img src={ensData.avatar} alt="avatar" className="w-16 h-16" />}
          <p><strong>Bio:</strong> {ensData.bio}</p>
          <p><strong>Twitter:</strong> {ensData.twitter}</p>
          <p><strong>BTC:</strong> {ensData.btc}</p>
          <p><strong>LTC:</strong> {ensData.ltc}</p>
          {isAdvanced && (
            <>
              <h3 className="mt-4 font-bold">Records</h3>
              <ul>
                {Object.entries(ensData.records).map(([key, val]) => (
                  <li key={key}><strong>{key}:</strong> {val}</li>
                ))}
              </ul>
              <h3 className="mt-4 font-bold">ETH Balance</h3>
              <p>{walletData?.balance ? ethers.formatEther(walletData.balance) + " ETH" : "N/A"}</p>
              <h3 className="mt-4 font-bold">Recent Transactions</h3>
              <ul>
                {walletData?.txs.slice(0, 5).map((tx, i) => (
                  <li key={i}>{tx.hash.slice(0, 10)}... - {tx.value / 1e18} ETH</li>
                ))}
              </ul>
              <h3 className="mt-4 font-bold">NFTs</h3>
              <div className="grid grid-cols-2 gap-2">
                {nfts.slice(0, 4).map((nft, i) => (
                  <div key={i} className="border p-2 rounded">
                    <img src={nft.image_url} alt={nft.name} className="w-full h-32 object-cover" />
                    <p className="text-sm mt-1">{nft.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
