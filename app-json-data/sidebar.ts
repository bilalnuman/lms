import { NavItem } from "@/types/sidebar";
import { IoPieChartSharp } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import { FaClock } from "react-icons/fa";



export const sidebarItems: NavItem[] = [
    { title: "dashboard", href: "/dashboard", icon: IoPieChartSharp, exact: true },
    { title: "student list", href: "/students", icon: HiUsers, exact: true },
    { title: "faculty list", href: "/faculties", icon: HiUsers, exact: true },
    {
        title: "schedule & results", href: "schedule-results", icon: FaClock, exact: true,
        children: [
            { title: "Class Schedule", href: "/class-schedule", icon: HiUsers, },
            { title: "Exams Schedule", href: "/exams-schedule", icon: HiUsers, },
            { title: "Add Result", href: "/add-result", icon: HiUsers, }
        ]
    },
    {
        title: "Tasks Assignment", href: "tasks-assignment", icon: FaClock, exact: true,
        children: [
            { title: "Tasks", href: "/tasks", icon: HiUsers, },
            { title: "Receive Tasks", href: "/receive-tasks", icon: HiUsers, },
        ]
    },
    {
        title: "Student Trainings", href: "/satudent-trainings", icon: FaClock, exact: true,
        children: [
            { title: "Training List ", href: "/training-requests", icon: HiUsers, },
            { title: "Training Requests", href: "/training-requests", icon: HiUsers, },
        ]
    },
    {
        title: "CPD / CME Tracking", href: "cme-tracking", icon: FaClock, exact: true,
        children: [
            { title: "CPD / CME Tracking List", href: "/CPDCME Tracking List", icon: HiUsers, },
            { title: "CPD / CME Tracking Add", href: "/training-requests", icon: HiUsers, },
        ]
    },
    { title: "Defaulters List", href: "/defaulters", icon: HiUsers, exact: true },
    {
        title: "Attendance", href: "attendance", icon: FaClock, exact: true,
        children: [
            { title: "CPD / CME Tracking List", href: "/CPDCME Tracking List", icon: HiUsers, },
            { title: "CPD / CME Tracking Add", href: "/training-requests", icon: HiUsers, },
        ]
    },
    {
        title: "Questionaires", href: "questionaires", icon: FaClock, exact: true,
        children: [
            { title: "Quiz List", href: "/quiz-list", icon: HiUsers, },
            { title: "Quiz Dashboard", href: "/quiz-dashboard", icon: HiUsers, },
            { title: "Marks Summary", href: "/marks-summary", icon: HiUsers, },
            { title: "Question Wise Marks", href: "/question-wise-marks", icon: HiUsers, },
            { title: "Marks Detail", href: "/marks-detail", icon: HiUsers, },
        ]
    },
    { title: "E-Book", href: "/e-book", icon: HiUsers, exact: true },
    { title: "Students Feedback", href: "/students-feedback", icon: HiUsers, exact: true },
    { title: "Notifications", href: "/notifications", icon: HiUsers, exact: true },
    {
        title: "Reports & Analysis", href: "reports-analysis", icon: FaClock, exact: true,
        children: [
            { title: "Classes Schedule", href: "/classes-schedule", icon: HiUsers, },
            { title: "students-list", href: "/students-list", icon: HiUsers, },
            { title: "Marks Summary", href: "/marks-summary", icon: HiUsers, },
            { title: "Monthly Attendance Report", href: "/monthly-attendance-report", icon: HiUsers, },
        ]
    },
    { title: "Settings", href: "/settings", icon: HiUsers, exact: true },
    {
        title: "User Settings", href: "user-settings", icon: FaClock, exact: true,
        children: [
            { title: "Change Password", href: "/change-password", icon: HiUsers, },
            { title: "Logout", href: "/logout", icon: HiUsers, },
        ]
    },
    { title: "Widgets", href: "/widgets", icon: HiUsers, exact: true },

];
