import { ConnectButton } from "@rainbow-me/rainbowkit";

const ConnectionPrompt = () => (
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
          <button
            onClick={openConnectModal}
            className="w-full py-4 text-base font-medium bg-neutral-800/70 text-white rounded-lg shadow-lg hover:bg-neutral-700/80 transition-all duration-200 flex items-center justify-center gap-3 backdrop-blur-md border border-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
            Connect Wallet to Continue
          </button>
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
          <p className="text-gray-300 text-center font-light">Trustless atomic swaps with Hash Time Locked Contracts</p>
        </div>
      </div>
    </div>
  </div>
);

export default ConnectionPrompt;
