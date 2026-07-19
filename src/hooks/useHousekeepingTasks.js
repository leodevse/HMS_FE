// src/hooks/useHousekeepingTasks.js
import {useCallback, useEffect, useState} from 'react';
import {housekeepingApi} from '../apis/housekeepingApi';
import {notifications} from '@mantine/notifications';

export const useHousekeepingTasks = () => {
	const [tasks, setTasks] = useState([]);
	const [todayTasks, setTodayTasks] = useState([]);
	const [counts, setCounts] = useState({
		scheduled: 0,
		inProgress: 0,
		completed: 0,
		total: 0
	});
	const [minibarItems, setMinibarItems] = useState([]);
	const [damageReports, setDamageReports] = useState([]);
	const [schedule, setSchedule] = useState([]);
	const [todaySchedule, setTodaySchedule] = useState(null);
	const [scheduleSummary, setScheduleSummary] = useState({});
	const [performanceReport, setPerformanceReport] = useState(null);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState(null);

	// ==================== TASK FUNCTIONS ====================
	const fetchTasks = useCallback(async () => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getMyTasks();
			console.log('Tasks response:', response.data);
			setTasks(response.data.data || []);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching tasks:', err);
			setError(err.message);
			notifications.show({
				title: 'Error',
				message: 'Unable to load tasks',
				color: 'red'
			});
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchTodayTasks = useCallback(async () => {
		try {
			const response = await housekeepingApi.getTodayTasks();
			console.log('Today tasks response:', response.data);
			setTodayTasks(response.data.data || []);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching today tasks:', err);
			return [];
		}
	}, []);

	const fetchTaskCounts = useCallback(async () => {
		try {
			const response = await housekeepingApi.getTaskCounts();
			console.log('Counts response:', response.data);
			const data = response.data.data || {};
			const counts = {
				scheduled: data.scheduled || 0,
				inProgress: data.inProgress || 0,
				completed: data.completed || 0,
				total: data.total || 0
			};
			setCounts(counts);
			return counts;
		} catch (err) {
			console.error('Error fetching counts:', err);
			return null;
		}
	}, []);

	const startTask = useCallback(async (taskId) => {
		setActionLoading(true);
		try {
			const response = await housekeepingApi.startTask(taskId);
			console.log('Start task response:', response.data);

			// Refresh data
			await Promise.all([fetchTasks(), fetchTodayTasks(), fetchTaskCounts()]);

			notifications.show({
				title: 'Success',
				message: 'Task started successfully',
				color: 'green'
			});

			return {success: true, data: response.data.data};
		} catch (error) {
			console.error('Start task error:', error);
			const message = error.response?.data?.message || 'Failed to start task';
			notifications.show({
				title: 'Error',
				message: message,
				color: 'red'
			});
			return {success: false, error: message};
		} finally {
			setActionLoading(false);
		}
	}, [fetchTasks, fetchTodayTasks, fetchTaskCounts]);

	const completeTask = useCallback(async (taskId) => {
		setActionLoading(true);
		try {
			const response = await housekeepingApi.completeTask(taskId);
			console.log('Complete task response:', response.data);

			// Refresh data
			await Promise.all([fetchTasks(), fetchTodayTasks(), fetchTaskCounts()]);

			notifications.show({
				title: 'Success',
				message: 'Task completed successfully',
				color: 'green'
			});

			return {success: true, data: response.data.data};
		} catch (error) {
			console.error('Complete task error:', error);
			const message = error.response?.data?.message || 'Failed to complete task';
			notifications.show({
				title: 'Error',
				message: message,
				color: 'red'
			});
			return {success: false, error: message};
		} finally {
			setActionLoading(false);
		}
	}, [fetchTasks, fetchTodayTasks, fetchTaskCounts]);

	// ==================== MINIBAR FUNCTIONS ====================
	const fetchMinibarItems = useCallback(async (roomId) => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getMinibarItems(roomId);
			console.log('Minibar items response:', response.data);
			setMinibarItems(response.data.data || []);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching minibar items:', err);
			notifications.show({
				title: 'Error',
				message: 'Unable to load minibar items',
				color: 'red'
			});
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const reportMinibarConsumption = useCallback(async (data) => {
		setActionLoading(true);
		try {
			const response = await housekeepingApi.reportMinibarConsumption(data);
			console.log('Minibar report response:', response.data);

			notifications.show({
				title: 'Success',
				message: `Minibar consumption recorded - $${response.data.data?.total?.toFixed(2) || '0.00'} added to folio`,
				color: 'green'
			});

			return {success: true, data: response.data.data};
		} catch (error) {
			console.error('Minibar report error:', error);
			const message = error.response?.data?.message || 'Failed to record minibar consumption';
			notifications.show({
				title: 'Error',
				message: message,
				color: 'red'
			});
			return {success: false, error: message};
		} finally {
			setActionLoading(false);
		}
	}, []);

	const fetchMinibarHistory = useCallback(async (reservationId) => {
		try {
			const response = await housekeepingApi.getMinibarHistory(reservationId);
			console.log('Minibar history response:', response.data);
			return response.data.data || [];
		} catch (err) {
			console.error('Error fetching minibar history:', err);
			return [];
		}
	}, []);

	// ==================== DAMAGE FUNCTIONS ====================
	const fetchDamageReports = useCallback(async () => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getMyDamageReports();
			console.log('Damage reports response:', response.data);
			setDamageReports(response.data.data || []);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching damage reports:', err);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const reportDamage = useCallback(async (data) => {
		setActionLoading(true);
		try {
			const response = await housekeepingApi.reportDamage(data);
			console.log('Damage report response:', response.data);

			notifications.show({
				title: 'Success',
				message: `Damage reported - Penalty: $${response.data.data?.penaltyAmount?.toFixed(2) || '0.00'}`,
				color: 'green'
			});

			// Refresh damage reports
			await fetchDamageReports();

			return {success: true, data: response.data.data};
		} catch (error) {
			console.error('Damage report error:', error);
			const message = error.response?.data?.message || 'Failed to report damage';
			notifications.show({
				title: 'Error',
				message: message,
				color: 'red'
			});
			return {success: false, error: message};
		} finally {
			setActionLoading(false);
		}
	}, [fetchDamageReports]);

	const resolveDamage = useCallback(async (reportId) => {
		setActionLoading(true);
		try {
			const response = await housekeepingApi.resolveDamage(reportId);
			console.log('Resolve damage response:', response.data);

			notifications.show({
				title: 'Success',
				message: 'Damage report resolved',
				color: 'green'
			});

			// Refresh damage reports
			await fetchDamageReports();

			return {success: true, data: response.data.data};
		} catch (error) {
			console.error('Resolve damage error:', error);
			const message = error.response?.data?.message || 'Failed to resolve damage';
			notifications.show({
				title: 'Error',
				message: message,
				color: 'red'
			});
			return {success: false, error: message};
		} finally {
			setActionLoading(false);
		}
	}, [fetchDamageReports]);

	// ==================== SCHEDULE FUNCTIONS ====================
	const fetchMySchedule = useCallback(async (startDate, endDate) => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getMySchedule(startDate, endDate);
			console.log('Schedule response:', response.data);
			setSchedule(response.data.data || []);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching schedule:', err);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchTodaySchedule = useCallback(async () => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getTodaySchedule();
			console.log('Today schedule response:', response.data);
			setTodaySchedule(response.data.data || null);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching today schedule:', err);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchScheduleSummary = useCallback(async () => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getScheduleSummary();
			console.log('Schedule summary response:', response.data);
			setScheduleSummary(response.data.data || {});
			return response.data.data;
		} catch (err) {
			console.error('Error fetching schedule summary:', err);
			return {};
		} finally {
			setLoading(false);
		}
	}, []);

	// ==================== REPORTS FUNCTIONS ====================
	const fetchPerformanceReport = useCallback(async (startDate, endDate) => {
		try {
			setLoading(true);
			const response = await housekeepingApi.getPerformanceReport(startDate, endDate);
			console.log('Performance report response:', response.data);
			setPerformanceReport(response.data.data || null);
			return response.data.data;
		} catch (err) {
			console.error('Error fetching performance report:', err);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	// ==================== REFRESH ALL ====================
	const refreshAll = useCallback(async () => {
		setLoading(true);
		try {
			await Promise.allSettled([
				fetchTasks(),
				fetchTodayTasks(),
				fetchTaskCounts(),
				fetchDamageReports(),
				fetchTodaySchedule(),
				fetchScheduleSummary()
			]);

		} catch (error) {
			console.error('Refresh error:', error);
		} finally {
			setLoading(false);
		}
	}, [fetchTasks, fetchTodayTasks, fetchTaskCounts, fetchDamageReports, fetchTodaySchedule, fetchScheduleSummary]);

	// Initial load
	useEffect(() => {
		refreshAll();
	}, []);

	return {
		// Tasks
		tasks,
		todayTasks,
		counts,
		isLoading: loading,
		actionLoading,
		error,
		fetchTasks,
		fetchTodayTasks,
		fetchTaskCounts,
		startTask,
		completeTask,

		// Minibar
		minibarItems,
		fetchMinibarItems,
		reportMinibarConsumption,
		fetchMinibarHistory,

		// Damage
		damageReports,
		fetchDamageReports,
		reportDamage,
		resolveDamage,

		// Schedule
		schedule,
		todaySchedule,
		scheduleSummary,
		fetchMySchedule,
		fetchTodaySchedule,
		fetchScheduleSummary,

		// Reports
		performanceReport,
		fetchPerformanceReport,

		// Refresh
		refreshAll
	};
};