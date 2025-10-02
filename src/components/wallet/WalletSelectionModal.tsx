"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { X, Wallet, Smartphone, Monitor } from "lucide-react";
import { WalletConnector } from "@/lib/web3/types";

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (connector: WalletConnector) => Promise<void>;
  connectors: WalletConnector[];
  isConnecting: boolean;
  connectingWallet?: string | undefined;
}

export function WalletSelectionModal({
  isOpen,
  onClose,
  onSelectWallet,
  connectors,
  isConnecting,
  connectingWallet,
}: WalletSelectionModalProps) {
  const handleWalletSelect = async (connector: WalletConnector) => {
    try {
      await onSelectWallet(connector);
      onClose();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const getWalletIcon = (walletId: string) => {
    switch (walletId) {
      case "metamask":
        return "🦊";
      case "coinbase":
        return "🔵";
      case "walletconnect":
        return "🔗";
      default:
        return "👛";
    }
  };

  const getWalletDescription = (connector: WalletConnector) => {
    if (connector.id === "walletconnect") {
      return "Scan QR code with mobile wallet";
    }
    return connector.description;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span>Connect Wallet</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose your preferred wallet to connect to GNUS DAO
          </p>

          <div className="space-y-2">
            {connectors.map((connector) => {
              const isAvailable = connector.isAvailable();
              const isCurrentlyConnecting =
                isConnecting && connectingWallet === connector.id;

              return (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  onClick={() => handleWalletSelect(connector)}
                  disabled={!isAvailable || isConnecting}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-2xl">
                      {getWalletIcon(connector.id)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {connector.name}
                        {!isAvailable && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Not installed)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getWalletDescription(connector)}
                      </div>
                    </div>
                    {isCurrentlyConnecting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    {connector.id === "walletconnect" && (
                      <div className="flex gap-1">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <Monitor className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {connectors.length === 0 && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Wallets Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please install a Web3 wallet like MetaMask to continue.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://metamask.io/download/", "_blank")
                }
              >
                Install MetaMask
              </Button>
            </div>
          )}

          {isConnecting && (
            <div className="text-center py-4 border-t">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Connecting to {connectingWallet}...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
