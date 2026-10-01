import { CustomerProfile } from "@/components/staff/global";

export default async function StaffCustomerProfilePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  return <CustomerProfile customerKey={decodeURIComponent(key)} />;
}
