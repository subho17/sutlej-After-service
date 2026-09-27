import { CustomerNavbar, MyVehicles } from "@/components/customer/global";

export const metadata = {
  title: "My Vehicles | Sutlej Automotives",
  description: "View and manage your registered vehicles and service schedules.",
};

export default function CustomerVehiclesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="My Vehicles" />
      <main className="flex-1">
        <MyVehicles />
      </main>
    </div>
  );
}
