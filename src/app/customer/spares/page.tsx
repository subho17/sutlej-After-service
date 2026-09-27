import { CustomerNavbar, ShopSpares } from "@/components/customer/global";

export const metadata = {
  title: "Golf Cart Spares | Sutlej Automotives",
  description: "Browse and order genuine golf cart spare parts and accessories.",
};

export default function CustomerSparesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <CustomerNavbar currentTab="Shop Spares" />
      <main className="flex-1">
        <ShopSpares />
      </main>
    </div>
  );
}
