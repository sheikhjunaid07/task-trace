import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useAddColumnMutation,
  useRenameColumnMutation,
  useRemoveColumnMutation,
  useReorderColumnsMutation,
  useUpdateColumnWipLimitMutation,
  useArchiveColumnMutation,
  useGetBoardArchivesQuery,
  useRestoreArchivedItemMutation,
  usePermanentDeleteArchivedItemMutation,
  useUpdateMemberRoleMutation,
  useTransferOwnershipMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useGetBoardInvitationsQuery,
} from '../../../api/boardApi';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setSelectedProjectId } from '../../board/boardSlice';
import type { BoardLabel, Column, Task } from '../../../types';
import { showToast } from '../../../utils/toast';
import {
  Sliders,
  Users,
  LayoutList,
  AlertOctagon,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  Shield,
  ShieldAlert,
  Globe,
  Lock,
  ChevronUp,
  ChevronDown,
  Edit2,
  X,
  FolderKanban,
  AlertTriangle,
  Tag,
  Mail,
  Send,
  ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const PRESET_COLORS = [
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Slate', hex: '#64748b' },
];

export const ProjectSettingsPage: React.FC = () => {
  const { boardId: urlBoardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);

  const { data: boardsData, isLoading: isBoardsListLoading } = useGetBoardsQuery();
  const boards = boardsData?.data || [];

  const targetBoardId =
    urlBoardId ||
    selectedProjectId ||
    (boards.length > 0 ? boards[0]._id : '');

  const {
    data: boardData,
    isLoading: isBoardLoading,
    error: boardError,
  } = useGetBoardByIdQuery(targetBoardId, { skip: !targetBoardId });

  const { data: archivesData, refetch: refetchArchives } = useGetBoardArchivesQuery(targetBoardId, {
    skip: !targetBoardId,
  });
  const { data: invitationsData, refetch: refetchInvitations } = useGetBoardInvitationsQuery(targetBoardId, {
    skip: !targetBoardId,
  });

  const [updateBoard, { isLoading: isUpdatingBoard }] = useUpdateBoardMutation();
  const [deleteBoard, { isLoading: isDeletingBoard }] = useDeleteBoardMutation();
  const [updateMemberRole, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [transferOwnership, { isLoading: isTransferring }] = useTransferOwnershipMutation();
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [addColumn, { isLoading: isAddingColumn }] = useAddColumnMutation();
  const [renameColumn] = useRenameColumnMutation();
  const [removeColumn] = useRemoveColumnMutation();
  const [reorderColumns] = useReorderColumnsMutation();
  const [updateColumnWipLimit] = useUpdateColumnWipLimitMutation();
  const [archiveColumnMutation] = useArchiveColumnMutation();
  const [restoreArchivedItem] = useRestoreArchivedItemMutation();
  const [permanentDeleteArchivedItem] = usePermanentDeleteArchivedItemMutation();

  const [activeTab, setActiveTab] = useState<'metadata' | 'access' | 'workflow' | 'danger'>('metadata');

  // Metadata form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('#8b5cf6');
  const [projectAvatarUrl, setProjectAvatarUrl] = useState('');
  const [projectVisibility, setProjectVisibility] = useState<'public' | 'private'>('private');
  const [labels, setLabels] = useState<BoardLabel[]>([]);

  // New label state
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#ef4444');

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');

  // Workflow state
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const [archiveSubTab, setArchiveSubTab] = useState<'tasks' | 'columns'>('tasks');

  // Danger state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const board = boardData?.data;

  // Sync form state when board data loads
  useEffect(() => {
    if (board) {
      setProjectName(board.name || board.title || '');
      setProjectDescription(board.description || '');
      setProjectColor(board.color || '#8b5cf6');
      setProjectAvatarUrl(board.avatarUrl || '');
      setProjectVisibility(board.visibility || 'private');
      setLabels(board.labels ? [...board.labels] : []);
    }
  }, [board]);

  const ownerId = board?.owner
    ? typeof board.owner === 'object' && board.owner !== null
      ? (board.owner as any)._id
      : board.owner
    : '';

  const isCurrentOwner = String(ownerId) === String(currentUser?._id);
  const currentMemberRole = board?.memberRoles?.find(
    (mr: any) => String(typeof mr.user === 'object' ? mr.user?._id : mr.user) === String(currentUser?._id)
  );
  const isCurrentAdmin = isCurrentOwner || currentMemberRole?.role === 'admin';

  // Handle Metadata save
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBoardId || !projectName.trim()) return;

    try {
      await updateBoard({
        boardId: targetBoardId,
        name: projectName.trim(),
        title: projectName.trim(),
        description: projectDescription.trim(),
        color: projectColor,
        avatarUrl: projectAvatarUrl.trim() || null,
        visibility: projectVisibility,
        labels,
      }).unwrap();

      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Project Settings Saved',
        message: 'Project metadata and appearance updated successfully.',
      });

      dispatch(setSelectedProjectId(targetBoardId));
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to update board', err);
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Update Failed',
        message: err?.data?.message || 'Could not update project settings.',
      });
    }
  };

  // Add Label
  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    const newLbl: BoardLabel = {
      name: newLabelName.trim(),
      color: newLabelColor,
    };
    const updated = [...labels, newLbl];
    setLabels(updated);
    setNewLabelName('');
  };

  // Delete Label
  const handleDeleteLabel = (idx: number) => {
    const updated = labels.filter((_, i) => i !== idx);
    setLabels(updated);
  };

  // Invite member
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !targetBoardId) return;

    try {
      await inviteMember({ boardId: targetBoardId, email: inviteEmail.trim() }).unwrap();
      showToast({
        type: 'MEMBER_JOINED',
        title: 'Invitation Sent',
        message: `Sent invitation request to ${inviteEmail.trim()}`,
      });
      setInviteEmail('');
      refetchInvitations();
    } catch (err: any) {
      console.error('Failed to invite member', err);
      showToast({
        type: 'MEMBER_JOINED',
        title: 'Invitation Failed',
        message: err?.data?.message || 'Failed to send invitation.',
      });
    }
  };

  // Change member role
  const handleChangeRole = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!targetBoardId) return;
    try {
      await updateMemberRole({ boardId: targetBoardId, userId, role: newRole }).unwrap();
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Permission Updated',
        message: `Member role set to ${newRole}`,
      });
    } catch (err: any) {
      console.error('Failed to update role', err);
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Update Failed',
        message: err?.data?.message || 'Could not change member role.',
      });
    }
  };

  // Kick member
  const handleKickMember = async (userId: string, memberName: string) => {
    if (!targetBoardId) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;

    try {
      await removeMember({ boardId: targetBoardId, memberId: userId }).unwrap();
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Member Removed',
        message: `${memberName} was removed from the project.`,
      });
    } catch (err: any) {
      console.error('Failed to remove member', err);
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Action Failed',
        message: err?.data?.message || 'Could not remove member.',
      });
    }
  };

  // Workflow: Add Column
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !targetBoardId) return;

    try {
      await addColumn({ boardId: targetBoardId, name: newColumnName.trim() }).unwrap();
      showToast({
        type: 'TASK_CREATED',
        title: 'Column Added',
        message: `Added workflow column "${newColumnName.trim()}"`,
      });
      setNewColumnName('');
    } catch (err: any) {
      console.error('Failed to add column', err);
    }
  };

  // Workflow: Rename Column
  const handleRenameColumn = async (columnId: string) => {
    if (!editingColName.trim() || !targetBoardId) {
      setEditingColId(null);
      return;
    }
    try {
      await renameColumn({ boardId: targetBoardId, columnId, name: editingColName.trim() }).unwrap();
      showToast({
        type: 'TASK_UPDATED',
        title: 'Column Renamed',
        message: `Column renamed to "${editingColName.trim()}"`,
      });
      setEditingColId(null);
    } catch (err: any) {
      console.error('Failed to rename column', err);
    }
  };

  // Workflow: Move Column (Reorder)
  const handleMoveColumn = async (columnId: string, direction: 'up' | 'down') => {
    if (!board || !board.columns || !targetBoardId) return;
    const activeCols = board.columns.filter((c) => !c.isArchived);
    const index = activeCols.findIndex((c) => c._id === columnId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeCols.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newOrder = [...activeCols];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const columnIds = newOrder.map((c) => c._id);
    try {
      await reorderColumns({ boardId: targetBoardId, columnIds }).unwrap();
    } catch (err) {
      console.error('Failed to reorder columns', err);
    }
  };

  // Workflow: Set WIP Limit
  const handleSetWipLimit = async (columnId: string, limitValue: string) => {
    if (!targetBoardId) return;
    const parsed = parseInt(limitValue, 10);
    const wipLimit = isNaN(parsed) || parsed <= 0 ? null : parsed;

    try {
      await updateColumnWipLimit({ boardId: targetBoardId, columnId, wipLimit }).unwrap();
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'WIP Limit Updated',
        message: wipLimit ? `WIP Limit set to ${wipLimit} cards.` : 'WIP Limit removed (unlimited).',
      });
    } catch (err: any) {
      console.error('Failed to update WIP limit', err);
    }
  };

  // Workflow: Archive Column
  const handleArchiveColumn = async (columnId: string, columnName: string) => {
    if (!targetBoardId) return;
    if (!window.confirm(`Archive column "${columnName}"? Its cards will also be hidden from the active board.`)) return;

    try {
      await archiveColumnMutation({ boardId: targetBoardId, columnId, isArchived: true }).unwrap();
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Column Archived',
        message: `Column "${columnName}" archived. You can restore it anytime in Archive Management.`,
      });
      refetchArchives();
    } catch (err: any) {
      console.error('Failed to archive column', err);
    }
  };

  // Workflow: Delete Column
  const handleDeleteColumn = async (columnId: string, columnName: string) => {
    if (!targetBoardId) return;
    if (!window.confirm(`Permanently delete column "${columnName}" and all tasks inside it? This cannot be undone.`)) return;

    try {
      await removeColumn({ boardId: targetBoardId, columnId }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Column Deleted',
        message: `Column "${columnName}" was deleted.`,
      });
    } catch (err: any) {
      console.error('Failed to delete column', err);
    }
  };

  // Archive restore
  const handleRestoreArchive = async (type: 'task' | 'column', itemId: string) => {
    if (!targetBoardId) return;
    try {
      await restoreArchivedItem({ boardId: targetBoardId, type, itemId }).unwrap();
      showToast({
        type: 'TASK_CREATED',
        title: 'Item Restored',
        message: `Restored ${type} back to the active board.`,
      });
      refetchArchives();
    } catch (err: any) {
      console.error('Failed to restore item', err);
    }
  };

  // Archive permanent delete
  const handlePermanentDeleteArchive = async (type: 'task' | 'column', itemId: string) => {
    if (!targetBoardId) return;
    if (!window.confirm(`Permanently delete this ${type}? It will be destroyed forever.`)) return;

    try {
      await permanentDeleteArchivedItem({ boardId: targetBoardId, type, itemId }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Permanently Deleted',
        message: `${type === 'task' ? 'Card' : 'Column'} was permanently destroyed.`,
      });
      refetchArchives();
    } catch (err: any) {
      console.error('Failed to delete item', err);
    }
  };

  // Danger: Transfer Ownership
  const handleConfirmTransfer = async () => {
    if (!targetBoardId || !selectedNewOwnerId) return;
    try {
      await transferOwnership({ boardId: targetBoardId, newOwnerId: selectedNewOwnerId }).unwrap();
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Ownership Transferred',
        message: 'Board ownership transferred successfully.',
      });
      setIsTransferModalOpen(false);
    } catch (err: any) {
      console.error('Failed to transfer ownership', err);
      showToast({
        type: 'PROJECT_UPDATED',
        title: 'Transfer Failed',
        message: err?.data?.message || 'Could not transfer ownership.',
      });
    }
  };

  // Danger: Delete Board
  const handleConfirmDeleteBoard = async () => {
    if (!board || !targetBoardId) return;
    if (deleteConfirmationInput.trim() !== (board.name || board.title || '')) {
      return;
    }

    try {
      await deleteBoard(targetBoardId).unwrap();
      showToast({
        type: 'PROJECT_DELETED',
        title: 'Project Deleted',
        message: `Project "${board.name || board.title}" has been permanently destroyed.`,
      });
      setIsDeleteModalOpen(false);
      navigate('/boards');
    } catch (err: any) {
      console.error('Failed to delete board', err);
      showToast({
        type: 'PROJECT_DELETED',
        title: 'Delete Failed',
        message: err?.data?.message || 'Failed to delete project.',
      });
    }
  };

  if (isBoardsListLoading || (targetBoardId && isBoardLoading)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 skeleton w-48" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    );
  }

  if (boardError || !board) {
    return (
      <div className="max-w-md mx-auto my-16 text-center glass-card p-8 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
        <p className="text-sm text-mute mb-6">
          Could not find the project settings. Please select an existing project from your workspace.
        </p>
        <Link to="/boards" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const activeColumns = (board.columns || []).filter((c) => !c.isArchived);
  const archivedTasks = archivesData?.data?.tasks || [];
  const archivedColumns = archivesData?.data?.columns || [];
  const pendingInvitations = invitationsData?.data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 text-ink">
      {/* Top Breadcrumb & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-edge mb-6">
        <div className="flex items-center space-x-3">
          <Link
            to={`/boards/${board._id}`}
            className="w-9 h-9 rounded-xl bg-surface hover:bg-white/10 border border-edge flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Back to Kanban Board"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
                {board.name || board.title}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  isCurrentOwner
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isCurrentAdmin
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}
              >
                {isCurrentOwner ? 'Owner' : isCurrentAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
            <p className="text-xs text-mute mt-0.5">Project Settings & Configuration</p>
          </div>
        </div>

        {/* Project Switcher Dropdown if user has multiple boards */}
        {boards.length > 1 && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-mute font-medium shrink-0">Switch Project:</span>
            <select
              value={board._id}
              onChange={(e) => navigate(`/boards/${e.target.value}/settings`)}
              className="bg-surface border border-edge text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-400 cursor-pointer flex-1 sm:flex-none max-w-full"
            >
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name || b.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-edge pb-2 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'metadata'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Project Info & Metadata</span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'access'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Access & Collaboration</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {(board.members?.length || 0) + 1}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workflow'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          <span>3. Workflow & Customization</span>
          {archivedTasks.length + archivedColumns.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40">
              {archivedTasks.length + archivedColumns.length} archived
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>4. Danger Zone</span>
        </button>
      </div>

      {/* TAB 1: PROJECT INFO & METADATA */}
      {activeTab === 'metadata' && (
        <form onSubmit={handleSaveMetadata} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Name & Description */}
              <div className="glass-card p-6 rounded-2xl border border-edge space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  General Information
                </h3>

                <div>
                  <label className="label">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Universal Kanban Engine"
                    className="input w-full"
                    maxLength={100}
                  />
                  <p className="text-[11px] text-mute mt-1">
                    The public display name for this collaborative board.
                  </p>
                </div>

                <div>
                  <label className="label">Description & Scope</label>
                  <textarea
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Brief overview of project goals, team targets, or documentation..."
                    className="input w-full resize-none"
                    maxLength={500}
                  />
                  <p className="text-[11px] text-mute mt-1">
                    Summarize what this board is used for (max 500 characters).
                  </p>
                </div>
              </div>

              {/* Global Categories / Labels */}
              <div className="glass-card p-6 rounded-2xl border border-edge space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Global Tags & Categories
                  </h3>
                  <span className="text-xs text-mute font-medium">{labels.length} tags defined</span>
                </div>
                <p className="text-xs text-slate-300">
                  Global tags can be applied to tasks to categorize issues, features, priority levels, or sprints.
                </p>

                {/* Add new tag inline form */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-surface/50 border border-edge">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="New tag (e.g. Bug, Feature, Urgent)..."
                    className="input flex-1 min-w-[160px] text-xs py-1.5"
                    maxLength={30}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                  />
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewLabelColor(c.hex)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                          newLabelColor === c.hex ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    disabled={!newLabelName.trim()}
                    className="btn btn-primary py-1.5 px-3 text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>

                {/* Current tags list */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {labels.map((lbl, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold"
                      style={{
                        backgroundColor: `${lbl.color}20`,
                        borderColor: `${lbl.color}50`,
                        color: lbl.color,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.color }} />
                      <span>{lbl.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLabel(idx)}
                        className="hover:opacity-75 cursor-pointer ml-1 text-slate-400 hover:text-white"
                        title="Delete Tag"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {labels.length === 0 && (
                    <p className="text-xs text-mute italic">No tags defined yet. Add some above!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Live Preview Badge */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-edge sticky top-6 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  LIVE WORKSPACE PREVIEW
                </span>
                <p className="text-xs text-slate-300">
                  Here is how this project badge will appear in your sidebar, header, and dashboard stats.
                </p>

                {/* Simulated Sidebar Header Card */}
                <div className="glass-card p-4 rounded-2xl border border-edge shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      PROJECT SUMMARY
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                      }}
                    >
                      <FolderKanban className="w-4 h-4 text-accent" />
                    </div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                      {projectName.trim() || 'Untitled Project'}
                    </h4>
                  </div>

                  {projectDescription && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 pt-1 border-t border-edge">
                      {projectDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-purple-400" />
                    <span>Visibility: {projectVisibility}</span>
                  </div>
                </div>

                {/* Save Changes Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingBoard || !projectName.trim()}
                    className="btn btn-primary w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30"
                  >
                    {isUpdatingBoard ? (
                      <span>Saving Changes...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Settings Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: ACCESS & COLLABORATION */}
      {activeTab === 'access' && (
        <div className="space-y-8">
          {/* Visibility Toggle Card */}
          <div className="glass-card p-6 rounded-2xl border border-edge space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Project Visibility & Access Mode
            </h3>
            <p className="text-xs text-slate-300">
              Control who can discover, view, and join this project board within your team workspace.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Private Option */}
              <div
                onClick={async () => {
                  setProjectVisibility('private');
                  if (targetBoardId) {
                    await updateBoard({ boardId: targetBoardId, visibility: 'private' });
                    showToast({
                      type: 'PROJECT_UPDATED',
                      title: 'Visibility Changed',
                      message: 'Project is now Private (invite-only).',
                    });
                  }
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                  projectVisibility === 'private'
                    ? 'bg-purple-600/20 border-purple-500 shadow-md ring-1 ring-purple-500/40'
                    : 'bg-surface hover:bg-white/5 border-edge'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Private (Invite-Only)</h4>
                    {projectVisibility === 'private' && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mute mt-1 leading-relaxed">
                    Only members explicitly invited by an Admin or Owner can access tasks, comments, and project details.
                  </p>
                </div>
              </div>

              {/* Public Option */}
              <div
                onClick={async () => {
                  setProjectVisibility('public');
                  if (targetBoardId) {
                    await updateBoard({ boardId: targetBoardId, visibility: 'public' });
                    showToast({
                      type: 'PROJECT_UPDATED',
                      title: 'Visibility Changed',
                      message: 'Project is now Public to workspace members.',
                    });
                  }
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                  projectVisibility === 'public'
                    ? 'bg-cyan-600/20 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-surface hover:bg-white/5 border-edge'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Public (Team Workspace)</h4>
                    {projectVisibility === 'public' && (
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mute mt-1 leading-relaxed">
                    Any registered member in your workspace can view this board, explore tasks, and join collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Management & RBAC */}
          <div className="glass-card p-6 rounded-2xl border border-edge space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Team Members & Role-Based Permissions (RBAC)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Assign administrative rights, task authoring permissions, or viewer access.
                </p>
              </div>

              {/* Quick Invite Form */}
              <form onSubmit={handleInviteSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="input pl-8 py-1.5 text-xs w-48 sm:w-56"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="btn btn-primary py-1.5 px-3 text-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </form>
            </div>

            {/* Members List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-edge text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {/* Board Owner Row */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {typeof board.owner === 'object' && (board.owner as any).name
                            ? (board.owner as any).name[0]
                            : 'O'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {typeof board.owner === 'object' && (board.owner as any).name
                              ? (board.owner as any).name
                              : 'Project Owner'}
                          </span>
                          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Board Owner
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300 font-mono text-[11px]">
                      {typeof board.owner === 'object' && (board.owner as any).email
                        ? (board.owner as any).email
                        : '—'}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Owner
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-mute text-[11px] italic">
                      Primary Admin
                    </td>
                  </tr>

                  {/* Other Board Members */}
                  {(board.members || []).map((m: any) => {
                    const mId = typeof m === 'object' ? m._id : m;
                    const mName = typeof m === 'object' ? m.name : 'Team Member';
                    const mEmail = typeof m === 'object' ? m.email : '—';
                    const roleObj = board.memberRoles?.find(
                      (mr: any) => String(typeof mr.user === 'object' ? mr.user?._id : mr.user) === String(mId)
                    );
                    const currentRole = roleObj?.role || 'member';

                    return (
                      <tr key={mId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase">
                              {mName ? mName[0] : 'U'}
                            </div>
                            <span className="font-bold text-white block">{mName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300 font-mono text-[11px]">{mEmail}</td>
                        <td className="py-3.5">
                          {isCurrentAdmin ? (
                            <select
                              value={currentRole}
                              onChange={(e) => handleChangeRole(mId, e.target.value as any)}
                              disabled={isUpdatingRole}
                              className="bg-surface border border-edge rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                            >
                              <option value="admin">Admin (Full Control)</option>
                              <option value="member">Member (Create & Edit)</option>
                              <option value="viewer">Viewer (Read-Only)</option>
                            </select>
                          ) : (
                            <span className="capitalize text-slate-300 font-semibold">{currentRole}</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => handleKickMember(mId, mName)}
                              className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Section */}
          {pendingInvitations.length > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-edge space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="divide-y divide-edge">
                {pendingInvitations.map((inv: any) => (
                  <div key={inv._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{inv.inviteeEmail}</span>
                      <span className="text-mute ml-2 text-[11px]">
                        Status: <span className="text-amber-400 capitalize">{inv.status}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-mute">
                      Sent {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORKFLOW & BOARD CUSTOMIZATION */}
      {activeTab === 'workflow' && (
        <div className="space-y-8">
          {/* Workflow Columns Manager */}
          <div className="glass-card p-6 rounded-2xl border border-edge space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-purple-400" />
                  Workflow Columns & Steps
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Rename, reorder, add columns, and enforce WIP (Work in Progress) limits.
                </p>
              </div>

              {/* Add Column Input Form */}
              <form onSubmit={handleAddColumn} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="New Column (e.g. Testing, Blocked)..."
                  className="input py-1.5 px-3 text-xs w-48 sm:w-60"
                  maxLength={50}
                />
                <button
                  type="submit"
                  disabled={isAddingColumn || !newColumnName.trim()}
                  className="btn btn-primary py-1.5 px-3 text-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Column</span>
                </button>
              </form>
            </div>

            {/* Columns List */}
            <div className="space-y-3">
              {activeColumns.map((col, idx) => (
                <div
                  key={col._id}
                  className="p-4 rounded-xl bg-surface/80 border border-edge hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Reorder buttons & Title */}
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(col._id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move column left/up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(col._id, 'down')}
                        disabled={idx === activeColumns.length - 1}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move column right/down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-slate-300">
                      {idx + 1}
                    </span>

                    {editingColId === col._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          autoFocus
                          value={editingColName}
                          onChange={(e) => setEditingColName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameColumn(col._id);
                            if (e.key === 'Escape') setEditingColId(null);
                          }}
                          className="input py-1 px-2 text-xs font-bold w-44"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameColumn(col._id)}
                          className="icon-btn w-6 h-6 text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingColId(null)}
                          className="icon-btn w-6 h-6 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white tracking-wide">{col.name}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingColId(col._id);
                            setEditingColName(col.name);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                          title="Rename Column"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: WIP Limit & Actions */}
                  <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                    {/* WIP Limit Input */}
                    <div className="flex items-center space-x-2 bg-black/20 border border-white/5 px-3 py-1.5 rounded-xl">
                      <span className="text-[11px] text-slate-300 font-semibold shrink-0">
                        WIP Limit:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        defaultValue={col.wipLimit ?? ''}
                        placeholder="Unlimited"
                        onBlur={(e) => handleSetWipLimit(col._id, e.target.value)}
                        className="w-16 bg-surface border border-edge text-xs font-mono text-center rounded px-1.5 py-0.5 text-white focus:outline-none focus:border-purple-400"
                      />
                      <span className="text-[10px] text-mute">cards</span>
                    </div>

                    {/* Archive Column Button */}
                    <button
                      type="button"
                      onClick={() => handleArchiveColumn(col._id, col.name)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all flex items-center space-x-1"
                      title="Archive column and cards"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>

                    {/* Delete Column Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col._id, col.name)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center space-x-1"
                      title="Permanently delete column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Archive Management Section */}
          <div className="glass-card p-6 rounded-2xl border border-edge space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-400" />
                  Archive Management
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  View, restore, or permanently delete archived cards and columns.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center space-x-2 bg-surface p-1 rounded-xl border border-edge">
                <button
                  type="button"
                  onClick={() => setArchiveSubTab('tasks')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    archiveSubTab === 'tasks'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Archived Cards ({archivedTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveSubTab('columns')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    archiveSubTab === 'columns'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Archived Columns ({archivedColumns.length})
                </button>
              </div>
            </div>

            {/* Archived Cards List */}
            {archiveSubTab === 'tasks' && (
              <div className="space-y-2.5">
                {archivedTasks.map((t: Task) => (
                  <div
                    key={t._id}
                    className="p-3.5 rounded-xl bg-surface/50 border border-edge flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{t.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-mute">
                        <span className="capitalize text-purple-400">Priority: {t.priority}</span>
                        <span>•</span>
                        <span>Archived on {new Date(t.updatedAt || '').toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreArchive('task', t._id)}
                        className="btn btn-ghost py-1 px-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center space-x-1"
                        title="Restore card back to active board"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteArchive('task', t._id)}
                        className="btn btn-ghost py-1 px-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-1"
                        title="Permanently delete from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                ))}

                {archivedTasks.length === 0 && (
                  <div className="text-center py-8 text-mute text-xs">
                    <Archive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No archived cards for this project.</p>
                  </div>
                )}
              </div>
            )}

            {/* Archived Columns List */}
            {archiveSubTab === 'columns' && (
              <div className="space-y-2.5">
                {archivedColumns.map((c: Column) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl bg-surface/50 border border-edge flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <p className="text-[11px] text-mute mt-0.5">Archived workflow column</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreArchive('column', c._id)}
                        className="btn btn-ghost py-1 px-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Column</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteArchive('column', c._id)}
                        className="btn btn-ghost py-1 px-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                ))}

                {archivedColumns.length === 0 && (
                  <div className="text-center py-8 text-mute text-xs">
                    <Archive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No archived columns for this project.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold">Caution: High-Risk Destructive Actions</span>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                The actions below can transfer full authority or permanently erase your board and its contents.
              </p>
            </div>
          </div>

          {/* Transfer Ownership Card */}
          <div className="glass-card p-6 rounded-2xl border border-edge space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  Transfer Project Ownership
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Transfer primary administrative rights of this board to another team member. You will automatically become an Admin with continued access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={!isCurrentOwner || (board.members || []).length === 0}
                className="btn btn-ghost text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 text-xs font-bold py-2 px-4 shrink-0 disabled:opacity-40"
              >
                Transfer Ownership
              </button>
            </div>
            {!isCurrentOwner && (
              <p className="text-[11px] text-mute italic">
                Only the current board owner can initiate ownership transfer.
              </p>
            )}
            {isCurrentOwner && (board.members || []).length === 0 && (
              <p className="text-[11px] text-amber-400/80">
                To transfer ownership, please invite at least one team member to this board first.
              </p>
            )}
          </div>

          {/* Delete Project Card */}
          <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Delete Project Board
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Permanently destroy this board, all workflow columns, cards, member invitations, activity logs, and comments. This action cannot be reversed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationInput('');
                  setIsDeleteModalOpen(true);
                }}
                disabled={!isCurrentOwner}
                className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-4 shadow-lg shadow-rose-600/30 shrink-0 disabled:opacity-40"
              >
                Delete Project
              </button>
            </div>
            {!isCurrentOwner && (
              <p className="text-[11px] text-mute italic">
                Only the board owner has authority to delete this project.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md modal-panel p-6 relative"
            >
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="icon-btn absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <ArrowRightLeft className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">Transfer Board Ownership</h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Select a team member to take over ownership of{' '}
                <span className="font-semibold text-white">"{board.name || board.title}"</span>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label">Select New Owner</label>
                  <select
                    value={selectedNewOwnerId}
                    onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                    className="input w-full cursor-pointer text-xs"
                  >
                    <option value="">-- Choose a team member --</option>
                    {(board.members || []).map((m: any) => {
                      const mId = typeof m === 'object' ? m._id : m;
                      const mName = typeof m === 'object' ? m.name : 'Member';
                      const mEmail = typeof m === 'object' ? m.email : '';
                      return (
                        <option key={mId} value={mId}>
                          {mName} ({mEmail})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    disabled={isTransferring || !selectedNewOwnerId}
                    className="btn bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                  >
                    {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM PROJECT DESTRUCTION MODAL (Requires typing exact board name) */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md modal-panel p-6 relative border border-rose-500/40"
            >
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="icon-btn absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-rose-400 mb-1">Delete Project Permanently</h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                This will immediately destroy the project and all its cards. To confirm, please type the project name{' '}
                <span className="font-bold text-white font-mono bg-white/10 px-1 py-0.5 rounded">
                  {board.name || board.title}
                </span>{' '}
                below:
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    autoFocus
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    placeholder={board.name || board.title}
                    className="input w-full text-xs font-mono border-rose-500/50"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBoard}
                    disabled={
                      isDeletingBoard ||
                      deleteConfirmationInput.trim() !== (board.name || board.title)
                    }
                    className="btn bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isDeletingBoard ? 'Deleting...' : 'I Understand, Delete Project'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
