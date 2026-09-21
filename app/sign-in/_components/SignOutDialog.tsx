"use client"
import React from 'react';
import { LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SignOutDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SignOutDialog: React.FC<SignOutDialogProps> = ({ open, onConfirm, onCancel, isLoading = false }) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-sm bg-white">
        <DialogHeader className="flex flex-col items-center gap-3 pt-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <LogOut className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-semibold text-center">
            Sign Out
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Are you sure you want to sign out? You will need to log in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter >
          <div className="flex flex-col w-full mt-1 mb-1 gap-2">
            <Button
              className="w-full cursor-pointer"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing out…
                </span>
              ) : (
                "Sign Out"
              )}
            </Button>
            <Button
              className="w-full cursor-pointer bg-white text-red"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog;