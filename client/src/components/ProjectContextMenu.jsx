import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Edit2, Pin, PinOff, Copy, CopyPlus, Link, Archive, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEstimation } from '../contexts/EstimationContext';

export default function ProjectContextMenu({ project, isPinned, onRenameStart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef(null);
  const { deleteEstimation, duplicateEstimation, saveEstimationData } = useEstimation();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = async (e, action) => {
    e.stopPropagation();
    setIsOpen(false);
    
    switch (action) {
      case 'rename':
        onRenameStart();
        break;
        
      case 'pin':
        try {
          await saveEstimationData(project.id, { isPinned: !isPinned });
          toast.success(isPinned ? 'Project unpinned' : 'Project pinned to top!');
        } catch (err) {
          toast.error('Failed to pin project');
        }
        break;

      case 'copy-id':
        navigator.clipboard.writeText(`MISC-${project.id}`);
        setIsCopied(true);
        toast.success(`Copied MISC-${project.id}`);
        setTimeout(() => setIsCopied(false), 2000);
        break;

      case 'duplicate':
        const loadingToast = toast.loading('Duplicating project...');
        try {
          await duplicateEstimation(project.id);
          toast.success('Project duplicated successfully!', { id: loadingToast });
        } catch (err) {
          toast.error('Failed to duplicate project', { id: loadingToast });
        }
        break;

      case 'share':
        const url = `${window.location.origin}/project-info?id=${project.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Direct link copied to clipboard!');
        break;

      case 'archive':
        try {
          await saveEstimationData(project.id, { isArchived: true });
          toast.success('Project archived');
        } catch (err) {
          toast.error('Failed to archive project');
        }
        break;

      case 'delete':
        if (window.confirm(`Are you absolutely sure you want to delete "${project.projectName || 'this project'}"? This cannot be undone.`)) {
          const deleteToast = toast.loading('Deleting project...');
          try {
            await deleteEstimation(project.id);
            toast.success('Project deleted', { id: deleteToast });
          } catch (err) {
            toast.error('Failed to delete project', { id: deleteToast });
          }
        }
        break;

      default:
        break;
    }
  };

  return (
    <div className="context-menu-wrapper" ref={menuRef} style={{ position: 'relative' }}>
      <button className="context-menu-trigger" onClick={toggleMenu} title="Options">
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="context-menu-dropdown"
          >
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'share')}>
              <Link size={14} /> Share Link
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'rename')}>
              <Edit2 size={14} /> Rename
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'copy-id')}>
              {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} 
              {isCopied ? 'Copied ID' : 'Copy ID'}
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'pin')}>
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />} 
              {isPinned ? 'Unpin from Top' : 'Pin to Top'}
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'duplicate')}>
              <CopyPlus size={14} /> Duplicate
            </button>
            
            <div className="context-menu-divider" />
            
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'archive')}>
              <Archive size={14} /> Archive
            </button>
            <button className="context-menu-option context-menu-destructive" onClick={(e) => handleAction(e, 'delete')}>
              <Trash2 size={14} /> Delete 
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
