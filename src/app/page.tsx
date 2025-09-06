import { LoginForm } from "@/components/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = decodeURIComponent(searchParams?.next ?? "/dashboard");
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-[500px] p-4 border shadow rounded-lg">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
