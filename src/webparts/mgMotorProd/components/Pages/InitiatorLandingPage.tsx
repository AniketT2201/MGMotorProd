import * as React from 'react';
import { useEffect } from 'react';
import { IMgMotorProdProps } from '../IMgMotorProdProps';
import '../Pages/CSS/Landing.scss';
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Image  from '../../assets/Picture1.png';

const InitiatorLanding: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {
  const history = useHistory();
  const [isEditor, setIsEditor] = React.useState(false);
  const [isAppAdmin, setIsAppAdmin] = React.useState(false);
  const [isSysAdmin, setIsSysAdmin] = React.useState(false);

  const [showMovementTypes, setShowMovementTypes] = React.useState(false);
  const [showMovementFlow, setShowMovementFlow] = React.useState(false);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const spCrudOps = await SPCRUDOPS();
        const data = await spCrudOps.getData(
          'ROACL',
          'ID,Title,UserName/Title,UserName/EMail,Role',
          'UserName',
          '',
          { column: 'ID', isAscending: true },
          props
        );
        const filteredData = data.filter(
          item => item.UserName?.EMail?.trim().toLowerCase() === props.userEmail?.trim().toLowerCase()
        );
        if (filteredData) {
          setIsEditor(filteredData[0].Role === "Editor");

          if (filteredData[0].Title === "SysAdmin") {
            setIsSysAdmin(true);
            setIsAppAdmin(true);
          } else if (filteredData[0].Title === "AppAdmin") {
            setIsAppAdmin(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch ACL data:", error);
      }
    };

    fetchData();
  }, []);




  return (
    <>
      <div id="header"></div>

      {/* Main Content */}
      <div id="contentPage" className="container-fluid p-0">
        <div className="info-page">
          <div className="h2 text-center">Welcome to Release Order System</div>
          <hr />
          <p className="text-left mt-8 text-muted">
            The <b>Procure Flow</b> (Release Order System) aims to replace manual, error-prone tracking
            of Release Orders against Master Purchase Orders. Currently, monitoring the
            "Burn Rate"  of a PO and ensuring that work orders do not exceed the contracted
            amount is a significant administrative challenge.
          </p>
          <br></br>
          <br></br>
          <div className="h3 text-left">Approval Flow</div>
          <img className="imgsize" src="../SiteAssets/Custom/img/Picture1.png" alt="Approval Flow" />
          <p className="text-left mt-4 text-muted">
            <b>Note:</b> **CC Finance Approver is determined based on Cost Centre Owners.
          </p>
        </div>
      </div>

      <div id="footer"></div>

      
    </>
  );
};

export default InitiatorLanding;
