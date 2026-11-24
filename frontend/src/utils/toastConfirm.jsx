import toast from 'react-hot-toast';

/**
 * Shows a custom confirmation toast with Accept/Cancel buttons.
 * Returns a Promise that resolves to true (confirmed) or false (cancelled).
 *
 * Usage:
 *   const ok = await toastConfirm("Delete this review?");
 *   if (ok) { ... }
 */
const toastConfirm = (message) => {
    return new Promise((resolve) => {
        toast(
            (t) => {
                const buttonBase =
                    'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200';
                return (
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-800 font-medium text-sm">{message}</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className={`${buttonBase} bg-gray-100 text-gray-600 hover:bg-gray-200`}
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${buttonBase} bg-red-500 text-white hover:bg-red-600 shadow-sm`}
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(true);
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                );
            },
            {
                duration: Infinity,
                position: 'top-center',
                style: {
                    minWidth: '300px',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa',
                    background: '#fffbeb',
                },
            }
        );
    });
};

export default toastConfirm;
