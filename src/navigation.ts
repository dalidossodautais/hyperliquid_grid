import {
  createLocalizedPathnamesNavigation,
  Pathnames,
} from "next-intl/navigation";
import { locales, pathnames } from "./config";

export const { Link, redirect, usePathname, useRouter } =
  createLocalizedPathnamesNavigation({
    locales,
    pathnames: pathnames as Pathnames<typeof locales>,
  });
