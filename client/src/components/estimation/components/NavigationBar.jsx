import React, { useState } from 'react';
import {
  Menu,
  X,
  Bug,
  Home,
  ChevronRight,
  Lock,
  Edit3
} from 'lucide-react';
import ProjectInfoModal from './ProjectInfoModal';

const NavigationBar = ({
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  currentStep
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const projectLocked = currentStep >= 2;

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">

          {/* LEFT SIDE */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb Removed */}
          </div>

          {/* PROJECT INFO (RIGHT, READ-ONLY) */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-900">
              {formData.projectNumber || '—'}
            </span>
            {formData.projectName && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {formData.projectName}
                </span>
              </>
            )}

            {projectLocked && (
              <>
                <Lock
                  className="w-4 h-4 text-green-600"
                  title="Project information locked"
                />
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Edit Project Information"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* NOTES (READ-ONLY AFTER STEP 1) */}
        {projectLocked && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              <strong>Notes:</strong> {formData.notes || '—'}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="lg:hidden px-4 py-3 border-t bg-white">
          <button
            onClick={() => window.open('/debug/handrail', '_blank')}
            className="px-3 py-1.5 bg-orange-500 text-white rounded-md flex items-center text-xs"
          >
            <Bug className="w-3 h-3 mr-1.5" />
            Debug Excel
          </button>
        </div>
      )}

      {/* EDIT PROJECT INFO MODAL */}
      {showEditModal && (
        <ProjectInfoModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};

export default NavigationBar;
