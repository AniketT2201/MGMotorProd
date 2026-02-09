import * as React from 'react';
import styles from './MgMotorProd.module.scss';
import type { IMgMotorProdProps } from './IMgMotorProdProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { ReleaseOrder } from './Pages/ReleaseOrder';
import InitiatorLanding from './Pages/InitiatorLandingPage';
import { NewRequest } from './Pages/NewRequest';
import { Request } from './Pages/Request';
import  MyActionsDashboard  from './Pages/MyActionsDashboard';
import { MyReqDash } from './Pages/MyReqDashboard';
import { ApprovalForm } from './Pages/ApprovalForm';
import { AllReqDash } from './Pages/AllReqDashboard';
import { ArchiveReport } from './Pages/ArchiveReport'
import { Draft } from './Pages/Draft';
import { CostCenter } from './Pages/CostCenter';
import POWiseROReport from './Pages/POWiseROReport';
import ForwardingUser from './Pages/ForwardingUser';
import Sidebar from '../components/Pages/Sidebar';
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import VendorMaster from './Pages/VendorMaster';
import POMaster from './Pages/POMaster';

export const MgMotorProd: React.FC<IMgMotorProdProps> = (props) => {
  // const { hasTeamsContext } = props;  
  const { hasTeamsContext, EmployeeId, Maintenance } = props;

  const hasAccess = EmployeeId.length > 0;

  const QueryParamWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    React.useEffect(() => {
      const url = new URL(window.location.href);

      // If env is not already present, add it
      if (!url.searchParams.has("env")) {
        url.searchParams.set("env", "WebViewList");

        // Clean hash: remove any ?env=WebViewList from inside the hash routes
        const cleanHash = url.hash.replace(/\?env=WebViewList/, "");

        // Build correct final URL
        const newUrl = `${url.origin}${url.pathname}?${url.searchParams.toString()}${cleanHash}`;

        // Update without reload
        window.history.replaceState({}, "", newUrl);
      }
    }, []);

    return <>{children}</>;
  };

  if (props.Maintenance === true) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
      >
        <img
          src="../SiteAssets/Custom/imgs/Maintenance.png"
          alt="Maintenance Mode"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover" 
          }}
        />
      </div>
    );
  }
  else if (!hasAccess) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <h3>No access. Please contact the IT team.</h3>
      </div>
    );
  }

  return (
    <Router>
      <QueryParamWrapper>
      <div className="container-fluid" style={{ display: 'flex', width: '100%' }}>
        <Sidebar {...props} />
        <div className="main">
          <Switch>
            <Route
              path="/InitiatorLanding"
              render={() => <NewRequest {...props} />}
            />
            <Route
              exact
              path="/"
              render={() => <InitiatorLanding {...props} />}
            />
            <Route
              exact
              path="/MyActionsDashboard"
              render={() => <MyActionsDashboard {...props} />}
            />
            <Route
              exact
              path="/ApprovalForm"
              render={() => <ApprovalForm {...props} />}
            />
            <Route
              exact
              path="/MyReqDash"
              render={() => <MyReqDash {...props} />}
            />
            <Route
              exact
              path="/AllReqDash"
              render={() => <AllReqDash {...props} />}
            />
            <Route
              exact
              path="/Draft"
              render={() => <Draft {...props} />}
            />
            <Route
              exact
              path="/CostCenter"
              render={() => <CostCenter {...props} />}
            />
            <Route
              exact
              path="/POWiseROReport"
              render={() => <POWiseROReport {...props} />}
            />
            <Route
              exact
              path="/ForwardingUser"
              render={() => <ForwardingUser {...props} />}
            />
            <Route
              exact
              path="/ArchiveReport"
              render={() => <ArchiveReport {...props} />}
            />
            <Route
              exact
              path="/ReleaseOrder"
              render={() => <ReleaseOrder {...props} />}
            />
            <Route
              exact
              path="/VendorMaster"
              render={() => <VendorMaster {...props} />}
            />
            <Route
              exact
              path="/POMaster"
              render={() => <POMaster {...props} />}
            />
          </Switch>
          {/* <Redirect to="/InitiatorLanding"></Redirect> */}
        </div>
      </div>
      </QueryParamWrapper>
    </Router>
  );
};
