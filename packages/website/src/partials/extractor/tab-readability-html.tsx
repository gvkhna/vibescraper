'use client'

import {ScrollArea} from '@/components/ui/scroll-area'

export function TabReadabilityHtml() {
  return (
    <ScrollArea className='h-full bg-[#151517]'>
      <div className='mx-auto max-w-4xl p-8'>
        <article className='prose prose-invert prose-lg max-w-none'>
          <h1 className='mb-6 text-4xl font-bold text-white'>ACME Widget</h1>
          <div className='mb-8 text-3xl font-semibold text-[#3B82F6]'>$19.99</div>
          <p className='mb-8 text-xl leading-relaxed text-gray-300'>
            High-quality widget for all your needs. This premium product combines durability with ease of use,
            making it perfect for both professionals and hobbyists.
          </p>
          <h2 className='mb-6 text-2xl font-semibold text-white'>Features</h2>
          <ul className='space-y-3 text-lg text-gray-300'>
            <li>Durable construction that lasts for years</li>
            <li>Easy to use interface</li>
            <li>1-year warranty included</li>
          </ul>
        </article>
      </div>
    </ScrollArea>
  )
}