"use client"

import React, { ReactNode } from 'react'
import Form from '../form/Form'
import Input from '../widgets/Input'
import { Button } from '../widgets/Button'
import { LoginFormValue, loginSchema } from '@/utils/formSchemas'
import Heading from '../widgets/Heading'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLogin } from '@/hooks/useLogin'
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
            onSuccess(data, variables, context) {
                console.log(data)
                router.replace(next);
            },
            onError(error, variables, context) {
                console.log(error)
            },
        });
    };

    return (
        <>
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
                                label={isSubmitting ? "" : "Save"}
                                loading={isSubmitting}
                            />
                            {children}
                        </div>
                    )
                }}

            </Form>
        </>
    )
}

export default LoginForm