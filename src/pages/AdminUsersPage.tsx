import { useEffect, useState } from 'react'
import { FaPlus, FaShieldHalved, FaUserMinus, FaUserPlus, FaUsers } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../auth/useAuth'
import { createUserAsAdmin, listUsers, setUserRole } from '../lib/adminApi'
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
          <SecondaryButton
            tone={user.role === 'admin' ? 'pink' : 'orange'}
            onClick={() => void handleToggleRole(user)}
            disabled={isSelf || updatingId === user.id}
            title={isSelf ? "You can't change your own role" : undefined}
          >
            {user.role === 'admin' ? <FaUserMinus aria-hidden="true" /> : <FaUserPlus aria-hidden="true" />}
            {user.role === 'admin' ? 'Demote' : 'Promote'}
          </SecondaryButton>
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
    </div>
  )
}
