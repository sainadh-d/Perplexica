'use client';

/* eslint-disable @next/next/no-img-element */
import React, { memo, MutableRefObject, useEffect, useState } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
} from 'lucide-react';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import 'highlight.js/styles/ascetic.css';
import { MemoizedReactMarkdown } from "./Markdown";
import 'highlight.js/styles/ascetic.css';
import remarkGfm from 'remark-gfm'
import highlight from 'rehype-highlight';
import rehypeRaw from "rehype-raw";
// @ts-ignore
// @ToBeRemoved
import _ from "lodash";
import Markdown from 'react-markdown';

// @ToBeRemoved
// function chunkString(str: string): string[] {
//   const words = str.split(" ");
//   // @ts-ignore
//   const chunks = _.chunk(words, 2).map(chunk => {
//       const joinedChunk = chunk.join(' ');
//       return joinedChunk + (chunk.length > 1 ? ' ' : '');
//   });
//   return chunks;
// }
function chunkString(str: string): string[] {
  const words = str.split(" ");
  const result: string[] = [];

  for (let i = 0; i < words.length; i += 2) {
    if (i === words.length - 1) {
      // Last word, don't add space
      result.push(words[i]);
    } else if (i === words.length - 2) {
      // Second to last word, join with last word without extra space
      result.push(`${words[i]} ${words[i + 1]}`);
    } else {
      // Add space after every other word
      result.push(`${words[i]} ${words[i + 1]} `);
    }
  }

  return result;
}

const Text = ({
  children,
  isStreaming,
  containerElement = "p",
}: {
  children: React.ReactNode;
  isStreaming: boolean;
  containerElement: React.ElementType;
}) => {
  const renderText = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const chunks = isStreaming ? chunkString(node) : [node];
      return chunks.flatMap((chunk, index) => {
        return (
          <span
            key={`${index}-${chunk.split(" ").join("_")}-streaming`}
            className={cn(
              isStreaming ? "animate-in fade-in-25 duration-700 repeat-1" : "",
            )}
          >
            {chunk}
          </span>
        );
      });
    } else if (React.isValidElement(node)) {
      return React.cloneElement(
        node,
        node.props,
        renderText(node.props.children),
      );
    } else if (Array.isArray(node)) {
      return node.map((child, _) => {
        if (typeof child === 'string') {
          return renderText(child);
        } else {
          return child;
        }
      })
      // return node;
      // return node.map((child, index) => {
      //   if (child.type === 'a') {
      //     return child;
      //   } else if (typeof child === 'string' || child.type === 'h3' || child.type === 'strong' || child.type === 'code') {
      //     return renderText(child);
      //   } else {
      //     return child;
      //     // return (
      //     //   <React.Fragment key={index}>{renderText(child)}</React.Fragment>
      //     // )
      //   }
      // });
    }
    return null;
  };

  const text = renderText(children);
  return React.createElement(containerElement, {}, text);
};

const StreamingParagraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={true} containerElement="p">
        {children}
      </Text>
    );
  },
);

const StreamingH3 = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={true} containerElement="h3">
        {children}
      </Text>
    );
  },
);

const StreamingStrong = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={true} containerElement="strong">
        {children}
      </Text>
    );
  },
);

// @ToBeRemoved
const Paragraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={false} containerElement="p">
        {children}
      </Text>
    );
  },
);

// @ToBeRemoved
const ListItem = memo(({ children }: React.HTMLProps<HTMLLIElement>) => {
  return (
    <Text isStreaming={false} containerElement="li">
      {children}
    </Text>
  );
});

