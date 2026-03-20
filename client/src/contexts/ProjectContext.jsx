import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projectInfo, setProjectInfo] = useState(() => {
    const saved = localStorage.getItem('steelProjectInfo');
    return saved ? JSON.parse(saved) : { projectName: '', projectNumber: '', id: null };
  });

  const [stairs, setStairs] = useState([]);
  const [estimationResult, setEstimationResult] = useState(null);
  
  // Triggers for external actions
  const [stairRequest, setStairRequest] = useState(0);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [calcTrigger, setCalcTrigger] = useState(0);

  // Sync project info to localStorage
  useEffect(() => {
    if (projectInfo.id || projectInfo.projectName) {
      localStorage.setItem('steelProjectInfo', JSON.stringify(projectInfo));
    }
  }, [projectInfo]);

  const updateProjectInfo = (info) => {
    setProjectInfo(prev => ({ ...prev, ...info }));
  };

  const requestAddStair = () => setStairRequest(prev => prev + 1);
  const triggerSave = () => setSaveTrigger(prev => prev + 1);
  const triggerCalc = () => setCalcTrigger(prev => prev + 1);

  const value = {
    projectInfo,
    setProjectInfo: updateProjectInfo,
    stairs,
    setStairs,
    estimationResult,
    setEstimationResult,
    stairRequest,
    requestAddStair,
    saveTrigger,
    triggerSave,
    calcTrigger,
    triggerCalc
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
