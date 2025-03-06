import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import LaserEyesWrapper from "../components/LaserEyesWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ['300', '700', '900'],
});

export const metadata: Metadata = {
  title: "METHANE",
  description: "The first memecoin on Alkanes, a new metaprotocol built on Bitcoin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <LaserEyesWrapper>
          {children}
        </LaserEyesWrapper>
      </body>
    </html>
  );
}