const StreamingListItem = memo(
  ({ children }: React.HTMLProps<HTMLLIElement>) => {
    return (
      <Text isStreaming={true} containerElement="li">
        {children}
      </Text>
    );
  },
);

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);

  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      return setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.sources?.[number - 1]?.metadata?.url}" target="_blank" className="berkeley bg-light-secondary dark:bg-dark-secondary px-1 hover:bg-[#21808D] hover:text-white rounded-full ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
          // `[${number}](${message.sources?.[number - 1]?.metadata?.url})`,
        ),
      );
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(message.content);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });
  return (
    <div>
      {message.role === 'user' && (
        <div className={cn('w-full', messageIndex === 0 ? 'pt-16' : 'pt-8')}>
          {message.content.includes("```") ? (
            <Markdown
              className={cn(
                'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-4 prose-h2:font-[500] prose-h3:mt-2 prose-h3:mb-1.5 prose-h3:font-[500] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                'max-w-none break-words text-[#13343B] dark:text-white prose-h2:text-[#13343B] prose-h3:text-[#13343B] prose-strong:text-[#13343B] prose-h2:text-xl prose-h3:text-lg',
                'dark:prose-h2:text-white dark:prose-h3:text-white fade-in-text'
              )}
              rehypePlugins={[[highlight, {detect: true}]]}
            >{message.content}</Markdown>
          ) : (
            <h2 className="text-[#13343B] dark:text-white font-normal text-3xl lg:w-9/12 inst-sans">
              {message.content}
            </h2>
          )}
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
          <div
            ref={dividerRef}
            className="flex flex-col space-y-6 w-full lg:w-9/12"
          >
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-col space-y-2">
                <div className="flex flex-row items-center space-x-2">
                  <BookCopy className="text-black dark:text-white" size={20} />
                  <h3 className="text-black dark:text-white font-medium text-xl inst-sans">
                    Sources
                  </h3>
                </div>
                <MessageSources sources={message.sources} />
              </div>
            )}
            <div className="flex flex-col space-y-2">
              <div className="flex flex-row items-center space-x-2">
                <Disc3
                  className={cn(
                    'text-[#13343B] dark:text-white',
                    isLast && loading ? 'animate-spin' : 'animate-none',
                  )}
                  size={20}
                />
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Answer
                </h3>
              </div>
                <MemoizedReactMarkdown
                  className={cn(
                    'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-4 prose-h2:font-[500] prose-h3:mt-2 prose-h3:mb-1.5 prose-h3:font-[500] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                    'max-w-none break-words text-[#13343B] dark:text-white prose-h2:text-[#13343B] prose-h3:text-[#13343B] prose-strong:text-[#13343B] prose-h2:text-xl prose-h3:text-lg',
                    'dark:prose-h2:text-white dark:prose-h3:text-white fade-in-text'
                  )}
                  rehypePlugins={[rehypeRaw, [highlight, { detect: true }]]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // @ts-ignore
                    p: loading? StreamingParagraph : ({ children, ...props }) => <p {...props}>{children}</p>,
                    // @ts-ignore
                    li: loading? StreamingListItem: ListItem,
                    // @ts-ignore
                    h3: loading? StreamingH3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
                    // @ts-ignore
                    strong: loading? StreamingStrong: ({ children, ...props }) => <strong {...props}>{children}</strong>,
                  }}
                >
                  {parsedMessage}
              </MemoizedReactMarkdown>
              {loading && isLast ? null : (
                <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                  <div className="flex flex-row items-center space-x-1">
                    {/*  <button className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black text-black dark:hover:text-white">
                      <Share size={18} />
                    </button> */}
                    <Rewrite rewrite={rewrite} messageId={message.messageId} />
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <Copy initialMessage={message.content} message={message} />
                    <button
                      onClick={() => {
                        if (speechStatus === 'started') {
                          stop();
                        } else {
                          start();
                        }
                      }}
                      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                    >
                      {speechStatus === 'started' ? (
                        <StopCircle size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {isLast &&
                message.suggestions &&
                message.suggestions.length > 0 &&
                message.role === 'assistant' &&
                !loading && (
                  <>
                    <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                    <div className="flex flex-col space-y-3 text-[#13343B] dark:text-white">
                      <div className="flex flex-row items-center space-x-2 mt-4">
                        <Layers3 />
                        <h3 className="text-xl font-medium inst-sans">Related</h3>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {message.suggestions.map((suggestion, i) => (
                          <div
                            className="flex flex-col space-y-3"
                            key={i}
                          >
                            <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                            <div
                              onClick={() => {
                                sendMessage(suggestion);
                              }}
                              className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                            >
                              <p className="transition duration-200 hover:text-[#21808D]">
                                {suggestion}
                              </p>
                              <Plus
                                size={20}
                                className="text-[#21808D] flex-shrink-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
          {!loading && (<div className="lg:sticky lg:top-20 flex flex-col items-center space-y-3 w-full lg:w-3/12 z-30 h-full pb-4">
            <SearchImages
              query={history[messageIndex - 1].content}
              chatHistory={history.slice(0, messageIndex - 1)}
            />
            <SearchVideos
              chatHistory={history.slice(0, messageIndex - 1)}
              query={history[messageIndex - 1].content}
            />
          </div>)}
        </div>
      )}
    </div>
  );
};

export default MessageBox;
