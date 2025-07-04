// src/types/index.ts

export interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
    chainId: string;
    walletClient: "privy";
    walletClientType: "privy";
    connectorType: "embedded";
  };
  email?: {
    address: string;
  };
  phone?: {
    number: string;
  };
  twitter?: {
    subject: string;
    email?: string;
    name?: string;
    username?: string;
    profilePictureUrl?: string;
  };
  github?: {
    subject: string;
    email?: string;
    name?: string;
    username?: string;
  };
  google?: {
    subject: string;
    email?: string;
    name?: string;
  };
  createdAt: Date;
}

export interface AIContext {
  bio: string[];
  style: {
    all: string[];
    chat?: string[];
  };
  topics: string[];
  traits: string[];
  updated: string;
  version: string;
}

export interface ENSProfile {
  name: string;
  address: string;
  avatar?: string;
  aiContext: AIContext;
  lastUpdated: Date;
}

export interface XProfile {
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  profileImageUrl?: string;
  verified: boolean;
}
