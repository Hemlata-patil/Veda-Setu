"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { useAdminTrigger } from "@/components/auth/use-admin-trigger";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  const { isAdminModalOpen, closeAdminModal, handleLogoClick } = useAdminTrigger();

  return (
    <>
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={closeAdminModal}
      />
      <Link
        href="/"
        onClick={handleLogoClick}
        className={cn("flex items-center group select-none py-1 focus:outline-none", className)}
        title="VEDA SETU"
        aria-label="Veda Setu"
      >
        <Image
          src="/images/veda-setu-logo.png"
          alt="Veda Setu"
          width={220}
          height={75}
          className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
          priority
        />
      </Link>
    </>
  );
}
