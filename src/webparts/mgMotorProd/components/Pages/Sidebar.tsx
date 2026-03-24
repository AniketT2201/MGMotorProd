import * as React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import '../Pages/CSS/Sidebar.scss';
import { IMgMotorProdProps } from '../IMgMotorProdProps';
import '@fortawesome/fontawesome-free/css/all.min.css';
import SPCRUDOPS from "../../service/DAL/spcrudops";

type LocationState = {
  from?: string;
};

const Sidebar = (props: IMgMotorProdProps) => {
  const history = useHistory();
  const location = useLocation();
  const [showSubMenu, setShowSubMenu] = React.useState(false);
  const [ROACL, setROACL] = React.useState<any[]>([]);
  const [AppAdmin, setAppAdmin] = React.useState(false);
  const [Admin, setAdmin] = React.useState(false);
  const [Editor, setEditor] = React.useState(false);
  const [FinMgr, setFinMgr] = React.useState(false);

  const username = props.userDisplayName;
  const activeByOverride = React.useMemo(() => {
    if (location.pathname.startsWith('/ApprovalForm')) {
      const state = location.state as LocationState | undefined;
      const memoryState = state?.from || sessionStorage.getItem('sidebarFrom');
      return memoryState;
    }
    return null;
  }, [location]);

  React.useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlsearchfrom = queryParams.get("from");

    if (location.pathname.startsWith('/ApprovalForm')) {
      //const state = location.state as LocationState | undefined;
      if (urlsearchfrom) {
        sessionStorage.setItem('sidebarFrom', urlsearchfrom);
      }
    } else if (location.pathname.startsWith('/Draft')) {
      //const state = location.state as LocationState | undefined;
      if (urlsearchfrom) {
        sessionStorage.setItem('sidebarFrom', urlsearchfrom);
      }
    } else {
      sessionStorage.removeItem('sidebarFrom');
    }
    GetROACL();
  }, [location]);

  /*********Left Menue Visisbility*/
  async function GetROACL() {
    const spCrudOps = await SPCRUDOPS();
    const Momentflowdata = await spCrudOps.getData(
      'ROACL',
      'ID,Title,UserName/Title,UserName/EMail,Role,EmployeeID',
      'UserName',
      '',
      { column: 'ID', isAscending: true },
      props
    );

    // Filter the data for the current user
    let Userfiltereddata = Momentflowdata.filter(
      (item) =>
        item.UserName?.EMail === props.userEmail &&
        item.EmployeeID === props.EmployeeId[0].EmployeeID
    );
    if (Userfiltereddata.some((test) => test.Role === "Editor")) {
      setEditor(true);
    }
    if (Userfiltereddata.some((test) => test.Title === "SysAdmin")) {
      setAdmin(true);
    }
    if (Userfiltereddata.some((test) => test.Title === "AppAdmin")) {
      setAppAdmin(true);
    }
    if (Userfiltereddata.some((test) => test.Title === "FinMgr")) {
      setFinMgr(true);
    }

    console.log(Userfiltereddata);
    setROACL(Userfiltereddata); // <-- set filtered data
  }
  /***********END*****Left Menue Visisbility*/
  const getActiveClass = (key: string) => {
    const currentPath = location.pathname;

    if (activeByOverride) {
      return activeByOverride === key ? 'active' : '';
    }

    switch (key) {
      case '/InitiatorLanding':
        return currentPath === '/InitiatorLanding' ? 'active' : '';
      case '/':
        return currentPath === '/' ? 'active' : '';
      case '/MyActionsDashboard':
        return currentPath.includes('/MyActionsDashboard') || currentPath.includes('/Approverform') ? 'active' : '';
      case '/MyReqDash':
        return currentPath === '/MyReqDash' ? 'active' : '';
      case '/AllReqDash':
        return currentPath === '/AllReqDash' ? 'active' : '';
      case '/POWiseROReport':
        return currentPath === '/POWiseROReport' ? 'active' : '';
      case 'all-requests':
        return ['/AllReqDash', '/POWiseROReport'].some(path => currentPath.includes(path)) ? 'active' : '';
      case 'Configure':
        return ['/VendorMaster', '/POMaster'].some(path => currentPath.includes(path)) ? 'active' : '';
      case '/Action':
        return ['/MyReqDash', '/MyActionsDashboard'].some((path) =>
          currentPath.includes(path)
        )
          ? 'active'
          : '';
      default:
        return '';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidehead">
        <img
          src="../SiteAssets/Custom/img/MG-Motor-Logo.png"
          alt="MG Motor Logo"
        />
        <h2 className="logo">JSW MGI</h2>
      </div>

      <div className="sidehead-user">

        <i className="fas fa-user" style={{ marginLeft: "20px" }}></i>&nbsp;
        {username}

      </div>

      <ul className="nav">
        <li className="nav-item">
          <a
            className={`nav-link ${getActiveClass('/')}`}
            onClick={() => history.push('/')}
          >
            <i className="fas fa-home" style={{ marginRight: '8px' }}></i>Home
          </a>
        </li>
        {Editor === true &&
          <li className="nav-item">
            <a
              className={`nav-link ${getActiveClass('/InitiatorLanding')}`}
              onClick={() => history.push('/InitiatorLanding')}
            >
              <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i> New Request
            </a>
          </li>
        }

        <li className={`nav-item has-submenu ${getActiveClass('/Action')}`}>
          <div className="nav-link">
            <i className="fa fa-bolt" aria-hidden="true"></i> Action
          </div>
          <ul className="sub-menu">
            <li className="nav-item">
              <a
                className={`nav-link ${getActiveClass('/MyActionsDashboard')}`}
                onClick={() => history.push('/MyActionsDashboard')}
              >
                <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i>My Pending Action
              </a>
            </li>
            <li>
              <a
                className={`nav-link ${getActiveClass('/MyReqDash')}`}
                onClick={() => history.push('/MyReqDash')}
              >
                <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i>My Request
              </a>
            </li>
          </ul>
        </li>

        
          <li className={`nav-item has-submenu ${getActiveClass('all-requests')}`}>
            <div className="nav-link">
              <i className="fa fa-chart-bar" aria-hidden="true"></i> All Requests
            </div>
            <ul className="sub-menu">
              {/* {(AppAdmin === true || Admin === true) && ( */}
                <li>
                  <a
                    className={getActiveClass('/AllReqDash')}
                    onClick={() => history.push('/AllReqDash')}
                  >
                    All RO
                  </a>
                </li>
              {/* )} */}
              <li>
                <a
                  className={getActiveClass('/POWiseROReport')}
                  onClick={() => history.push('/POWiseROReport')}
                >
                  PO wise RO
                </a>
              </li>
            </ul>
          </li>
        

        {(AppAdmin === true || Admin === true || FinMgr === true) && (
          <li className={`nav-item has-submenu ${getActiveClass('Configure')}`}>
            <div className="nav-link">
              <i className="fa fa-gears" aria-hidden="true"></i> Configure
            </div>
            <ul className="sub-menu">
              <li>
                <a
                  className={getActiveClass('/VendorMaster')}
                  onClick={() => history.push('/VendorMaster')}
                >
                  Vendor Master
                </a>
              </li>
              <li>
                <a
                  className={getActiveClass('/POMaster')}
                  onClick={() => history.push('/POMaster')}
                >
                  PO Master
                </a>
              </li>
              <li>
                <a
                  className={getActiveClass('/ROWorkflowMaster')}
                  onClick={() => history.push('/ROWorkflowMaster')}
                >
                  ROWorkFlow Master
                </a>
              </li>
            </ul>
          </li>
        )}

        {Admin === true &&
          <li className="nav-item has-submenu settings">
            <div className="nav-link">
              <i className="fa fa-gears" aria-hidden="true"></i> Settings
            </div>
            <ul className="sub-menu">
              <li><span className="sub-menu-title">&nbsp;Application List</span></li>
              <li>
                <a href="../../RO/Lists/ROACL/AllItems.aspx" target="_blank" rel="noopener noreferrer">ACL</a>
              </li>
              <li>
                <a href="../../RO/Lists/ROList/AllItems.aspx" target="_blank" rel="noopener noreferrer">RO List</a>
              </li>
              <li><span className="sub-menu-title">&nbsp;System Setting</span></li>
              <li>
                <a href="../../RO/_layouts/15/viewlsts.aspx?view=14" target="_blank" rel="noopener noreferrer">Site Content</a>
              </li>
            </ul>
          </li>
        }
      </ul>
    </div>
  );
};

export default Sidebar;
