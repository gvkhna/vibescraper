import { type ChatStatus, isToolUIPart } from 'ai'
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react'
import type { IterableElement } from 'type-fest'

import { Action, Actions } from '@/components/ai-elements/actions'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/source'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

import type { VSUIMessage } from './chat-message-schema'
import {
  convertChatMessageToUIMessage,
  isDataKey,
  isToolKey,
  type VSUIMessageChunk
} from './chat-message-schema'

export interface AssistantChatMessagePartProps {
  message: VSUIMessage
  part: IterableElement<VSUIMessage['parts']>
  index: number
  status: ChatStatus
}

export function AssistantChatMessagePart(props: AssistantChatMessagePartProps) {
  const { message, part, index, status } = props
  const type = part.type
  switch (true) {
    case isDataKey(type): {
      if (type === 'data-error') {
        return <Response key={`${message.id}-${index}`}>{part.data}</Response>
      }
      return null
    }
    case isToolKey(type): {
      if (isToolUIPart(part)) {
        return (
          <Tool
            defaultOpen={false}
            key={`${message.id}-${index}`}
          >
            <ToolHeader
              type={type}
              state={part.state}
            />
            <ToolContent>
              <ToolInput input={part.input} />
              <ToolOutput
                output={<Response>{JSON.stringify(part.output)}</Response>}
                errorText={part.errorText}
              />
            </ToolContent>
          </Tool>
        )
      }
      // const tool = part
      // const toolType = part.type

      // if (
      //   type === 'tool-ping' ||
      //   type === 'tool-schemaGet' ||
      //   type === 'tool-schemaSet' ||
      //   type === 'tool-scriptGet' ||
      //   type === 'tool-scriptSet'
      // ) {
      //   // console.log('tool', type, part.toolCallId, part.state)

      // }

      return null
    }
    case type === 'file': {
      return null
    }
    case type === 'dynamic-tool': {
      return null
    }
    case type === 'source-url': {
      return null
    }
    case type === 'source-document': {
      return null
    }
    case type === 'step-start': {
      return null
    }
    case type === 'text': {
      return <Response key={`${message.id}-${index}`}>{part.text}</Response>
    }
    case type === 'reasoning':
      return (
        <Reasoning
          key={`${message.id}-${index}`}
          className='w-full'
          isStreaming={status === 'streaming'}
        >
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      )
    default: {
      const _exhaustive: never = type
      return null
    }
  }
}

// return (
//     <div key={message.id}>
//       {/* {message.role === 'assistant' && (
//                   <Sources>
//                     {message.parts.map((part, i) => {
//                       switch (part.type) {
//                         case 'source-url':
//                           return (
//                             <>
//                               <SourcesTrigger
//                                 count={message.parts.filter((part_) => part_.type === 'source-url').length}
//                               />
//                               <SourcesContent key={`${message.id}-${i}`}>
//                                 <Source
//                                   key={`${message.id}-${i}`}
//                                   href={part.url}
//                                   title={part.url}
//                                 />
//                               </SourcesContent>
//                             </>
//                           )
//                         default: {
//                           return <></>
//                         }
//                       }
//                     })}
//                   </Sources>
//                 )} */}
//       {/* {console.log('messages rendered', messages)} */}
//       <Message
//         from={message.role}
//         key={message.id}
//       >
//         {/* <div> */}
//         <MessageContent data-error={message.metadata?.error}>
//           {/* Use aggregator for tool calls in assistant messages */}
//           {/* {message.role === 'assistant' && (
//                       <ToolCallAggregator
//                         message={message}
//                         messageIndex={messageIndex}
//                         chatId={selectedChat}
//                       />
//                     )} */}

//           {/* Render non-tool parts */}
//           {message.parts.map((part, i) => {
//             const type = part.type
//             switch (true) {
//               case isDataKey(type): {
//                 if (type === 'data-error') {
//                   return <Response key={`${message.id}-${i}`}>{part.data}</Response>
//                 }
//                 return null
//               }
//               case isToolKey(type): {
//                 if (isToolUIPart(part)) {
//                   return (
//                     <Tool
//                       defaultOpen={false}
//                       key={`${message.id}-${i}`}
//                     >
//                       <ToolHeader
//                         type={type}
//                         state={part.state}
//                       />
//                       <ToolContent>
//                         <ToolInput input={part.input} />
//                         <ToolOutput
//                           output={<Response>{JSON.stringify(part.output)}</Response>}
//                           errorText={part.errorText}
//                         />
//                       </ToolContent>
//                     </Tool>
//                   )
//                 }
//                 // const tool = part
//                 // const toolType = part.type

//                 // if (
//                 //   type === 'tool-ping' ||
//                 //   type === 'tool-schemaGet' ||
//                 //   type === 'tool-schemaSet' ||
//                 //   type === 'tool-scriptGet' ||
//                 //   type === 'tool-scriptSet'
//                 // ) {
//                 //   // console.log('tool', type, part.toolCallId, part.state)

//                 // }

//                 return null
//               }
//               case type === 'file': {
//                 return null
//               }
//               case type === 'dynamic-tool': {
//                 return null
//               }
//               case type === 'source-url': {
//                 return null
//               }
//               case type === 'source-document': {
//                 return null
//               }
//               case type === 'step-start': {
//                 return null
//               }
//               case type === 'text': {
//                 if (message.role === 'user') {
//                   return <div key={`${message.id}-${i}`}>{part.text}</div>
//                 }
//                 return <Response key={`${message.id}-${i}`}>{part.text}</Response>
//               }
//               case type === 'reasoning':
//                 return (
//                   <Reasoning
//                     key={`${message.id}-${i}`}
//                     className='w-full'
//                     isStreaming={status === 'streaming'}
//                   >
//                     <ReasoningTrigger />
//                     <ReasoningContent>{part.text}</ReasoningContent>
//                   </Reasoning>
//                 )
//               default: {
//                 const _exhaustive: never = type
//                 return null
//               }
//             }
//           })}
//           {/* {message.role === 'assistant' && messageIndex === messages.length - 1 && (
//                       <Actions className='mt-2'>
//                         <Action
//                           onClick={() => {
//                             nowait(regenerate())
//                           }}
//                           label='Retry'
//                         >
//                           <RefreshCcwIcon className='size-3' />
//                         </Action>
//                         <Action
//                           onClick={() => {
//                             nowait(globalThis.navigator.clipboard.writeText(part.text))
//                           }}
//                           label='Copy'
//                         >
//                           <CopyIcon className='size-3' />
//                         </Action>
//                       </Actions>
//                     )} */}
//         </MessageContent>
//       </Message>
//     </div>
//   )
