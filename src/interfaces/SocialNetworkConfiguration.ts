import { SocialNetworkName } from "../types/SocialNetworkName";

export interface SocialNetworkConfiguration {
  id: string;
  configurationName: string;
  network: SocialNetworkName;
  accountHandle?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
