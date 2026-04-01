import React, { createContext, useContext, useState } from 'react';
import estimationApi from '../api/estimation.api';

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

    return (
        <EstimationContext.Provider value={{
            estimations,
            dashboardStats,
            selectedEstimation,
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
            setSelectedEstimation
        }}>
            {children}
        </EstimationContext.Provider>
    );
};
