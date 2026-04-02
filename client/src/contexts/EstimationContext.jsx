import React, { createContext, useContext, useState, useCallback } from 'react';
import estimationApi from '../api/estimation.api';
import notesApi from '../api/notes.api';

const EstimationContext = createContext();

export const useEstimation = () => {
    const context = useContext(EstimationContext);
    if (!context) {
        throw new Error('useEstimation must be used within an EstimationProvider');
    }
    return context;
};

export const EstimationProvider = ({ children }) => {
    const [estimations, setEstimations] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        NEW: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        SUBMITTED: 0,
        OVERDUE: 0
    });
    const [selectedEstimation, setSelectedEstimation] = useState(null);
    const [notes, setNotes] = useState([]);
    const [trashNotes, setTrashNotes] = useState([]);
    const [activeContext, setActiveContext] = useState({ type: 'global', id: null, label: 'Global' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            const res = await estimationApi.getDashboardStats();
            if (res.data.success) {
                setDashboardStats(res.data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        }
    };

    const fetchEstimations = async (filters = {}) => {
        setLoading(true);
        try {
            const res = await estimationApi.getList(filters);
            if (res.data.success) {
                setEstimations(res.data.estimations);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEstimationDetail = async (id) => {
        setLoading(true);
        try {
            const res = await estimationApi.getDetail(id);
            if (res.data.success) {
                setSelectedEstimation(res.data.estimation);
                return res.data.estimation;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createEstimation = async (data) => {
        try {
            const res = await estimationApi.create(data);
            if (res.data.success) {
                await fetchDashboardStats();
                return res.data.id;
            }
        } catch (err) {
            throw err;
        }
    };

    const updateEstimationStatus = async (id, action, data = {}) => {
        try {
            const res = await estimationApi.updateStatus(id, action, data);
            if (res.data.success) {
                await fetchEstimationDetail(id);
                await fetchDashboardStats();
            }
            return res.data.success;
        } catch (err) {
            throw err;
        }
    };

    const saveEstimationData = async (id, data) => {
        try {
            const res = await estimationApi.saveData(id, data);
            if (res.data.success) {
                await fetchEstimationDetail(id);
            }
            return res.data.success;
        } catch (err) {
            throw err;
        }
    };

    const deleteEstimation = async (id) => {
        try {
            const res = await estimationApi.delete(id);
            if (res.data.success) {
                // If the selected project was deleted, clear it
                if (selectedEstimation?.id === id) {
                    setSelectedEstimation(null);
                }
                fetchEstimations(); // Refresh list to remove it from sidebar
                fetchDashboardStats();
            }
            return res.data.success;
        } catch (err) {
            throw err;
        }
    };

    const duplicateEstimation = async (id) => {
        try {
            const res = await estimationApi.duplicate(id);
            if (res.data.success) {
                fetchEstimations(); // Refresh list to show duplicate
                fetchDashboardStats();
                return res.data.newId; // Return new ID to navigate to
            }
        } catch (err) {
            throw err;
        }
    };

    // --- Notes Management ---
    // Automatically clear notes and trash when active project context changes
    React.useEffect(() => {
        if (!selectedEstimation?.id) {
            setNotes([]);
            setTrashNotes([]);
        }
    }, [selectedEstimation?.id]);

    const fetchNotes = useCallback(async (projectId) => {
        if (!projectId) return;
        try {
            const res = await notesApi.getProjectNotes(projectId);
            if (res.data.success) {
                setNotes(res.data.notes);
            }
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        }
    }, []);

    const fetchTrashNotes = useCallback(async (projectId) => {
        if (!projectId) return;
        try {
            const res = await notesApi.getTrashNotes(projectId);
            if (res.data.success) {
                setTrashNotes(res.data.trash);
            }
        } catch (err) {
            console.error('Failed to fetch trash notes:', err);
        }
    }, []);

    const addNote = async (noteData) => {
        try {
            const dataWithContext = { ...noteData, context_type: activeContext.type, context_id: activeContext.id };
            const res = await notesApi.createNote(dataWithContext);
            if (res.data.success) {
                setNotes(prev => [...prev, res.data.note]);
                return res.data.note;
            }
        } catch (err) {
            console.error('Failed to add note:', err);
            throw err;
        }
    };

    const updateNote = async (id, noteData) => {
        try {
            const res = await notesApi.updateNote(id, noteData);
            if (res.data.success) {
                setNotes(prev => prev.map(n => n.id === id ? { ...n, ...noteData } : n));
            }
        } catch (err) {
            console.error('Failed to update note:', err);
            throw err;
        }
    };

    const updateNotePosition = async (id, position) => {
        try {
            // Optimistic update
            setNotes(prev => prev.map(n => n.id === id ? { ...n, pos_x: position.pos_x, pos_y: position.pos_y } : n));
            await notesApi.updatePosition(id, position);
        } catch (err) {
            console.error('Failed to update note position:', err);
        }
    };

    const deleteNote = async (id) => {
        try {
            const res = await notesApi.deleteNote(id);
            if (res.data.success) {
                setNotes(prev => prev.filter(n => n.id !== id));
                // Optionally refresh trash if open
                if (selectedEstimation?.id) fetchTrashNotes(selectedEstimation.id);
            }
        } catch (err) {
            console.error('Failed to delete note:', err);
            throw err;
        }
    };

    const restoreNote = async (id) => {
        try {
            const res = await notesApi.restoreNote(id);
            if (res.data.success) {
                setTrashNotes(prev => prev.filter(n => n.id !== id));
                if (selectedEstimation?.id) fetchNotes(selectedEstimation.id);
            }
        } catch (err) {
            console.error('Failed to restore note:', err);
            throw err;
        }
    };

    const permanentlyDeleteNote = async (id) => {
        try {
            const res = await notesApi.permanentlyDeleteNote(id);
            if (res.data.success) {
                setTrashNotes(prev => prev.filter(n => n.id !== id));
            }
        } catch (err) {
            console.error('Failed to permanently delete note:', err);
            throw err;
        }
    };

    return (
        <EstimationContext.Provider value={{
            estimations,
            dashboardStats,
            selectedEstimation,
            notes,
            loading,
            error,
            fetchDashboardStats,
            fetchEstimations,
            fetchEstimationDetail,
            createEstimation,
            updateEstimationStatus,
            saveEstimationData,
            deleteEstimation,
            duplicateEstimation,
            setSelectedEstimation,
            fetchNotes,
            fetchTrashNotes,
            trashNotes,
            activeContext,
            setActiveContext,
            addNote,
            updateNote,
            updateNotePosition,
            deleteNote,
            restoreNote,
            permanentlyDeleteNote
        }}>
            {children}
        </EstimationContext.Provider>
    );
};
