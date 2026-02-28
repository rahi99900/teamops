import EmployeeProfileClient from './EmployeeProfileClient'

export default async function EmployeeProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EmployeeProfileClient id={id} />
}
