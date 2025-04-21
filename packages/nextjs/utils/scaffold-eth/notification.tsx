import React from "react";
import { ToastPosition, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

type NotificationProps = {
  content: React.ReactNode;
  status: "success" | "info" | "loading" | "error" | "warning";
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

type NotificationOptions = {
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

const ENUM_STATUSES = {
  success: <CheckCircleIcon className="w-6 h-6 text-emerald-500" />,
  loading: <span className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin"></span>,
  error: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
  warning: <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />,
};

const DEFAULT_DURATION = 3000;
const DEFAULT_POSITION: ToastPosition = "top-center";

/**
 * Custom Notification
 */
const Notification = ({
  content,
  status,
  duration = DEFAULT_DURATION,
  icon,
  position = DEFAULT_POSITION,
}: NotificationProps) => {
  return toast.custom(
    t => (
      <div
        className={`flex items-center gap-3 min-w-[320px] max-w-sm rounded-xl bg-zinc-900 p-4 
        border border-zinc-800
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm
        transform-gpu transition-all duration-300 ease-out font-sans
        ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}
      >
        <div className="flex-shrink-0">{icon ? icon : ENUM_STATUSES[status]}</div>

        <div className="flex-1 break-words text-[14px] leading-5 text-zinc-100">{content}</div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-lg p-1.5 hover:bg-zinc-800/80 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-zinc-400 hover:text-zinc-300" />
        </button>
      </div>
    ),
    {
      duration: status === "loading" ? Infinity : duration,
      position,
    },
  );
};

export const notification = {
  success: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "success", ...options });
  },
  info: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "info", ...options });
  },
  warning: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "warning", ...options });
  },
  error: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "error", ...options });
  },
  loading: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "loading", ...options });
  },
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
