"use client"
import React, { ReactNode } from 'react'
import Form from '@/components/form'
import Input from '@/components/widgets/Input'
import { Button } from '@/components/widgets/Button'
import { LoginFormValue, loginSchema } from '@/utils/formSchemas'
import Heading from '@/components/widgets/Heading'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLogin } from '@/hooks/useLogin'
import { toast } from 'react-toastify'
import { formErrorToast } from '@/utils/formErrorToast'
interface Props {
    children?: ReactNode
}

const LoginForm = ({ children }: Props) => {
    const router = useRouter();
    const params = useSearchParams();
    const loginMutation = useLogin();


    const login = async (formData: LoginFormValue) => {
        const next = await decodeURIComponent(params.get("next") || "/dashboard");
        await loginMutation.mutateAsync(formData, {
            onSuccess(data) {
                toast.success(data?.message);
                router.replace(next);
            },
            onError(error) {
                formErrorToast(error)
            },
        });
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-[500px] p-4 border shadow rounded-lg">

                <Heading title="Sign In" className='mb-4 ' />
                <Form
                    schema={loginSchema}
                    onSubmit={login}
                >
                    {({ register, formState: { errors, isSubmitting } }) => {
                        return (
                            <div className="flex flex-col gap-4">
                                <Input label="Email" {...register("email")}
                                    error={errors.email?.message}
                                    required
                                />
                                <Input label="Password"  {...register("password")}
                                    error={errors.password?.message}
                                    required
                                />
                                <Button
                                    type="submit"
                                    label={isSubmitting ? "" : "Login"}
                                    loading={isSubmitting}
                                />
                                {children}
                            </div>
                        )
                    }}

                </Form>

            </div>
        </div>
    )
}

export default LoginForm