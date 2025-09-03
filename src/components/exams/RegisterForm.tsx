"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    formSections,
    scheduleSchema,
    type ScheduleFormValues,
} from "./facultyForm.config";

import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import clsx from "clsx";
import { IoCalendarClearOutline } from "react-icons/io5";
import { FieldConfig } from "@/types";
function Field({
    field,
    control,
    register,
    errors,
}: {
    field: FieldConfig;
    control: any;
    register: any;
    errors: Record<string, any>;
}) {
    const span = field.colSpan ?? 1;
    const colClass =
        span >= 6
            ? "col-span-6"
            : span === 3
                ? "col-span-6 lg:col-span-3"
                : span === 2
                    ? "col-span-6 md:col-span-3 lg:col-span-2"
                    : "col-span-6 md:col-span-3";

    const err = errors[field.name]?.message as string | undefined;

    if (field.type === "select") {
        return (
            <div className={colClass}>
                <Controller
                    control={control}
                    name={field.name as any}
                    render={({ field: c }) => (
                        <Select
                            label={field.label}
                            value={
                                c.value
                                    ? { label: c.value, value: c.value }
                                    : null
                            }
                            options={(field.options ?? []).map((o) => ({ ...o }))}
                            onChange={(opt) => c.onChange(opt?.value ?? "")}
                            clearable
                            required={field.required}
                            error={err}
                            placeholder={field.placeholder || "Select a parameter"}
                        />
                    )}
                />
            </div>
        );
    }

    const typeMap: Record<FieldConfig["type"], string> = {
        text: "text",
        email: "email",
        tel: "tel",
        number: "number",
        date: "date",
        select: "text",
        textarea: "text",
        radio: "text",
    };

    return (
        <div className={colClass}>
            <Input
                type={typeMap[field.type]}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                error={err}
                {...register(field.name)}
                pickerIcon={<IoCalendarClearOutline className="h-4 w-4" />}
            />
        </div>
    );
}

const defaultValues: Partial<ScheduleFormValues> = {
};

const gridCls = "grid grid-cols-6 gap-3";



export default function RegisterForm() {
    const {
        handleSubmit,
        control,
        register,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues,
        mode: "onBlur",
    });

    const onSubmit = async (values: ScheduleFormValues) => {
        console.log("Submit payload", values);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 my-5" >
            {
                formSections.map((sec, i) => (
                    <section key={i} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 text-sm font-semibold uppercase text-dark-default flex justify-between">
                            {sec.title}
                        </h3>
                        <div className={clsx(gridCls, sec.title)} id={`section-${i + 1}`}>
                            {sec.fields.map((f) => (
                                <Field
                                    key={f.name}
                                    field={f}
                                    control={control}
                                    register={register}
                                    errors={errors as any}
                                />
                            ))}
                        </div>
                    </section>
                ))
            }
            < div className="flex gap-3" >
                <Button type="submit" loading={isSubmitting}>
                    Submit
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => reset(defaultValues)}
                >
                    Reset
                </Button>
            </div >
        </form >
    );
}
