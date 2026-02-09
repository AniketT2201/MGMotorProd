import { Theme } from '@fluentui/react';
//import { IReadonlyTheme } from '@microsoft/sp-component-base';

export interface IDeviationDevProps {
  currentSPContext: any;
  teamContext: any;
  appId: string;
  teamId: string;
  teamName: string;
  channelId: string;
  tabName: string;
  entityId: string;
  description: string;
  teamConfigSucess: boolean;

  azureMSGraphClientID: string;
  azureMSGraphAuthority: string;
  azureMSGraphredirectUri: string;

  themeVariant: Theme | undefined;
}
