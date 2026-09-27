import { CustomerNavbar, CustomerDashboard } from "@/components/customer/global";

export default function CustomerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="Home" />
      <main className="flex-1">
        <CustomerDashboard />
      </main>
    </div>
  );
}
