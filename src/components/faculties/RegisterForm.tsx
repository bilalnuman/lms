"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    formSections,
    facultySchema,
    type FacultyFormValues,
} from "./facultyForm.config";

import { Input } from "@/components/widgets/Input";
import { Select } from "@/components/widgets/Select";
import { Button } from "@/components/widgets/Button";
import clsx from "clsx";
import { IoCalendarClearOutline } from "react-icons/io5";
import useFilePicker from "@/hooks/useFilePicker";
import { FaCamera } from "react-icons/fa";
import { FieldConfig } from "@/types";

// Render a single field from config
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
                    : "col-span-6 md:col-span-3"; // default 1

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
                                    ? { label: c.value, value: c.value } // show current value as label if not found
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

    if (field.type === "textarea") {
        return (
            <div className={colClass}>
                <Input
                    multiline
                    rows={field.rows ?? 3}
                    label={field.label}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={err}
                    {...register(field.name)}
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

const defaultValues: Partial<FacultyFormValues> = {
    // @ts-ignore
    status: "active",
    applicantStatus: "pakistani",
};

const gridCls = "grid grid-cols-6 gap-3";



export default function RegisterForm() {
    const {
        handleSubmit,
        control,
        register,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FacultyFormValues>({
        // @ts-ignore
        resolver: zodResolver(facultySchema),
        defaultValues,
        mode: "onBlur",
    });

    const picker = useFilePicker({
        accept: "image/*,.pdf",
        maxFiles: 5,
        maxFileSize: 10 * 1024 * 1024,
        maxTotalSize: 50 * 1024 * 1024,
        multiple: false,
        classes: {
            dragArea: {
                zone: "border-neutral-300 hover:border-neutral-400 text-xs w-20 h-20 rounded-sm relative !p-0",
                title: "hidden",
                subtitle: "hidden",
            },
            files: { item: "mt-2" },

        },
        onError: (m) => console.warn(m),
    });

    const onSubmit = async (values: FacultyFormValues) => {
        console.log("Submit payload", values);
    };

    return (
        // @ts-ignore
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 my-5 faculty-form" >
            {
                formSections.map((sec, i) => (
                    <section key={i} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 text-sm font-semibold uppercase text-dark-default flex justify-between">
                            {sec.title}
                            {i === 0 && <div className="">
                                <picker.DragAndDropArea Icon={<FaCamera />}>

                                    {picker?.fileUrl && <div className="w-full h-full absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <img
                                            src={picker?.fileUrl || '/placeholder.png'}
                                            alt="Profile"
                                            className="w-full h-full object-cover rounded-sm"
                                        />
                                    </div>}
                                </picker.DragAndDropArea>
                            </div>}
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
