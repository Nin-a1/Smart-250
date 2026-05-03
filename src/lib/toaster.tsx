import {
  createToaster,
  ToastCloseTrigger,
  ToastDescription,
  Toaster as ChakraToaster,
  ToastRoot,
  ToastTitle,
} from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast) => (
        <ToastRoot>
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          <ToastCloseTrigger />
        </ToastRoot>
      )}
    </ChakraToaster>
  )
}
