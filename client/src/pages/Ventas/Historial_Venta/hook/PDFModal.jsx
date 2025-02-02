import { useState } from "react";
import { Dialog, DialogPanel } from "@tremor/react";
import { RiCloseLine } from "@remixicon/react";

export default function PDFModal({ isOpen, onClose, onConfirm, modalTitle }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[100] overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-10 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          aria-hidden="true"
        ></div>

        <DialogPanel className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="absolute right-0 top-0 pr-3 pt-3">
            <button
              type="button"
              className="rounded-tremor-small p-2 text-tremor-content-subtle hover:bg-tremor-background-subtle hover:text-tremor-content dark:text-dark-tremor-content-subtle hover:dark:bg-dark-tremor-background-subtle hover:dark:text-tremor-content"
              onClick={onClose}
              aria-label="Close"
            >
              <RiCloseLine className="size-5 shrink-0" aria-hidden={true} />
            </button>
          </div>
          <form action="#" method="POST">
            <h4 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Confirmación de descarga
            </h4>
            <p className="mt-2 text-tremor-default leading-6 text-center text-tremor-content dark:text-dark-tremor-content">
              ¿Está seguro que desea descargar el {modalTitle} en formato PDF?
            </p>
            <button
              type="button"
              className="mt-8 max-w-xs mx-auto whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2 text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis flex justify-center items-center"
              onClick={onConfirm}
            >
              Descargar PDF
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
