import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  ClerkProvider,
} from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Event Check-in",
  description: "Event check-in system",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body>
          <TRPCReactProvider>
            <header className="flex h-16 items-center justify-end gap-4 p-4">
              <SignedOut>
                <SignInButton />
                <SignUpButton>
                  <button className="text-ceramic-white h-10 cursor-pointer rounded-full bg-[#6c47ff] px-4 text-sm font-medium sm:h-12 sm:px-5 sm:text-base">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header>
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
