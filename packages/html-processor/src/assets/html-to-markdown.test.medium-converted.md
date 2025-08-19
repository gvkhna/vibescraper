[Sitemap](/sitemap/sitemap.xml)

[Open in app](https://rsci.app.link/?%24canonical%5Furl=https%3A%2F%2Fmedium.com%2Fp%2Fdf54193e2de3&%7Efeature=LiOpenInAppButton&%7Echannel=ShowPostUnderCollection&%7Estage=mobileNavBar&source=post%5Fpage---top%5Fnav%5Flayout%5Fnav-----------------------------------------)

[Medium Logo](/?source=post%5Fpage---top%5Fnav%5Flayout%5Fnav-----------------------------------------)

[Write](https://medium.com/new-story?source=post%5Fpage---top%5Fnav%5Flayout%5Fnav-----------------------------------------)

![Estimate Loop](https://miro.medium.com/v2/resize:fill:64:64/1*pTIqVjxFwQ1RAg0p60qV4A.png)

Get unlimited access to the best of Medium for less than $1/week.

[Become a memberBecome a member](/plans?source=upgrade%5Fmembership---post%5Ftop%5Fnav%5Fupsell-----------------------------------------)

[CodeX](https://medium.com/codex?source=post%5Fpage---publication%5Fnav-29038077e4c6-df54193e2de3---------------------------------------)

·

Follow publication

[![CodeX](https://miro.medium.com/v2/resize:fill:76:76/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post%5Fpage---post%5Fpublication%5Fsidebar-29038077e4c6-df54193e2de3---------------------------------------)

Everything connected with Tech & Code. Follow to join our 1M+ monthly readers

Follow publication

Top highlight

1

1

1

![](https://miro.medium.com/v2/resize:fit:2912/1*LxIyh8pAhZqXl3ADn_pz3A.jpeg)

# What Are AI Agents? A Short Intro And A Step-by-Step Guide to Build Your Own.

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:64:64/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---byline--df54193e2de3---------------------------------------)

[Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---byline--df54193e2de3---------------------------------------)

Follow

8 min read

·

Dec 28, 2024

2.7K

70

[Listen](/plans?dimension=post%5Faudio%5Fbutton&postId=df54193e2de3&source=upgrade%5Fmembership---post%5Faudio%5Fbutton-----------------------------------------)

Share

More

**The next big thing?** Gartner believes AI agents are the future. OpenAI, Nvidia and Microsoft are betting on it — as are companies such as Salesforce, which have so far been rather inconspicuous in the field of AI.

And there’s no doubt that the thing is really taking off right now.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:2000/1*wxbaaC3vQZYiBYzz5AGhBQ.png)

„AI Agents“ on Google Trends (trends.google.com)

Wow.

So, what is really behind the trend? The key to understanding agents is **agency**.

Unlike traditional generative AI systems, agents don’t just respond to user input. Instead, **they can process a complex problem such as an insurance claim from start to finish**. This includes understanding the text, images and PDFs of the claim, retrieving information from the customer database, comparing the case with the insurance terms and conditions, asking the customer questions and waiting for their response — even if it takes days — without losing context.

**The agents do this autonomously** — without humans having to check whether the AI is processing everything correctly.

[How I Got a Big AI Agent Up and Running — What Worked and What Didn’t.We went live in September last year with a logistics AI agent that autonomously retrieves lost shipments in…medium.com](/@maximilian.vogel/how-i-got-a-big-ai-agent-up-and-running-what-worked-and-what-didnt-7615155d2b73?source=post%5Fpage-----df54193e2de3---------------------------------------)

# The Espresso Machine and the Barista

In contrast to existing AI systems and all the copilots out there that **help employees** to do their job, **AI agents are, in fact, fully-fledged employees themselves**, offering immense potential for process automation.

**Imagine** — an AI that can take on complex, multi-step tasks that are currently performed by a human employee or an entire department:

* Planning, designing, executing, measuring, and optimizing **a marketing campaign**
* **Locate a lost shipment in logistics** by communicating with carriers, customers, and warehouses — or, if it remains lost, claim its value from the responsible partner.
* **Search the trademark database** each day and determine whether a new trademark has been registered that conflicts with my own trademark and immediately file an opposition
* gather the relevant data or ask employees, check the data and **compile an ESG report**

Currently, AI models can assist with tasks like generating campaign content or evaluating emails, but they lack the ability to execute an entire process. **An AI agent can do that.**

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:2000/1*V8B2X23xlhZ9gcdCwIAA6A.png)

Traditional generative AI can help human teams in a process (yellow), AI agents can execute the complete process end2end (orange). Image credit: Maximilian Vogel

**While traditional models are like great espresso machines, agent-based AI is the barista.** Not only can they make coffee, but they can welcome the guests, take the order, serve the coffee, collect the money, put the cups in the dishwasher, and even close up shop at night. Even the best espresso machine in the world can’t run a café by itself, but the barista can.

Why can the AI agent and the barista do this? They excel at mastering various subprocesses of a complex job and can independently decide which task to tackle next. They can communicate with people, like the clients, if they need more information (milk or oat milk?). They can decide who they should ask in case of problems (beans are out => boss, coffee machine is on strike => customer service of the machine vendor).

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:1400/1*7rWViLLiWpoHivd15UHZTQ.png)

AI agents vs. traditional generative AI. Image credit: Maximilian Vogel

# **Anatomy of an AI Worker**

But enough chatting, let’s build an AI agent. Let us have a look at the relevant processes and workflows.

Let us **build an agent for the insurance process** shown in the diagram above. The agent should handle an insurance claim from start to reimbursement.

What we are developing here is the **business architecture and the process flow.** Unfortunately, I can’t dive into the coding because it can quickly become very extensive.

## 1\. Classification & sending a job into processing lanes

Our workflow starts, when a customer sends a message **with a claim for their home insurance to the insurer.**

What does our agent do? It determines what the customer wants by analyzing the message’s content.

Based on this classification, the system initiates a processing lane. Often, this goes beyond [function calling](https://platform.openai.com/docs/guides/function-calling); it involves making a fundamental decision about the process, followed by executing many discrete steps.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:2000/1*CvV2Yu0Nk43LN7GUDO8JPQ.png)

AI Agents: 1\. Classify a mail and routing into different processing lanes. Image credit: Maximilian Vogel

## 2\. Extracting data

In the next step, data is extracted. **One of the main tasks of an agent is to turn unstructured data into structured data** … to make processing **systematic, safe and secure**.

**Classification assigns a text to a predefined category, whereas extraction involves reading and interpreting data from the text.** However, a language model doesn’t directly copy data from the input prompt; instead, it generates a response. This allows for data formatting, such as converting a phone number from ‘(718) 123–45678’ to ‘+1 718 123 45678’.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:1400/1*Q8o6a2-Fe1FbqIOS7I3EaQ.png)

AI Agents: 2\. Extract data from the mail and attachments. Image credit: Maximilian Vogel

The extraction of data is not limited to text content (from the e-mail text), but can also comprise data from images, PDFs or other documents. We use more than one model for that: LLMs, image recognition models, OCR and others. The above process is simplified, really massively simplified. In reality, we often send images to OCR systems that extract text from scanned invoices or forms.. And often we classify attachments as well, before analyzing them.

We enforce JSON as the model’s output format to ensure structured data.

This is the email input — **unstructured data**:

Hi,  
  
I would like to report a damage and ask you to compensate me.  
  
Yesterday, while playing with a friend, my 9-year-old son Rajad kicked a soccer ball against the chandelier in the living room, which then broke from its holder and fell onto the floor and shattered (it was made of glass).   
  
Luckily no one is injured, but the chandelier is damaged beyond repair.   
  
Attached is an invoice and some images of the destroyed chandelier.  
  
Deepak Jamal  
contract no: HC12-223873923  
123 Main Street  
10008 New York City  
(718) 123 45678

This is the model output — a JSON, **structured data**:

{  
  "name": "Deepak",  
  "surname": "Jamal",  
  "address": "123 Main Street, 10008 New York City, NY",  
  "phone":"+1 718 123 45678",  
  "contract_no": "HC12-223873923",  
  "claim_description": "Yesterday [Dec-8, 2024], while playing with a friend, my 9-year-old son Rajad kicked a soccer ball against the chandelier in the living room, which then broke from its holder and fell onto the floor and shattered (it was made of glass).\nLuckily no one is injured, but the chandelier is damaged beyond repair.\n"  
}

## 3\. Calling external services, making the context persistent

Many generative AI systems can answer queries directly — sometimes using pre-trained data, fine-tuning, or Retrieval Augmented Generation (RAG) on some documents. This is not enough for agents. **Almost every reasonably powerful AI agent needs to access corporate or external data from databases.**

**To keep the context of a process persistent beyond the current session, it must also write data to systems and databases**. In our case, the agent checks the contract number against a customer database and writes the status of the claim to an issue tracking system. It can also — remember: agency! — request missing data from external parties, such as the customer.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:1400/1*UjA1UCxseKtTDiZWDjmVWg.png)

AI Agents: 3\. Call external services and make the context persistent. Image credit: Maximilian Vogel

## 4\. Assessment, RAG, reasoning and confidence

The heart of every administration job consists of interpreting incoming cases in relation to various rules. AI is particularly good at this. Because we can’t provide all contextual information (e.g., policy content or terms and conditions) when calling a model, **we use a vector database to retrieve relevant snippets — a technique known as RAG**.

And we prompt the AI to **‘think aloud’** before making an assessment. Thinking before blurting out the result improves answer quality — something we’ve all learned since 3rd grade math. We can also use the output of the model reasoning in many obvious and less obvious ways:  
\- To substantiate an answer to the customer  
\- To help the prompt engineer and data scientist figure out why the model made a mistake  
\- For checks: Did the model arrive at the correct answer by chance, or can we see through its reasoning that the solution was inevitable?

Here’s a little [cheat sheet on reasoning and other prompt engineering techniques](https://www.linkedin.com/pulse/perfect-prompt-engineering-cheat-sheet-snippets-part-vogel-mxkcf/?trackingId=ikeDZrOwQieHCRRwSIvx2w%3D%3D).

**Confidence is the key to maximizing accuracy.** If the model estimates its confidence — and, dear prompt engineers, this also requires very good few shot learning examples for various confidence values — then we can configure the system to operate with extreme safety or high automation: We set a threshold of confidence below which all cases should go to human support. A high threshold ensures minimal errors but requires more manual processing, while a lower threshold allows more cases to be processed automatically, albeit with an increased risk of errors.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:2000/1*-kJEBbVKpueHaNxEmvlLXw.png)

AI Agents: 4\. Use RAG / reasoning / confidence to obtain reliable assessments. Image credit: Maximilian Vogel

Et voila! If you have just implemented 2 or 3 of the above steps, you have developed an agent. I’ve outlined only the key components of these AI agents. You can certainly imagine the others. **And you can either implement it with help of frameworks such as crewAI, langGraph, langFlow and their siblings or just do it in pure Python.**

Remarkably, such a system can automate 70%–90% of a claims management department’s workload. And that’s not possible with simple pre-agent generative AI systems. Two years ago, I could never have imagined this becoming reality so quickly.

tl;dr? Here’s AI agents in a nutshell:

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:2000/1*tljAv3gFZUqC4LeKr-ATUQ.png)

The 3 Laws of AI Agents: Image credit: Maximilian Vogel with obvious borrowings from [Isaac Asimov](https://en.wikipedia.org/wiki/Three%5FLaws%5Fof%5FRobotics)

These agents will certainly keep me busy over the coming months — my team and me have just launched a large logistics system.

I wish you every success with your AI and agentic AI systems!

And if you feel like it:  
**Follow me on Medium (⇈) or** [**LinkedIn**](https://www.linkedin.com/in/maximilian-vogel-0539427) for updates and new stories on generative AI, AI workers, and prompt engineering.

[Ai Agent](/tag/ai-agent?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Generative Ai](/tag/generative-ai?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Machine Learning](/tag/machine-learning?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Reasoning](/tag/reasoning?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Automation](/tag/automation?source=post%5Fpage-----df54193e2de3---------------------------------------)

2.7K

2.7K

70

[![CodeX](https://miro.medium.com/v2/resize:fill:96:96/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post%5Fpage---post%5Fpublication%5Finfo--df54193e2de3---------------------------------------)

[![CodeX](https://miro.medium.com/v2/resize:fill:128:128/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post%5Fpage---post%5Fpublication%5Finfo--df54193e2de3---------------------------------------)

Follow

[Published in CodeX](https://medium.com/codex?source=post%5Fpage---post%5Fpublication%5Finfo--df54193e2de3---------------------------------------)

[29K followers](/codex/followers?source=post%5Fpage---post%5Fpublication%5Finfo--df54193e2de3---------------------------------------)

·[Last published 1 day ago](/codex/fans-spinning-usb-ghosting-master-linux-monitoring-like-a-pro-9452eac741bb?source=post%5Fpage---post%5Fpublication%5Finfo--df54193e2de3---------------------------------------)

Everything connected with Tech & Code. Follow to join our 1M+ monthly readers

Follow

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:96:96/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---post%5Fauthor%5Finfo--df54193e2de3---------------------------------------)

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:128:128/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---post%5Fauthor%5Finfo--df54193e2de3---------------------------------------)

Follow

[Written by Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---post%5Fauthor%5Finfo--df54193e2de3---------------------------------------)

[13.7K followers](/@maximilian.vogel/followers?source=post%5Fpage---post%5Fauthor%5Finfo--df54193e2de3---------------------------------------)

·[378 following](/@maximilian.vogel/following?source=post%5Fpage---post%5Fauthor%5Finfo--df54193e2de3---------------------------------------)

Machine learning, generative AI aficionado and speaker. Co-founder BIG PICTURE.

Follow

## Responses (70)

![Estimate Loop](https://miro.medium.com/v2/resize:fill:64:64/1*pTIqVjxFwQ1RAg0p60qV4A.png)

Estimate Loop

What are your thoughts?   

Cancel

Respond

[![Gabe Domen](https://miro.medium.com/v2/resize:fill:64:64/1*Pww6LJdxGE0GlpY-NucW1w.jpeg)](/@04bshitters?source=post%5Fpage---post%5Fresponses--df54193e2de3----0-----------------------------------)

[Gabe Domen](/@04bshitters?source=post%5Fpage---post%5Fresponses--df54193e2de3----0-----------------------------------)

[Dec 28, 2024](/@04bshitters/imagine-an-ai-that-can-take-on-complex-multi-step-tasks-that-are-currently-performed-by-a-human-027f9872b225?source=post%5Fpage---post%5Fresponses--df54193e2de3----0-----------------------------------)

Imagine — an AI that can take on complex, multi-step tasks that are currently performed by a human employee or an entire department.  
Imagine... What are people will be doing?...and please don't answer me back "more intelligent things" or "Applying…more

227

2 replies

Reply

[![PeterL](https://miro.medium.com/v2/resize:fill:64:64/0*rVSBgOzE-DwQd6K9)](/@luowuyu?source=post%5Fpage---post%5Fresponses--df54193e2de3----1-----------------------------------)

[PeterL](/@luowuyu?source=post%5Fpage---post%5Fresponses--df54193e2de3----1-----------------------------------)

[Dec 30, 2024](/@luowuyu/i-like-this-metaphor-it-clearly-explains-the-difference-between-ai-and-ai-agent-in-one-sentence-fb4786be8a48?source=post%5Fpage---post%5Fresponses--df54193e2de3----1-----------------------------------)

The Espresso Machine and the Barista

I like this metaphor. It clearly explains the difference between AI and AI agent in one sentence.

76

1 reply

Reply

[![Berk ARSLAN](https://miro.medium.com/v2/resize:fill:64:64/0*pPMaOy5StmlEOSCd)](/@bberk.arslan?source=post%5Fpage---post%5Fresponses--df54193e2de3----2-----------------------------------)

[Berk ARSLAN](/@bberk.arslan?source=post%5Fpage---post%5Fresponses--df54193e2de3----2-----------------------------------)

[Jan 3](/@bberk.arslan/i-really-liked-the-writing-c41bfac21701?source=post%5Fpage---post%5Fresponses--df54193e2de3----2-----------------------------------)

I really liked the writing. It provides basic examples to understand what is AI Agent. Thank you for the writing!

I have a question: programming an AI agent needs human interaction that makes it open to human errors like (forgotten steps in the agent…more

154

1 reply

Reply

See all responses

## More from Maximilian Vogel and CodeX

![Mastering AI Agents: The 10 Best Free Courses, Tutorials & Learning Tools](https://miro.medium.com/v2/resize:fit:1358/1*O1kuchJvf9Gjv3gT2J8IBg.png)

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:40:40/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---author%5Frecirc--df54193e2de3----0---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---author%5Frecirc--df54193e2de3----0---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[Mastering AI Agents: The 10 Best Free Courses, Tutorials & Learning ToolsUpdated Jun-8, 2025: Added resources for the Model Context Protocol (MCP).](/@maximilian.vogel/mastering-ai-agents-the-10-best-free-courses-tutorials-learning-tools-46bc380a19d1?source=post%5Fpage---author%5Frecirc--df54193e2de3----0---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

Mar 13

[A clap icon2.1KA response icon37](/@maximilian.vogel/mastering-ai-agents-the-10-best-free-courses-tutorials-learning-tools-46bc380a19d1?source=post%5Fpage---author%5Frecirc--df54193e2de3----0---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

![Meta Turned Your Phone Into a Spy — Here’s How](https://miro.medium.com/v2/resize:fit:1358/1*u8h1gesC8d0UaDDnXtDJOw.png)

[![CodeX](https://miro.medium.com/v2/resize:fill:40:40/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post%5Fpage---author%5Frecirc--df54193e2de3----1---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

In

[CodeX](https://medium.com/codex?source=post%5Fpage---author%5Frecirc--df54193e2de3----1---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

by

[AI Rabbit](/@airabbitX?source=post%5Fpage---author%5Frecirc--df54193e2de3----1---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[Meta Turned Your Phone Into a Spy — Here’s HowMeta just proved they’ll do absolutely anything to track you. Here’s how they turned your own phone against you.](/codex/metas-localhost-tracking-the-most-brazen-privacy-violation-we-ve-seen-yet-72b58839a3a4?source=post%5Fpage---author%5Frecirc--df54193e2de3----1---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

Jun 26

[A clap icon2.2KA response icon27](/codex/metas-localhost-tracking-the-most-brazen-privacy-violation-we-ve-seen-yet-72b58839a3a4?source=post%5Fpage---author%5Frecirc--df54193e2de3----1---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

![Real-Time Server-Sent Events in ASP.NET Core and .NET 10](https://miro.medium.com/v2/resize:fit:1358/1*3HXR8BZ_o7O7EbHMnwZDWA.png)

[![CodeX](https://miro.medium.com/v2/resize:fill:40:40/1*VqH0bOrfjeUkznphIC7KBg.png)](https://medium.com/codex?source=post%5Fpage---author%5Frecirc--df54193e2de3----2---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

In

[CodeX](https://medium.com/codex?source=post%5Fpage---author%5Frecirc--df54193e2de3----2---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

by

[Anton Martyniuk](/@anton.martyniuk?source=post%5Fpage---author%5Frecirc--df54193e2de3----2---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[Real-Time Server-Sent Events in ASP.NET Core and .NET 10The coolest feature in ASP .NET Core 10 yet! Server-Sent Events. it’ a simpler alternative to SignalR](/codex/real-time-server-sent-events-in-asp-net-core-and-net-10-edb8845b2f1c?source=post%5Fpage---author%5Frecirc--df54193e2de3----2---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

Jul 22

[A clap icon236A response icon4](/codex/real-time-server-sent-events-in-asp-net-core-and-net-10-edb8845b2f1c?source=post%5Fpage---author%5Frecirc--df54193e2de3----2---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

![A meerkat librarian working with books and documents on ChatGPT.](https://miro.medium.com/v2/resize:fit:1358/1*BP2RicPK2Y-fIc0djIZWVg.png)

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:40:40/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---author%5Frecirc--df54193e2de3----3---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---author%5Frecirc--df54193e2de3----3---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[The ChatGPT list of lists: A collection of 3000+ prompts, GPTs, use-cases, tools, APIs, extensions…Updated Aug-8, 2025\. Added New Models, Prompts, Lists and Tools](/@maximilian.vogel/the-chatgpt-list-of-lists-a-collection-of-1500-useful-mind-blowing-and-strange-use-cases-8b14c35eb?source=post%5Fpage---author%5Frecirc--df54193e2de3----3---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

Feb 7, 2023

[A clap icon13.6KA response icon194](/@maximilian.vogel/the-chatgpt-list-of-lists-a-collection-of-1500-useful-mind-blowing-and-strange-use-cases-8b14c35eb?source=post%5Fpage---author%5Frecirc--df54193e2de3----3---------------------11d378da%5F8ce1%5F4c47%5F882c%5Fbeb8bd689662--------------)

[See all from Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---author%5Frecirc--df54193e2de3---------------------------------------)

[See all from CodeX](https://medium.com/codex?source=post%5Fpage---author%5Frecirc--df54193e2de3---------------------------------------)

## Recommended from Medium

![Guardrails for AI Agents](https://miro.medium.com/v2/resize:fit:1358/1*Bs1rAsLRh2PRMEmWzIOtqw.png)

[![Data Science Collective](https://miro.medium.com/v2/resize:fill:40:40/1*0nV0Q-FBHj94Kggq00pG2Q.jpeg)](https://medium.com/data-science-collective?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

In

[Data Science Collective](https://medium.com/data-science-collective?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

by

[Debmalya Biswas](/@debmalyabiswas?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Guardrails for AI AgentsUse-case specific validation tests and guardrails generation for Agentic AI](/data-science-collective/guardrails-for-ai-agents-8913f6b67b51?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Aug 4

[A clap icon217A response icon9](/data-science-collective/guardrails-for-ai-agents-8913f6b67b51?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

![Future-Proof Careers in the Age of AI: What You Should Learn in 2026](https://miro.medium.com/v2/resize:fit:1358/0*2PGQR_Ue8T-MrB5G)

[![Predict](https://miro.medium.com/v2/resize:fill:40:40/1*EetZyjDw-19wRRBzc6fSMA.png)](https://medium.com/predict?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

In

[Predict](https://medium.com/predict?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

by

[iswarya writes](/@iswaryawrites?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Future-Proof Careers in the Age of AI: What You Should Learn in 2026What if I told you that by this time next year, you could land a job that pays over $100,000 — and it won’t be threatened by AI?](/predict/future-proof-careers-in-the-age-of-ai-what-you-should-learn-in-2026-e4ddd321347c?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Jul 29

[A clap icon1.7KA response icon91](/predict/future-proof-careers-in-the-age-of-ai-what-you-should-learn-in-2026-e4ddd321347c?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

![Money](https://miro.medium.com/v2/resize:fit:1358/0*OnYGLdfO9qWtmrON)

[![LearnAItoprofit.com](https://miro.medium.com/v2/resize:fill:40:40/1*MDbgiQN0r_f0k9x45YcB7g.png)](https://medium.com/writing-for-profit-with-ai?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

In

[LearnAItoprofit.com](https://medium.com/writing-for-profit-with-ai?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

by

[Berker Ceylan](/@bberkerceylan?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[I Automated My Life With AI and Made $3,000 This Month (Here’s My Exact System)Stop working harder. Start working with AI. Your productivity stack is broken. Here’s how to fix it.](/writing-for-profit-with-ai/i-automated-my-life-with-ai-and-made-3-000-this-month-heres-my-exact-system-5ce469a4ebf3?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Jul 14

[A clap icon1.6KA response icon65](/writing-for-profit-with-ai/i-automated-my-life-with-ai-and-made-3-000-this-month-heres-my-exact-system-5ce469a4ebf3?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----0---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

![Mastering AI Agents: The 10 Best Free Courses, Tutorials & Learning Tools](https://miro.medium.com/v2/resize:fit:1358/1*O1kuchJvf9Gjv3gT2J8IBg.png)

[![Maximilian Vogel](https://miro.medium.com/v2/resize:fill:40:40/1*lmHlRIRIVfE_leviIp1iOg.png)](/@maximilian.vogel?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Maximilian Vogel](/@maximilian.vogel?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Mastering AI Agents: The 10 Best Free Courses, Tutorials & Learning ToolsUpdated Jun-8, 2025: Added resources for the Model Context Protocol (MCP).](/@maximilian.vogel/mastering-ai-agents-the-10-best-free-courses-tutorials-learning-tools-46bc380a19d1?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Mar 13

[A clap icon2.1KA response icon37](/@maximilian.vogel/mastering-ai-agents-the-10-best-free-courses-tutorials-learning-tools-46bc380a19d1?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----1---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

![Top 10 LLM & RAG Projects for Your AI Portfolio (2025–26)](https://miro.medium.com/v2/resize:fit:1358/0*NazJM1jxXQpHTnZX.png)

[![Ramakrushna Mohapatra](https://miro.medium.com/v2/resize:fill:40:40/1*oHNmrWWd625qGEG8NBktkQ.png)](/@techwithram?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----2---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Ramakrushna Mohapatra](/@techwithram?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----2---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Top 10 LLM & RAG Projects for Your AI Portfolio (2025–26)Retrieval-Augmented Generation (RAG) is like giving your AI a memory upgrade and a Google search bar. Instead of making up answers based on…](/@techwithram/top-10-llm-rag-projects-for-your-ai-portfolio-2025-26-582cc7ab6507?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----2---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Aug 3

[A clap icon332A response icon7](/@techwithram/top-10-llm-rag-projects-for-your-ai-portfolio-2025-26-582cc7ab6507?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----2---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

![AI Agent: Workflow vs Agent (Part-5)](https://miro.medium.com/v2/resize:fit:1358/0*TmrYdy5fYlzQn8DY.png)

[![Vipra Singh](https://miro.medium.com/v2/resize:fill:40:40/1*LDjQS3c-G1gsojOf24ijGg@2x.jpeg)](/@vipra%5Fsingh?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----3---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[Vipra Singh](/@vipra%5Fsingh?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----3---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[AI Agent: Workflow vs Agent (Part-5)Discover AI agents, their design, and real-world applications.](/@vipra%5Fsingh/ai-agent-workflow-vs-agent-part-5-2026a890a33d?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----3---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

Mar 13

[A clap icon858A response icon24](/@vipra%5Fsingh/ai-agent-workflow-vs-agent-part-5-2026a890a33d?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3----3---------------------184efae2%5Ffefc%5F486a%5F8631%5F0a2ffa0fb428--------------)

[See more recommendations](/?source=post%5Fpage---read%5Fnext%5Frecirc--df54193e2de3---------------------------------------)

[Help](https://help.medium.com/hc/en-us?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Status](https://medium.statuspage.io/?source=post%5Fpage-----df54193e2de3---------------------------------------)

[About](/about?autoplay=1&source=post%5Fpage-----df54193e2de3---------------------------------------)

[Careers](/jobs-at-medium/work-at-medium-959d1a85284e?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Press](mailto:pressinquiries@medium.com)

[Blog](https://blog.medium.com/?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Privacy](https://policy.medium.com/medium-privacy-policy-f03bf92035c9?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Rules](https://policy.medium.com/medium-rules-30e5502c4eb4?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f?source=post%5Fpage-----df54193e2de3---------------------------------------)

[Text to speech](https://speechify.com/medium?source=post%5Fpage-----df54193e2de3---------------------------------------)

Highlight

Respond

Share

Private note