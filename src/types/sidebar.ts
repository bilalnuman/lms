import { IconType } from "react-icons";

export type NavItem = {
    title: string;
    href: string;
    icon?: IconType;
    badge?: string | number;
    external?: boolean;
    exact?: boolean;
    children?: NavItem[];
};