"use client";

import React, { type ReactNode, type FormHTMLAttributes } from "react";
import {
  useForm,
  FormProvider,
  type UseFormReturn,
  type SubmitHandler,
  type SubmitErrorHandler,
  type DefaultValues,
  type FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

type AnyObj = Record<string, any>;
type ObjectSchema<TValues extends AnyObj = AnyObj> = z.ZodType<TValues>;

type RenderFn<TValues extends FieldValues> = (
  methods: UseFormReturn<TValues>
) => ReactNode;

type BaseFormProps<TValues extends FieldValues> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "children"
> & {
  children: ReactNode | RenderFn<TValues>;
  onSubmit: SubmitHandler<TValues>;
  onError?: SubmitErrorHandler<TValues>;
  mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
};

export type FormProps<S extends ObjectSchema> = BaseFormProps<z.infer<S>> & {
  schema: S;
  defaultValues?: DefaultValues<z.infer<S>>;
};

function isRenderFn<TValues extends FieldValues>(
  children: ReactNode | RenderFn<TValues>
): children is RenderFn<TValues> {
  return typeof children === "function";
}


const Form = <S extends ObjectSchema,>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  children,
  mode = "onSubmit",
  reValidateMode = "onChange",
  ...formProps
}: FormProps<S>) => {
  type Values = z.infer<S>;

  const methods = useForm<Values>({
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<Values> | undefined,
    mode,
    reValidateMode,
  });

  // @ts-ignore
  const submit = methods.handleSubmit<Values>(
    onSubmit as SubmitHandler<Values>,
    onError as SubmitErrorHandler<Values> | undefined
  );

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={submit} {...formProps} className="w-full">
        {/*@ts-ignore*/}
        {isRenderFn<Values>(children) ? children(methods) : children}
      </form>
    </FormProvider>
  );
};

export default Form;
