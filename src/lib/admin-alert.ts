"use client";

import Swal from "sweetalert2";

export function confirmDelete(text: string, title = "ยืนยันการลบข้อมูล") {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบข้อมูล",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-lg px-4 py-2 text-sm font-bold",
      cancelButton: "rounded-lg px-4 py-2 text-sm font-bold",
    },
  }).then((result) => result.isConfirmed);
}
