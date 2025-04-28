import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import CopyToClipboard from "react-copy-to-clipboard";
import { Address, useDisconnect } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();

  const [addressCopied, setAddressCopied] = useState(false);

  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary
          tabIndex={0}
          className="btn !border-0 !bg-neutral-900/70 backdrop-blur-xl !rounded-2xl pl-1 pr-2 shadow-lg hover:shadow-xl dropdown-toggle gap-0 !h-auto hover:!bg-neutral-800/70 transition-all duration-200 ring-1 ring-inset ring-white/10 hover:ring-white/20"
        >
          <span className="ml-2 mr-1 font-medium text-neutral-200">{displayName}</span>
          <ChevronDownIcon className="h-5 w-5 ml-2 sm:ml-0 transition-transform duration-200 group-open:rotate-180 text-neutral-300" />
        </summary>
        <ul
          tabIndex={0}
          className="dropdown-content menu z-[99] p-4 mt-3 shadow-2xl bg-neutral rounded-2xl gap-2 w-64 backdrop-blur-xl bg-opacity-95 border border-neutral-700 ring-1 ring-inset ring-white/10"
        >
          <NetworkOptions hidden={!selectingNetwork} />
          <li className={selectingNetwork ? "hidden" : ""}>
            {addressCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3 py-3 px-4 hover:bg-neutral-800/70 transition-colors duration-200">
                <CheckCircleIcon className="text-xl font-normal h-5 w-5 text-success" aria-hidden="true" />
                <span className="whitespace-nowrap font-medium text-neutral-200">Copied!</span>
              </div>
            ) : (
              <CopyToClipboard
                text={address}
                onCopy={() => {
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3 py-3 px-4 hover:bg-neutral-800/70 transition-colors duration-200">
                  <DocumentDuplicateIcon className="text-xl font-normal h-5 w-5 text-neutral-300" aria-hidden="true" />
                  <span className="whitespace-nowrap font-medium text-neutral-200">Copy address</span>
                </div>
              </CopyToClipboard>
            )}
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item btn-sm !rounded-xl flex gap-3 py-3 px-4 hover:bg-neutral-800/70 transition-colors duration-200 w-full"
              type="button"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-neutral-300" />
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="whitespace-nowrap font-medium text-neutral-200"
              >
                View on Explorer
              </a>
            </button>
          </li>
          {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="btn-sm !rounded-xl flex gap-3 py-3 px-4 hover:bg-neutral-800/70 transition-colors duration-200 w-full"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-5 w-5 text-neutral-300" />
                <span className="font-medium text-neutral-200">Switch Network</span>
              </button>
            </li>
          ) : null}
          <div className="divider my-1 before:bg-neutral-700 after:bg-neutral-700"></div>
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item text-error btn-sm !rounded-xl flex gap-3 py-3 px-4 hover:bg-error/10 transition-colors duration-200 w-full"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span className="font-medium">Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
