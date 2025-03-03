import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 opacity-50" onClick={onClose} />
      <div className="fixed inset-0 z-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-5">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {title}
                </h3>
                <div>{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
