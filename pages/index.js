// ENS Lookup App with Basic & Advanced Mode + Dark Mode + Social Tags + Animations

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import axios from 'axios';

export default function Home() {
  const [input, setInput] = useState('');
  const [ensData, setEnsData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    let address = input;
    try {
      if (input.endsWith(".eth")) {
        address = await provider.resolveName(input);
        if (!address) throw new Error("ENS name could not be resolved.");
      }

      const ensName = await provider.lookupAddress(address);
      let resolver = null;
      let avatar = null;
      let bio = null;
      let twitter = null;
      let btc = null;
      let ltc = null;
      let records = {};

      if (ensName) {
        resolver = await provider.getResolver(ensName);
      }

      if (resolver) {
        avatar = await resolver.getText("avatar").catch(() => null);
        bio = await resolver.getText("description").catch(() => null);
        twitter = await resolver.getText("com.twitter").catch(() => null);
        btc = await resolver.getAddress(0).catch(() => null);
        ltc = await resolver.getAddress(2).catch(() => null);
        records = isAdvanced ? await resolver.getTexts(["url", "email", "com.discord"]).catch(() => ({})) : {};
      }

      const txs = isAdvanced ? await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`) : { data: { result: [] } };

      const balance = isAdvanced ? await provider.getBalance(address) : null;

      const nftResult = isAdvanced ? await axios.get(
        `${process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL}/getNFTs?owner=${address}`
      ) : { data: { ownedNfts: [] } };

      setEnsData({ ensName, address, avatar, bio, twitter, btc, ltc, records });
      setWalletData({ balance, txs: txs.data.result });
      setNfts(nftResult.data.ownedNfts);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check the ENS name or address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? "dark bg-[#0e0e11] text-white" : "bg-gradient-to-br from-[#f5f5ff] to-[#eef2ff] text-[#1a1a1a]"}>
      <Head>
        <title>ENS Lookup Tool</title>
        <meta property="og:title" content="ENS Name Lookup" />
        <meta property="og:description" content="Look up ENS details, wallet activity, and NFTs in one click." />
        <meta property="og:image" content="https://ens.domains/media/ens-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <main className="min-h-screen p-6 max-w-2xl mx-auto font-sans transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-1">🔍 ENS Name Lookup</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Built by <a href="https://app.ens.domains/wesd.eth" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-medium underline">wesd.eth</a></p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="text-xs border px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div className="mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter ENS or address"
            className="p-3 border border-gray-300 dark:border-gray-700 w-full rounded-md shadow-sm bg-white dark:bg-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium">Advanced Mode:</label>
          <input
            type="checkbox"
            checked={isAdvanced}
            onChange={() => setIsAdvanced(!isAdvanced)}
            className="accent-blue-600"
          />
        </div>

        <button
          onClick={handleLookup}
          className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded-md shadow"
          disabled={loading}
        >
          {loading ? "Loading..." : "Lookup"}
        </button>

        {ensData && (
          <div className="mt-6 border border-gray-300 dark:border-gray-700 p-4 rounded-md bg-white dark:bg-gray-900 shadow animate-fade-in">
            <h2 className="text-xl font-semibold mb-2">{ensData.ensName || ensData.address}</h2>
            {ensData.avatar && <img src={ensData.avatar} alt="avatar" className="w-16 h-16 rounded-full mb-2" />}
            <p><strong>Bio:</strong> {ensData.bio}</p>
            <p><strong>Twitter:</strong> {ensData.twitter}</p>
            <p><strong>BTC:</strong> {ensData.btc}</p>
            <p><strong>LTC:</strong> {ensData.ltc}</p>
            {isAdvanced && (
              <>
                <h3 className="mt-4 font-bold">Records</h3>
                <ul className="list-disc list-inside text-sm">
                  {Object.entries(ensData.records).map(([key, val]) => (
                    <li key={key}><strong>{key}:</strong> {val}</li>
                  ))}
                </ul>
                <h3 className="mt-4 font-bold">ETH Balance</h3>
                <p>{walletData?.balance ? ethers.formatEther(walletData.balance) + " ETH" : "N/A"}</p>
                <h3 className="mt-4 font-bold">Recent Transactions</h3>
                <ul className="list-decimal list-inside text-sm">
                  {walletData?.txs.slice(0, 5).map((tx, i) => (
                    <li key={i}>{tx.hash.slice(0, 10)}... - {tx.value / 1e18} ETH</li>
                  ))}
                </ul>
                <h3 className="mt-4 font-bold">NFTs</h3>
                <div className="grid grid-cols-2 gap-4">
                  {nfts.slice(0, 4).map((nft, i) => (
                    <div key={i} className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                      <img src={nft.media?.[0]?.gateway || nft.metadata?.image} alt={nft.title || nft.metadata?.name} className="w-full h-32 object-cover rounded" />
                      <p className="text-xs mt-2 text-center">{nft.title || nft.metadata?.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
