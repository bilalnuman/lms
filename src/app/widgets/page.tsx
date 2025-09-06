"use client";
import { Button } from "@/components/widgets/Button";
import Form from "@/components/form/Form";
import Heading from "@/components/widgets/Heading";
import Input from "@/components/widgets/Input";
import Modal, { ModalRef } from "@/components/widgets/modal";
import { useRef } from "react";
import { z } from "zod";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
});

export default function Example() {
    const modalRef = useRef<ModalRef>(null);
    return (
        <>
            <Button onClick={() => modalRef.current?.open()}>First Modal</Button>

            <Modal ref={modalRef}>
                <Heading title="Registration" />
                <Form
                    schema={schema}
                    defaultValues={{ name: "bilal@gmail.com", email: "" }}
                    onSubmit={async (values) => {
                        console.log(values)
                        modalRef.current?.close() 
                    }}
                >
                    {({ register,setValue,formState: { errors, isSubmitting } }) => {
                        setValue("name","bilal")
                        return (
                            <div className="flex flex-col gap-4">
                                <Input label="Name"  {...register("name")}
                                    value="bilal@gmail.com"
                                    readonly
                                    disabled
                                />
                                <Input label="Email" {...register("email")}
                                    error={errors.email?.message}
                                />
                                <Button
                                    type="submit"
                                >
                                    {isSubmitting ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        )
                    }}
                </Form>
            </Modal>
        </>
    );
}
