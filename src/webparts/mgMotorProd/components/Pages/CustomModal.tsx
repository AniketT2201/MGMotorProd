import * as React from 'react';
import { useState, useEffect } from 'react';

// Custom Modal Component
export const CustomModal: React.FC<{
  show: boolean;
  onHide: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  //size?: 'default' | 'lg' | 'xl';
  backdrop?: 'static';
  keyboard?: boolean;
}> = ({ show, onHide, title, children, footer }) => {
  if (!show) return null;

  // let modalClass = 'modal-dialog';
  // if (size === 'lg') modalClass += ' modal-lg';
  // if (size === 'xl') modalClass += ' modal-xl';

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>

      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-baseline modal-fixed">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onHide}
              />
            </div>

            <div className="modal-body">
              {children}
            </div>

            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );

};