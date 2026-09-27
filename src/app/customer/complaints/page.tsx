import { CustomerNavbar, MyComplaints } from "@/components/customer/global";

export const metadata = {
  title: "My Complaints | Sutlej Automotives",
  description: "View and track the status of all your registered service complaints.",
};

export default function CustomerComplaintsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="My Complaints" />
      <main className="flex-1">
        <MyComplaints />
      </main>
    </div>
  );
}
