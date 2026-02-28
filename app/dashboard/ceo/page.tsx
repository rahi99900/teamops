'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Clock, Award, Building2, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CeoDashboard() {
    const { user } = useAuth()

    // Mock data - replace with real data from your backend
    const stats = {
        totalEmployees: 45,
        totalManagers: 8,
        activeProjects: 12,
        avgAttendance: 94,
        monthlyGrowth: '+12%',
        pendingRequests: 3,
    }

    const topManagers = [
        { name: 'John Smith', team: 'Engineering', members: 12, performance: 98 },
        { name: 'Sarah Johnson', team: 'Sales', members: 8, performance: 96 },
        { name: 'Mike Wilson', team: 'Marketing', members: 6, performance: 94 },
    ]

    return (
        <ProtectedLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">CEO Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.firstName} {user?.lastName}! Here&apos;s your company overview.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-green-600 font-medium">{stats.monthlyGrowth}</span> from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Managers</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalManagers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Managing {stats.totalEmployees} employees
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeProjects}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across all departments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Company-wide this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Staff join requests
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.monthlyGrowth}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Team expansion rate
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Managers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Managers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topManagers.map((manager, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {manager.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-medium">{manager.name}</p>
                                            <p className="text-sm text-muted-foreground">{manager.team} • {manager.members} members</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                        {manager.performance}% Performance
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <a href="/staff-requests" className="p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                                <Users className="h-5 w-5 mb-2 text-primary" />
                                <p className="font-medium text-sm">Review Requests</p>
                                <p className="text-xs text-muted-foreground mt-1">{stats.pendingRequests} pending</p>
                            </a>
                            <a href="/roles" className="p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                                <Award className="h-5 w-5 mb-2 text-primary" />
                                <p className="font-medium text-sm">Manage Roles</p>
                                <p className="text-xs text-muted-foreground mt-1">Configure permissions</p>
                            </a>
                            <a href="/reports" className="p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                                <TrendingUp className="h-5 w-5 mb-2 text-primary" />
                                <p className="font-medium text-sm">View Reports</p>
                                <p className="text-xs text-muted-foreground mt-1">Analytics & insights</p>
                            </a>
                            <a href="/company-settings" className="p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                                <Building2 className="h-5 w-5 mb-2 text-primary" />
                                <p className="font-medium text-sm">Company Settings</p>
                                <p className="text-xs text-muted-foreground mt-1">Configure company</p>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ProtectedLayout>
    )
}
