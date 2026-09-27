import { CustomerNavbar, MyOrders } from "@/components/customer/global";

export const metadata = {
  title: "My Orders | Sutlej Automotives",
  description: "View and track your golf cart spare part orders and download official receipts.",
};

export default function CustomerOrdersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="My Orders" />
      <main className="flex-1">
        <MyOrders />
      </main>
    </div>
  );
}
