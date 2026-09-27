import { CustomerNavbar, RaiseComplaint } from "@/components/customer/global";

export const metadata = {
  title: "Raise a Complaint | Sutlej Automotives",
  description: "Report an issue with any of your vehicles for immediate service assistance.",
};

export default function CustomerRaiseComplaintPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="Raise Complaint" />
      <main className="flex-1">
        <RaiseComplaint />
      </main>
    </div>
  );
}
