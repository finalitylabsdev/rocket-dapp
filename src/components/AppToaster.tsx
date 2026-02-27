import { Loader } from 'lucide-react';
import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-left"
      expand
      closeButton
      visibleToasts={4}
      offset={20}
      mobileOffset={16}
      icons={{
        loading: <Loader size={16} className="animate-spin text-dot-green" />,
      }}
      toastOptions={{
        duration: 6000,
        classNames: {
          toast: 'app-toast',
          title: 'app-toast-title',
          description: 'app-toast-description',
          loader: 'app-toast-loader',
          closeButton: 'app-toast-close',
          actionButton: 'app-toast-action',
          cancelButton: 'app-toast-cancel',
          success: 'app-toast-success',
          error: 'app-toast-error',
          info: 'app-toast-info',
          warning: 'app-toast-warning',
          loading: 'app-toast-loading',
          default: 'app-toast-default',
          content: 'app-toast-content',
          icon: 'app-toast-icon',
        },
      }}
    />
  );
}
