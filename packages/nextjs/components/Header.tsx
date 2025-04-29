"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ServerStatus } from "@lightning-evm-bridge/shared";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  // {
  //   label: "Home",
  //   href: "/",
  // },
  // {
  //   label: "Debug Contracts",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

function getTooltipFromStatus(status: ServerStatus) {
  switch (status) {
    case ServerStatus.ACTIVE:
      return "Server is active";
    case ServerStatus.INACTIVE:
      return "Server is inactive";
    case ServerStatus.MOCK:
      return "Server is in mock mode, all invoice payments will be mocked by the LSP";
  }
}

/**
 * Site header content
 */
const HeaderContent = () => {
  return (
    <div className="sticky font-mono lg:static top-0 navbar bg-base-100/70 backdrop-blur-md min-h-0 flex-shrink-0 justify-between z-50 px-0 sm:px-2 border-b border-base-200/30">
      <div className="navbar-start w-auto lg:w-1/2">
        <Link color={"white"} href="/" passHref className="flex items-center gap-2 ml-4 mr-6 shrink-0">
          <h2 className="text-lg sm:text-2xl font-light tracking-tight relative">
            {/* Desktop title */}
            <span className="hidden sm:inline bg-gradient-to-r from-violet-400 to-purple-500 text-transparent bg-clip-text tracking-wide">
              Lightning Botanix
            </span>
            {/* Mobile title */}
            <span className="sm:hidden bg-gradient-to-r from-violet-400 to-purple-500 text-transparent bg-clip-text tracking-wide">
              Lightning
            </span>{" "}
            <span className="font-normal text-white tracking-wide relative">Bridge</span>
            <span className="absolute -inset-1 bg-violet-500/10 blur-xl opacity-30 rounded-lg -z-10"></span>
          </h2>
        </Link>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};

/**
 * Site header
 */
export const Header = dynamic(() => Promise.resolve(HeaderContent), { ssr: false });
