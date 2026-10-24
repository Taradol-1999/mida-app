"use client";

import Swal from "sweetalert2";

export function showAdminSuccess(text: string) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "ดำเนินการสำเร็จ",
    text,
    timer: 4500,
    timerProgressBar: true,
    showConfirmButton: false,
    showCloseButton: true,
    closeButtonAriaLabel: "ปิดการแจ้งเตือน",
    customClass: { popup: "admin-alert-popup", title: "admin-alert-title", htmlContainer: "admin-alert-content" },
    didOpen: (popup) => {
      popup.addEventListener("mouseenter", Swal.stopTimer);
      popup.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

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
    buttonsStyling: false,
    customClass: {
      popup: "admin-alert-popup",
      title: "admin-alert-title",
      htmlContainer: "admin-alert-content",
      actions: "admin-alert-actions",
      confirmButton: "admin-button-danger",
      cancelButton: "admin-button-secondary",
    },
  }).then((result) => result.isConfirmed);
}
