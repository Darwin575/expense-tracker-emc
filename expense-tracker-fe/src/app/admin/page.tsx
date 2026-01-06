'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { adminService, AdminUser, AdminStats } from '@/lib/admin-service'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [credResetFilter, setCredResetFilter] = useState<'all' | 'requested'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Edit form state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editFormData, setEditFormData] = useState({ email: '', password: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

  // Check authorization
  useEffect(() => {
    if (!authLoading && !(user?.is_staff && user?.is_superuser)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Fetch data
  useEffect(() => {
    if (!(user?.is_staff && user?.is_superuser)) return

    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const filters: any = {}
        if (roleFilter !== 'all') filters.is_staff = roleFilter === 'admin'
        if (activeFilter !== 'all') filters.is_active = activeFilter === 'active'

        const [usersData, statsData] = await Promise.all([
          adminService.getUsers(currentPage, filters),
          adminService.getStats(),
        ])

        let filteredUsers = usersData.results
        if (credResetFilter === 'requested') {
          filteredUsers = filteredUsers.filter(u => u.requested_credential_reset)
        }

        setUsers(filteredUsers)
        setStats(statsData)
      } catch (err) {
        setError('Failed to load data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, roleFilter, activeFilter, credResetFilter, currentPage])

  const handlePromote = async (userId: number) => {
    try {
      const updated = await adminService.promoteToAdmin(userId)
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
    } catch (err) {
      setError('Failed to promote user')
    }
  }

  const handleDemote = async (userId: number) => {
    try {
      const updated = await adminService.demoteToUser(userId)
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
    } catch (err) {
      setError('Failed to demote user')
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      const updated = await adminService.toggleActive(userId)
      setUsers(users.map((u) => (u.id === userId ? updated : u)))
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return

    try {
      await adminService.deleteUser(userId)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const handleEditCredentials = (userToEdit: AdminUser) => {
    setEditingUser(userToEdit)
    setEditFormData({ email: userToEdit.email, password: '' })
    setEditError('')
    setEditSuccess(false)
  }

  const handleSaveCredentials = async () => {
    if (!editingUser) return
    
    setEditError('')
    setEditLoading(true)

    try {
      const updated = await adminService.resetUserCredentials(
        editingUser.id,
        editFormData.email,
        editFormData.password
      )
      
      setUsers(users.map((u) => (u.id === editingUser.id ? updated : u)))
      setEditSuccess(true)
      
      setTimeout(() => {
        setEditingUser(null)
        setEditSuccess(false)
      }, 2000)
    } catch (err: any) {
      setEditError(err.message || 'Failed to reset credentials')
    } finally {
      setEditLoading(false)
    }
  }

  if (authLoading || (!(user?.is_staff && user?.is_superuser) && authLoading === false)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage users and system</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Users', value: stats.total_users },
              { label: 'Admins', value: stats.admin_users },
              { label: 'Regular Users', value: stats.regular_users },
              { label: 'Active Users', value: stats.active_users },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Edit Credentials Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Reset Credentials for {editingUser.email}
              </h2>
              
              {editError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                  Credentials reset successfully!
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Minimum 8 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCredentials}
                  disabled={editLoading || !editFormData.email || !editFormData.password}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Credential Resets
              </label>
              <select
                value={credResetFilter}
                onChange={(e) => {
                  setCredResetFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="requested">Credential Reset Requested</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Cred Reset
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                          {u.first_name && u.last_name
                            ? `${u.first_name} ${u.last_name}`
                            : u.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.is_staff && u.is_superuser
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {u.is_staff && u.is_superuser ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.is_active
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {u.requested_credential_reset && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                              Requested
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2 flex flex-wrap gap-2">
                          {u.requested_credential_reset && (
                            <button
                              onClick={() => handleEditCredentials(u)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                            >
                              Reset Creds
                            </button>
                          )}
                          {!(u.is_staff && u.is_superuser) && (
                            <button
                              onClick={() => handlePromote(u.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                          {u.is_staff && u.is_superuser && user?.id !== u.id && (
                            <button
                              onClick={() => handleDemote(u.id)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                            >
                              Remove Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`px-3 py-1 text-white text-xs rounded transition-colors ${
                              u.is_active
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          {user?.id !== u.id && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
