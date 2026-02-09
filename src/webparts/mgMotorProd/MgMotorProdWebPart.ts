import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'MgMotorProdWebPartStrings';
import { MgMotorProd } from './components/MgMotorProd';
import { IMgMotorProdProps } from './components/IMgMotorProdProps';
import SPCRUDOPS from "./service/DAL/spcrudops";
import IEmployeeProfileops from './service/BAL/SPCRUD/EmployeeProfile'

export interface IMgMotorProdWebPartProps {
  description: string;
}

export default class MgMotorProdWebPart extends BaseClientSideWebPart<IMgMotorProdWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  
  public async render(): Promise<void> {
    let props = {
      description: this.properties.description,
      isDarkTheme: this._isDarkTheme,
      environmentMessage: this._environmentMessage,
      hasTeamsContext: !!this.context.sdks.microsoftTeams,
      userDisplayName: this.context.pageContext.user.displayName,
      currentSPContext: this.context,
      userEmail: this.context.pageContext.user.email
    }
    const itemdata = await IEmployeeProfileops().getEmployeeProfile(this.context.pageContext.user.email, props);

    const IROACL = async () => {
      const spCrudOps = await SPCRUDOPS();
      const AppAdminData = await spCrudOps.getRootData(
        'AppAdmin',
        'Title,AdminName/EMail,AppName,EmployeeID,AppName',
        'AdminName',
        '',
        { column: 'ID', isAscending: true },
        props
      );

      const RoACLdata = await spCrudOps.getData(
        'ROACL',
        'Title,UserName/EMail,Role,EmployeeID',
        'UserName',
        '',
        { column: 'ID', isAscending: true },
        props
      );

      let AAfiltereddata = AppAdminData.filter((m) => (m.EmployeeID === itemdata[0].EmployeeID && m.AppName === 'RO'));
      let AppDatafiltered = RoACLdata.filter((m) => m.EmployeeID === itemdata[0].EmployeeID);
      let Maintfiltereddata = RoACLdata.filter((m) => m.Title === "Maintenance");
      let SysAdmindata = RoACLdata.filter((m) => (m.EmployeeID === itemdata[0].EmployeeID && m.Role === 'SysAdmin'))

      // Default values
      let isAppAdmin: boolean = false;
      let isMaintenance: boolean = false;
      let isEditor: boolean = false;
      let SysAdmin: boolean = false;

      if (SysAdmindata.length > 0) {
        isAppAdmin = true;
        isEditor = true;
        SysAdmin = true;
      }
      else {
        if (AAfiltereddata[0]?.AppName === 'RO') {
          isAppAdmin = true;
        }
        if (AppDatafiltered[0]?.Role === 'Editor') {
          isEditor = true;
        }
      }

      if (Maintfiltereddata[0]?.Status === 'Active') {
        isMaintenance = true;
      }

      return { isAppAdmin, isEditor, isMaintenance, SysAdmin };
    };

    // ✅ Get ACL values
    const { isAppAdmin, isEditor, isMaintenance, SysAdmin } = await IROACL();

    const element: React.ReactElement<IMgMotorProdProps> = React.createElement(
      MgMotorProd,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        currentSPContext: this.context,
        userEmail: this.context.pageContext.user.email,
        EmployeeId: itemdata,
        context: this.context,
        Appadmin: isAppAdmin,
        Editor: isEditor,
        Maintenance: isMaintenance,
        SysAdmin: SysAdmin
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
