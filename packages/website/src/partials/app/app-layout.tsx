import {type PropsWithChildren} from 'react'
import {Toaster} from '@/components/ui/sonner'
export interface AppLayoutProps {}

export function AppLayout({children}: PropsWithChildren<AppLayoutProps>) {
  return (
    <>
      {/* <div className='bg-background relative flex min-h-screen flex-col'>
        <main className=''>{children}</main>
      </div> */}
      {/* <Toaster /> */}
    </>
  )
}
