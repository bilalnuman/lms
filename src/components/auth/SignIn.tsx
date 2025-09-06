"use client"

import React, { ReactNode } from 'react'
import Form from '../form/Form'
import Input from '../widgets/Input'
import { Button } from '../widgets/Button'
import { LoginFormValue, loginSchema } from '@/utils/formSchemas'
import Heading from '../widgets/Heading'
interface Props {
    children?: ReactNode
}

const LoginForm = ({ children }: Props) => {
    const login = async (formData: LoginFormValue) => {
        try {
            const res = await fetch("http://localhost:5000/api/v1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Login failed");
            }

            const data = await res.json();
            console.log("Login success:", data);
        } catch (err) {
            console.error("Error:", err);
        }
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
                            <Input label="Password"  {...register("password")}
                                error={errors.password?.message}
                                required
                            />
                            <Input label="Email" {...register("email")}
                                error={errors.email?.message}
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