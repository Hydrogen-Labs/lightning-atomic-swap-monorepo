import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ConnectionPrompt = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 md:px-8 max-w-4xl mx-auto mt-16">
      <div className="w-full max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-4 tracking-tight relative">
          <span className="bg-gradient-to-r from-violet-400 to-purple-500 text-transparent bg-clip-text tracking-wide">
            Lightning Botanix
          </span>{" "}
          <span className="font-normal text-white tracking-wide relative">Bridge</span>
          <span className="absolute -inset-1 bg-violet-500/10 blur-xl opacity-30 rounded-lg -z-10"></span>
        </h2>
        <p className="text-lg text-gray-300 mb-6 md:mb-8 max-w-2xl font-light">
          A secure gateway between the Lightning Network and Botanix
        </p>

        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <div className="relative">
              {isHovering && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg blur-md opacity-70 group-hover:opacity-100 transition duration-200 -z-10"></div>
                  <div className="absolute -inset-1 animate-pulse bg-blue-500/20 rounded-lg blur-sm -z-10"></div>
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg -z-10">
                    <div className="w-full h-0.5 bg-blue-500/30 absolute lightning-bolt-1"></div>
                    <div className="w-full h-0.5 bg-blue-500/30 absolute lightning-bolt-2"></div>
                  </div>
                </>
              )}
              <button
                onClick={openConnectModal}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={`w-full py-4 text-base font-medium ${
                  isHovering
                    ? "bg-gradient-to-r from-blue-900 to-blue-800 text-blue-100 border-blue-500/50"
                    : "bg-neutral-800/70 text-white border-white/10"
                } rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md border relative overflow-hidden z-0`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`h-5 w-5  transition-all duration-300`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                  />
                </svg>
                Connect Wallet to Continue
                {isHovering && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-70">
                    <div className="lightning-zigzag lightning-zigzag-1"></div>
                    <div className="lightning-zigzag lightning-zigzag-2"></div>
                    <div className="lightning-zigzag lightning-zigzag-3"></div>
                    <div className="lightning-spark lightning-spark-1"></div>
                    <div className="lightning-spark lightning-spark-2"></div>
                    <div className="lightning-spark lightning-spark-3"></div>
                    <div className="lightning-spark lightning-spark-4"></div>
                  </div>
                )}
              </button>
            </div>
          )}
        </ConnectButton.Custom>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
        <div className="bg-neutral-900/50 backdrop-blur-md p-8 rounded-lg shadow-xl border border-white/5 hover:border-violet-500/20 transition-all duration-300">
          <div className="flex flex-col items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-violet-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            <h3 className="font-medium text-lg text-white mb-2">Fast Settlement</h3>
            <p className="text-gray-300 text-center font-light">
              Experience near-instant transfers between Bitcoin Lightning Network and Botanix
            </p>
          </div>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-md p-8 rounded-lg shadow-xl border border-white/5 hover:border-yellow-500/20 transition-all duration-300">
          <div className="flex flex-col items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-yellow-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <h3 className="font-medium text-lg text-white mb-2">Security</h3>
            <p className="text-gray-300 text-center font-light">
              Trustless atomic swaps with Hash Time Locked Contracts
            </p>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes lightning {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes zap {
          0% {
            transform: translateX(-100%) rotate(20deg);
          }
          100% {
            transform: translateX(100%) rotate(20deg);
          }
        }

        .lightning-bolt-1 {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          animation: zap 2s infinite linear;
        }

        .lightning-bolt-2 {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          animation: zap 2.5s infinite 0.5s linear;
        }

        .lightning-zigzag {
          position: absolute;
          height: 100%;
          width: 3px;
          background: transparent;
          opacity: 0;
          transform-origin: bottom center;
          bottom: 0;
        }

        .lightning-zigzag::before {
          content: "";
          position: absolute;
          height: 100%;
          width: 100%;
          background: #93c5fd;
          clip-path: polygon(
            0 0,
            100% 0,
            100% 10%,
            0 10%,
            0 10%,
            100% 10%,
            100% 20%,
            0 20%,
            0 20%,
            100% 20%,
            100% 30%,
            0 30%,
            0 30%,
            100% 30%,
            100% 40%,
            0 40%,
            0 40%,
            100% 40%,
            100% 50%,
            0 50%,
            0 50%,
            100% 50%,
            100% 60%,
            0 60%,
            0 60%,
            100% 60%,
            100% 70%,
            0 70%,
            0 70%,
            100% 70%,
            100% 80%,
            0 80%,
            0 80%,
            100% 80%,
            100% 90%,
            0 90%,
            0 90%,
            100% 90%,
            100% 100%,
            0 100%
          );
          filter: drop-shadow(0 0 2px #3b82f6);
        }

        .lightning-zigzag-1 {
          left: 30%;
          animation: lightning-zigzag 1.2s infinite 0.1s ease-out;
        }

        .lightning-zigzag-2 {
          left: 60%;
          animation: lightning-zigzag 1.3s infinite 0.3s ease-out;
        }

        .lightning-zigzag-3 {
          left: 45%;
          animation: lightning-zigzag 1s infinite 0.7s ease-out;
        }

        @keyframes lightning-zigzag {
          0% {
            opacity: 0;
            transform: rotate(45deg) scale(0.8);
          }
          30%,
          70% {
            opacity: 1;
            transform: rotate(45deg) translateY(-100%) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(45deg) translateY(-120%) scale(0.9);
          }
        }

        .lightning-fork {
          position: absolute;
          width: 100px;
          height: 80px;
          opacity: 0;
        }

        .lightning-fork::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background: #60a5fa;
          clip-path: polygon(50% 0%, 40% 30%, 25% 40%, 40% 50%, 30% 70%, 50% 60%, 70% 70%, 60% 50%, 75% 40%, 60% 30%);
          filter: drop-shadow(0 0 3px #2563eb);
        }

        .lightning-fork-1 {
          top: 20%;
          left: 20%;
          transform: scale(0.6);
          animation: lightning-fork 1.7s infinite 0.2s ease-out;
        }

        .lightning-fork-2 {
          top: 40%;
          right: 20%;
          transform: scale(0.5) rotate(30deg);
          animation: lightning-fork 1.5s infinite 0.5s ease-out;
        }

        @keyframes lightning-fork {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(0deg);
          }
          50%,
          55% {
            opacity: 0.9;
            transform: scale(0.7) rotate(5deg);
          }
        }

        .lightning-spark {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #93c5fd;
          border-radius: 50%;
          filter: drop-shadow(0 0 2px #3b82f6);
          opacity: 0;
          bottom: 20%;
        }

        .lightning-spark-1 {
          left: 25%;
          animation: lightning-spark 0.8s infinite 0.1s ease-out;
        }

        .lightning-spark-2 {
          left: 65%;
          animation: lightning-spark 0.6s infinite 0.3s ease-out;
        }

        .lightning-spark-3 {
          left: 75%;
          animation: lightning-spark 0.9s infinite 0.5s ease-out;
        }

        .lightning-spark-4 {
          left: 35%;
          animation: lightning-spark 0.7s infinite 0.7s ease-out;
        }

        @keyframes lightning-spark {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-20px) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0.5);
          }
        }

        @keyframes lightning-fast {
          0%,
          100% {
            opacity: 0;
            transform: translateY(-100%) rotate(45deg);
          }
          50% {
            opacity: 1;
            transform: translateY(100%) rotate(45deg);
          }
        }

        @keyframes lightning-slow {
          0%,
          100% {
            opacity: 0;
            transform: translateY(100%) rotate(-30deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-100%) rotate(-30deg);
          }
        }

        .animate-lightning-fast {
          animation: lightning-fast 1s infinite;
        }

        .animate-lightning-slow {
          animation: lightning-slow 1.5s infinite 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ConnectionPrompt;
