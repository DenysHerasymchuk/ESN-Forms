import { useEffect, useState } from 'react'
import { FaPen, FaPlus, FaShieldHalved, FaTrash, FaUserMinus, FaUserPlus, FaUsers } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../auth/useAuth'
import { createUserAsAdmin, deleteUserAsAdmin, listUsers, setUserRole, updateUserAsAdmin } from '../lib/adminApi'
import { getErrorMessage } from '../lib/errors'
import type { ProfileRow } from '../lib/database.types'

export function AdminUsersPage() {
  const { profile: currentProfile } = useAuth()

  const [users, setUsers] = useState<ProfileRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingUser, setDeletingUser] = useState<ProfileRow | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    void loadUsers()
  }, [])

  async function loadUsers() {
    setIsLoading(true)
    setLoadError('')
    try {
      setUsers(await listUsers())
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load users.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleRole(user: ProfileRow) {
    const nextRole = user.role === 'admin' ? 'member' : 'admin'
    setUpdatingId(user.id)
    setRoleError('')
    try {
      const updated = await setUserRole(user.id, nextRole)
      setUsers((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)))
    } catch (error) {
      setRoleError(getErrorMessage(error, 'Failed to update the role.'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCreate() {
    if (!newEmail.trim() || !newPassword) {
      setCreateError('Email and password are required.')
      return
    }
    setIsCreating(true)
    setCreateError('')
    try {
      await createUserAsAdmin(newEmail.trim(), newPassword)
      setIsCreateOpen(false)
      setNewEmail('')
      setNewPassword('')
      void loadUsers()
    } catch (error) {
      setCreateError(getErrorMessage(error, 'Failed to create the account.'))
    } finally {
      setIsCreating(false)
    }
  }

  function openEdit(user: ProfileRow) {
    setEditingUser(user)
    setEditEmail(user.email)
    setEditPassword('')
    setEditError('')
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    if (!editEmail.trim()) {
      setEditError('Email is required.')
      return
    }
    setIsSavingEdit(true)
    setEditError('')
    try {
      const updates: { email?: string; password?: string } = {}
      if (editEmail.trim() !== editingUser.email) updates.email = editEmail.trim()
      if (editPassword) updates.password = editPassword

      if (Object.keys(updates).length === 0) {
        setEditingUser(null)
        return
      }

      await updateUserAsAdmin(editingUser.id, updates)
      setEditingUser(null)
      void loadUsers()
    } catch (error) {
      setEditError(getErrorMessage(error, 'Failed to update the account.'))
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteUserAsAdmin(deletingUser.id)
      setUsers((prev) => prev.filter((user) => user.id !== deletingUser.id))
      setDeletingUser(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Failed to delete the account.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: DataTableColumn<ProfileRow>[] = [
    {
      header: 'Email',
      cell: (user) => <span className="font-medium text-ink">{user.email}</span>,
    },
    {
      header: 'Role',
      cell: (user) => (
        <Badge tone={user.role === 'admin' ? 'admin' : 'neutral'} icon={user.role === 'admin' ? <FaShieldHalved aria-hidden="true" /> : undefined}>
          {user.role}
        </Badge>
      ),
    },
    {
      header: 'Joined',
      hideBelowLg: true,
      cell: (user) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (user) => {
        const isSelf = user.id === currentProfile?.id
        return (
          <div className="flex justify-end gap-2">
            <SecondaryButton
              tone={user.role === 'admin' ? 'pink' : 'orange'}
              onClick={() => void handleToggleRole(user)}
              disabled={isSelf || updatingId === user.id}
              title={isSelf ? "You can't change your own role" : undefined}
            >
              {user.role === 'admin' ? <FaUserMinus aria-hidden="true" /> : <FaUserPlus aria-hidden="true" />}
              <span className="hidden lg:inline">{user.role === 'admin' ? 'Demote' : 'Promote'}</span>
            </SecondaryButton>
            <SecondaryButton tone="blue" onClick={() => openEdit(user)}>
              <FaPen aria-hidden="true" />
              <span className="hidden lg:inline">Edit</span>
            </SecondaryButton>
            <SecondaryButton
              tone="error"
              onClick={() => setDeletingUser(user)}
              disabled={isSelf}
              title={isSelf ? "You can't delete your own account" : undefined}
            >
              <FaTrash aria-hidden="true" />
              <span className="hidden lg:inline">Delete</span>
            </SecondaryButton>
          </div>
        )
      },
    },
  ]

  return (
    <div className="surface-card animate-rise relative overflow-hidden">
      <div className="p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <PageHeader
            title="All users"
            subtitle="Manage ESN Forms accounts and roles."
            badge={
              <Badge tone="admin" icon={<FaShieldHalved aria-hidden="true" />}>
                Admin
              </Badge>
            }
          />
          <PrimaryButton onClick={() => setIsCreateOpen(true)} className="w-auto px-4">
            <FaPlus aria-hidden="true" />
            Add user
          </PrimaryButton>
        </div>

        {roleError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={roleError} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : loadError ? (
          <StatusMessage tone="error" message={loadError} />
        ) : (
          <DataTable
            columns={columns}
            rows={users}
            getRowKey={(user) => user.id}
            emptyMessage={
              <>
                <FaUsers className="text-2xl text-slate-300" aria-hidden="true" />
                <span>No users yet.</span>
              </>
            }
          />
        )}
      </div>

      <Modal title="Add user" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <TextField label="Email" type="email" required value={newEmail} onChange={setNewEmail} />
        <TextField label="Password" type="password" required value={newPassword} onChange={setNewPassword} />
        {createError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={createError} />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={() => void handleCreate()} isSubmitting={isCreating} className="w-auto px-4">
            Create account
          </PrimaryButton>
        </div>
      </Modal>

      <Modal title="Edit user" isOpen={editingUser !== null} onClose={() => setEditingUser(null)}>
        <TextField label="Email" type="email" required value={editEmail} onChange={setEditEmail} />
        <TextField
          label="New password"
          type="password"
          helpText="Leave blank to keep the current password."
          value={editPassword}
          onChange={setEditPassword}
        />
        {editError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={editError} />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={() => setEditingUser(null)} disabled={isSavingEdit}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={() => void handleSaveEdit()} isSubmitting={isSavingEdit} className="w-auto px-4">
            Save changes
          </PrimaryButton>
        </div>
      </Modal>

      <Modal title="Delete this account?" isOpen={deletingUser !== null} onClose={() => setDeletingUser(null)}>
        <p className="mb-6 text-sm text-muted">
          This permanently deletes {deletingUser?.email}'s account, along with every form they own and all of its
          responses. This can't be undone.
        </p>
        {deleteError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={deleteError} />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={() => setDeletingUser(null)} disabled={isDeleting}>
            Cancel
          </SecondaryButton>
          <SecondaryButton tone="error" onClick={() => void handleConfirmDelete()} disabled={isDeleting}>
            <FaTrash aria-hidden="true" />
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </SecondaryButton>
        </div>
      </Modal>
    </div>
  )
}
