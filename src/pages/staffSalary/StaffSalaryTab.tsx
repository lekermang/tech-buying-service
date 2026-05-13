import OwnerSalaryView from "./OwnerSalaryView";
import EmployeeSalaryView from "./EmployeeSalaryView";

interface Props {
  role: string;
  token: string;
  employeeName: string;
}

export default function StaffSalaryTab({ role, token, employeeName }: Props) {
  if (role === "owner") {
    return <OwnerSalaryView token={token} />;
  }
  return <EmployeeSalaryView token={token} employeeName={employeeName} />;
}
