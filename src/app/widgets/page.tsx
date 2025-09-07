"use client";
import { Button } from "@/components/widgets/Button";
import Form from "@/components/form";
import Heading from "@/components/widgets/Heading";
import Input from "@/components/widgets/Input";
import Modal, { ModalRef } from "@/components/widgets/modal";
import { useRef } from "react";
import { z } from "zod";
import TimePicker from "@/toolkits/TimePicker";
import DatePicker from "@/toolkits/DatePicker";
import { FaCalendar } from "react-icons/fa";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    dateOfBirth: z.date("Date of birth is required"),
    time: z.string().min(1, "Time is required"),
    gender: z.enum(["male", "female"]).optional(),
});


const to12 = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const am = h < 12; const h12 = (h % 12) || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
};

export default function Example() {
    const modalRef = useRef<ModalRef>(null);
    return (
        <>
            <Button onClick={() => modalRef.current?.open()} label="Open Modal" />

            <Modal ref={modalRef}>
                <div>Modal Content</div>
            </Modal>

            <div className="flex flex-col gap-4 max-w-[500px] mx-auto border p-8 rounded-lg shadow-md">
                <Heading title="Registration" />
                <Form
                    schema={schema}
                    defaultValues={{ name: "bilal@gmail.com", email: "" }}
                    onSubmit={async (values) => {
                        console.log(values)
                        // modalRef.current?.close()    
                    }}
                >
                    {({ register, setValue, trigger, formState: { errors, isSubmitting } }) => {
                        return (
                            <div className="flex flex-col gap-4">
                                <Input label="Name"  {...register("name")}
                                    error={errors.email?.message}
                                    required
                                />
                                <Input label="Email"
                                    {...register("email")}
                                    error={errors.email?.message}
                                    required
                                />
                                <DatePicker
                                    use12Hour
                                    icons={{ calendar: <FaCalendar className="text-slate-400" /> }}
                                    error={errors.dateOfBirth?.message}
                                    isDateTime
                                    onChange={(data:any) => {
                                        setValue("dateOfBirth", data);
                                        trigger('dateOfBirth')
                                    }}
                                />
                                <TimePicker
                                    multi={false}
                                    disabledSlots={["09:15 AM", "11:15 PM"]}
                                    slotGap={15}
                                    searchAble
                                    placeholder="Select time..."
                                    onChange={(time) => setValue("time", time ? to12(time) : "")}
                                    error={errors.time?.message}
                                    required
                                    label="Time"
                                />
                                <Button
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
