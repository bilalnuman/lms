"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    formSections,
    studentSchema,
    type StudentFormValues,
    type FieldConfig,
} from "./studentForm.config";

import { Input } from "@/components/Input";        // ← your Input
import { Select } from "@/components/Select";      // ← your Select
import { Button } from "@/components/Button";      // ← your Button
import clsx from "clsx";
import { IoCalendarClearOutline } from "react-icons/io5";
import useFilePicker from "@/hooks/useFilePicker";
import { FaCamera } from "react-icons/fa";

// Simple radio group that matches our config
function RadioGroup({
    name,
    label,
    options,
    value,
    onChange,
    error,
    required,
}: {
    name: string;
    label: string;
    options: { label: string; value: string }[];
    value?: string;
    onChange: (val: string) => void;
    error?: string;
    required?: boolean;
}) {
    return (
        <div className="col-span-6 lg:col-span-3">
            <div className="mb-1 text-sm font-medium text-dark-default">
                {label} {required && <span className="text-red-600">*</span>}
            </div>
            <div className="flex flex-wrap gap-4 rounded-md border border-slate-200 p-2">
                {options.map((o) => (
                    <label key={o.value} className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={value === o.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-4 w-4"
                        />
                        <span>{o.label}</span>
                    </label>
                ))}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

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

    if (field.type === "radio") {
        return (
            <Controller
                control={control}
                name={field.name as any}
                render={({ field: c }) => (
                    <RadioGroup
                        name={field.name}
                        label={field.label}
                        options={field.options ?? []}
                        value={c.value}
                        onChange={(v) => c.onChange(v)}
                        error={err}
                        required={field.required}
                    />
                )}
            />
        );
    }

    // text / email / tel / number / date
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

const defaultValues: Partial<StudentFormValues> = {
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
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
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

    console.log(picker)

    const onSubmit = async (values: StudentFormValues) => {
        console.log("Submit payload", values);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 my-5" >
            {
                formSections.map((sec, i) => (
                    <section key={i} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        {sec.title && (
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
                        )}
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
