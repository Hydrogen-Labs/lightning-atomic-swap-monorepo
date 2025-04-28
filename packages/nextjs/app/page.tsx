"use client";

import { useEffect, useRef, useState } from "react";
import "../styles/bg.css";
import "../styles/glowButton.css";
import { useAccount } from "wagmi";
import ConnectedInterface from "~~/components/ConnectedInterface";
import ConnectionPrompt from "~~/components/ConnectionPrompt";
import { useGlobalState } from "~~/services/store/store";

const Home = () => {
  const { account } = useGlobalState();
  const [showConnected, setShowConnected] = useState(false);

  useEffect(() => {
    if (account) {
      // Add a slight delay before showing the connected interface
      const timer = setTimeout(() => {
        setShowConnected(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowConnected(false);
    }
  }, [account]);

  return (
    <>
      <div className="bg-wrapper">
        <div className="bg-oval-gradient bg-gradient-to-r from-yellow-400 to-violet-800 opacity-40" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-80 h-80 bg-violet-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl" />
        </div>
      </div>
      <div className="font-plex container mx-auto flex h-[calc(100vh-160px)] items-center justify-center py-8 px-4">
        <div className="card w-full max-w-5xl h-full flex flex-col">
          <div
            className={`transition-opacity duration-300 ${
              account ? (showConnected ? "opacity-100" : "opacity-0") : "opacity-0"
            } ${!account && "hidden"}`}
          >
            {account && <ConnectedInterface account={account} />}
          </div>
          <div
            className={`transition-opacity duration-300 ${!account ? "opacity-100" : "opacity-0"} ${
              account && "hidden"
            }`}
          >
            {!account && <ConnectionPrompt />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
