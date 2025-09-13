"use client";
import { Button } from "@/components/widgets/Button";
import Form from "@/components/form";
import Heading from "@/components/widgets/Heading";
import Input from "@/components/widgets/Input";
import { z } from "zod";
import TimePicker from "@/toolkits/TimePicker";
import DatePicker from "@/toolkits/DatePicker";
import { FaCalendar } from "react-icons/fa";
import { nameSchema } from "@/utils/formSchemas";
import { Select } from "@/components/widgets/Select";
import { UseFormReturn } from "react-hook-form";
import { useEffect, useRef } from "react";

const schema = z.object({
    name: nameSchema("Name"),
    email: z.string().email("Invalid email"),
    dateOfBirth: z.string(),
    time: z.string("Time is required").refine(
        (val) => /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(val),
        { message: "Invalid time format (HH:mm or HH:mm:ss)" }
    ),
    gender: z.enum(["male", "female"]),
});

export default function Example() {
    const formRef = useRef<UseFormReturn<any>>(null);

    useEffect(() => {
        const id = setTimeout(() => {
            formRef.current?.setValue("name", "Bilal");
        }, 100);

        return () => clearTimeout(id);
    }, [formRef?.current?.reset]);


    return (
        <>
            <div className="flex flex-col gap-4 max-w-[500px] mx-auto ">
                <Heading title="Registration" />
                <Form
                    ref={formRef}
                    schema={schema}
                    onSubmit={async (values) => {
                        console.log(values)
                    }}
                >
                    {({ register, control, formState: { errors, isSubmitting } }) => {
                        console.log(errors)
                        return (
                            <div className="flex flex-col gap-2">
                                <Input label="Name"
                                    {...register("name")}
                                    error={errors.name?.message}
                                    required
                                    placeholder="Enter your name"
                                    clearable
                                />
                                <Input label="Email"
                                    {...register("email")}
                                    placeholder="Enter your email"
                                    error={errors.email?.message}
                                    required
                                    clearable
                                />
                                <DatePicker
                                    label="Date Of Birth"
                                    {...register("dateOfBirth")}
                                    use12Hour
                                    required
                                    icons={{ calendar: <FaCalendar className="text-slate-400" /> }}
                                />
                                <TimePicker
                                    {...register("time")}
                                    isTimeSlot
                                    multi={false}
                                    clearable
                                    placeholder="Select time..."
                                    error={errors.time?.message}
                                    required
                                    label="Time"
                                />
                                <Select
                                    {...register("gender")}
                                    label="Gender"
                                    required
                                    placeholder="Select gender…"
                                    options={[
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                    ]}
                                    error={errors.gender?.message}
                                />
                                <Button
                                    className="mt-6 !rounded-md"
                                    type="submit"
                                    label={isSubmitting ? "Saving..." : "Save"}
                                />
                            </div>
                        )
                    }}
                </Form>
            </div>

        </>
    );
}
