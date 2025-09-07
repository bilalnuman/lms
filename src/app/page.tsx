import Loading from "@/components/widgets/Loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoginForm = dynamic(() => import("@/components/auth/SignIn"))

const page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}

export default page