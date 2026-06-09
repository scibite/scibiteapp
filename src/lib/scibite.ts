export const languageOptions = [
  "English",
  "Traditional Chinese",
  "Indonesian",
] as const

export const lensOptions = [
  "Game Style",
  "Daily Life Style",
  "Executive Style",
  "Pop Culture Style",
] as const

export const readingLengthOptions = [
  "Quick Bite, 3 minutes",
  "Standard Bite, 5 minutes",
  "Deep Bite, 10 minutes",
] as const

export const scibiteModelOptions = [
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    label: "Nemotron Super 49B",
    helper: "Balanced NVIDIA reasoning model for richer explanations.",
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1",
    label: "Nemotron Nano 8B",
    helper: "Smaller NVIDIA reasoning model for faster, lighter runs.",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B",
    helper: "Compact Meta instruct model for quick drafts.",
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    helper: "Larger Meta instruct model for stronger multilingual reasoning.",
  },
  // {
  //   id: "google/gemma-7b",
  //   label: "Gemma 7B",
  //   helper: "Existing lightweight fallback model.",
  // },
] as const

export const defaultSciBiteModel = scibiteModelOptions[0].id

export type OutputLanguage = (typeof languageOptions)[number]
export type ExplanationLens = (typeof lensOptions)[number]
export type ReadingLength = (typeof readingLengthOptions)[number]
export type SciBiteModel = (typeof scibiteModelOptions)[number]["id"]

export type SciBiteInput = {
  title: string
  abstract: string
  language: OutputLanguage
  lens: ExplanationLens
  length: ReadingLength
  model: SciBiteModel
  source?: "manual" | "arxiv" | "pdf"
  arxivId?: string
  pdfUrl?: string
  pdfFileName?: string
}

export type SciBiteSection = {
  key: SciBiteSectionKey
  title: string
  content: string | string[]
}

export const scibiteSectionKeys = [
  "bite",
  "problem",
  "method",
  "takeaways",
  "analogy",
  "matters",
  "accuracy",
] as const

export type SciBiteSectionKey = (typeof scibiteSectionKeys)[number]

export type SciBiteResult = {
  title: string
  meta: {
    language: OutputLanguage
    lens: ExplanationLens
    length: ReadingLength
  }
  sections: SciBiteSection[]
}

type SearchParamValue = string | string[] | undefined

export const sampleSciBiteInput: SciBiteInput = {
  title: "AI Agents and Autonomous Task Planning",
  abstract:
    "This paper studies how AI agents decompose complex goals into smaller tasks, select tools, maintain memory, and evaluate progress across multi-step workflows. It explains how an agent can transform a broad user request into a sequence of executable subtasks, decide when to call external tools, store useful context from earlier steps, and revise its plan when new evidence appears. The study also compares different planning strategies, including step-by-step decomposition, reflection loops, retrieval-augmented reasoning, and evaluator-based feedback. Alongside these benefits, the paper discusses limitations such as hallucination, error propagation, brittle tool use, weak long-horizon verification, and the challenge of knowing when a human should intervene. Overall, it argues that useful autonomous agents need more than a powerful language model: they require reliable planning, grounded memory, careful monitoring, and clear safeguards for high-stakes decisions.",
  language: "English",
  lens: "Game Style",
  length: "Standard Bite, 5 minutes",
  model: defaultSciBiteModel,
}

export const emptySciBiteInput: SciBiteInput = {
  title: "",
  abstract: "",
  language: "English",
  lens: "Game Style",
  length: "Standard Bite, 5 minutes",
  model: defaultSciBiteModel,
}

export const lensHelperText: Record<ExplanationLens, string> = {
  "Game Style":
    "Frames the paper as a mission with quests, tools, inventory, cooldowns, and progress checks.",
  "Daily Life Style":
    "Turns abstract ideas into grocery runs, kitchen prep, bento planning, and everyday routines.",
  "Executive Style":
    "Summarizes the paper through workflows, delegation, dashboards, and risk controls.",
  "Pop Culture Style":
    "Uses broad movie, series, and storytelling patterns without referencing protected stories directly.",
}

const sectionTitles: Record<OutputLanguage, Record<SciBiteSection["key"], string>> = {
  English: {
    bite: "One-Sentence Bite",
    problem: "Core Problem",
    method: "Main Method",
    takeaways: "Key Takeaways",
    analogy: "Personalized Analogy",
    matters: "Why It Matters",
    accuracy: "Accuracy Note",
  },
  "Traditional Chinese": {
    bite: "一句話重點",
    problem: "核心問題",
    method: "主要方法",
    takeaways: "關鍵收穫",
    analogy: "個人化比喻",
    matters: "為什麼重要",
    accuracy: "準確性提醒",
  },
  Indonesian: {
    bite: "Inti Satu Kalimat",
    problem: "Masalah Utama",
    method: "Metode Utama",
    takeaways: "Poin Penting",
    analogy: "Analogi Personal",
    matters: "Mengapa Penting",
    accuracy: "Catatan Akurasi",
  },
}

export function getSciBiteSectionTitle(
  language: OutputLanguage,
  key: SciBiteSectionKey
) {
  return sectionTitles[language][key]
}

export function getSciBiteModelLabel(model: string | undefined) {
  const option = scibiteModelOptions.find((current) => current.id === model)

  return option?.label ?? model ?? scibiteModelOptions[0].label
}

export function getSciBiteModelHelper(model: string | undefined) {
  const option = scibiteModelOptions.find((current) => current.id === model)

  return option?.helper ?? "Custom NVIDIA model selected from the server configuration."
}

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

function coerceOption<T extends readonly string[]>(
  value: SearchParamValue,
  options: T,
  fallback: T[number]
): T[number] {
  const current = firstParam(value)

  return options.includes(current ?? "") ? current! : fallback
}

export function parseSciBiteInput(
  params: Record<string, SearchParamValue>,
  fallback: SciBiteInput = emptySciBiteInput
): SciBiteInput {
  return {
    title: firstParam(params.title) ?? fallback.title,
    abstract: firstParam(params.abstract) ?? fallback.abstract,
    language: coerceOption(
      params.language,
      languageOptions,
      fallback.language
    ) as OutputLanguage,
    lens: coerceOption(params.lens, lensOptions, fallback.lens) as ExplanationLens,
    length: coerceOption(
      params.length,
      readingLengthOptions,
      fallback.length
    ) as ReadingLength,
    model: coerceOption(
      params.model,
      scibiteModelOptions.map((option) => option.id),
      fallback.model
    ) as SciBiteModel,
    source:
      firstParam(params.source) === "arxiv" ||
      firstParam(params.source) === "manual" ||
      firstParam(params.source) === "pdf"
        ? (firstParam(params.source) as SciBiteInput["source"])
        : fallback.source,
    arxivId: firstParam(params.arxivId) ?? fallback.arxivId,
    pdfUrl: firstParam(params.pdfUrl) ?? fallback.pdfUrl,
    pdfFileName: firstParam(params.pdfFileName) ?? fallback.pdfFileName,
  }
}

export function buildSciBiteQuery(input: SciBiteInput) {
  const params = new URLSearchParams()

  params.set("title", input.title)
  params.set("abstract", input.abstract)
  params.set("language", input.language)
  params.set("lens", input.lens)
  params.set("length", input.length)
  params.set("model", input.model)
  if (input.source) params.set("source", input.source)
  if (input.arxivId) params.set("arxivId", input.arxivId)
  if (input.pdfUrl) params.set("pdfUrl", input.pdfUrl)
  if (input.pdfFileName) params.set("pdfFileName", input.pdfFileName)

  return params.toString()
}

function paperName(input: SciBiteInput) {
  return input.title.trim() || "the provided paper"
}

function depthPhrase(length: ReadingLength) {
  if (length === "Quick Bite, 3 minutes") {
    return "keeps the explanation short and decision-ready"
  }

  if (length === "Deep Bite, 10 minutes") {
    return "adds a little more context around risks, assumptions, and long-horizon use"
  }

  return "balances speed with enough detail for team discussion"
}

type MockLengthCopy = {
  problem: string
  method: string
  takeaways: string[]
  analogy: string
  matters: string
  accuracy: string
}

function joinCopy(...parts: string[]) {
  return parts.filter(Boolean).join(" ")
}

const englishLengthCopy: Record<ReadingLength, MockLengthCopy> = {
  "Quick Bite, 3 minutes": {
    problem: "",
    method: "",
    takeaways: [
      "AI agents need a plan, not just a strong model response.",
      "Tool use and memory help with longer tasks, but they can also preserve mistakes.",
      "Verification is the main safeguard against errors spreading through the workflow.",
    ],
    analogy: "",
    matters: "",
    accuracy:
      "SciBite simplifies the provided text. For formal academic use, check the original paper.",
  },
  "Standard Bite, 5 minutes": {
    problem:
      "This is harder than ordinary chatbot use because every later step depends on whether earlier planning choices were correct.",
    method:
      "That structure makes the agent easier to inspect because each phase has a job and a possible failure point.",
    takeaways: [
      `The selected reading length ${depthPhrase("Standard Bite, 5 minutes")}.`,
      "Strong agents need both planning and verification, not just tool access.",
      "Memory helps agents continue multi-step work, but it can also preserve mistakes.",
      "Hallucination, error propagation, and hard-to-verify long tasks remain key limits.",
    ],
    analogy:
      "The important idea is that progress checks matter as much as action, because a confident wrong turn can make the rest of the run look organized while still moving away from the goal.",
    matters:
      "That makes agent design partly a capability problem and partly a governance problem.",
    accuracy:
      "SciBite simplifies the provided text. For formal academic use, check the original paper and compare the details against the source.",
  },
  "Deep Bite, 10 minutes": {
    problem:
      "The risk grows with task length: one weak decomposition, bad tool call, or unverified memory can quietly shape every later action. This means the central challenge is not only producing fluent reasoning, but maintaining a reliable chain of decisions over time.",
    method:
      "The workflow can be read as a control loop. The agent proposes a plan, acts with tools, records state, checks evidence, and then either continues, revises, or escalates. This makes evaluation more practical because failures can be traced to planning quality, tool selection, memory use, or the final verification step.",
    takeaways: [
      "Autonomous agents are useful when they can break a vague goal into concrete, inspectable steps.",
      "Tool access expands what the system can do, but it also creates new failure modes when tool outputs are misunderstood or over-trusted.",
      "Memory gives the agent continuity across a long task, yet stale or incorrect memory can make the agent consistently wrong.",
      "Reflection and evaluator loops are guardrails that help catch drift before an error becomes the basis for later work.",
      "For high-stakes workflows, the paper points toward hybrid systems where humans review uncertain steps instead of letting autonomy run unchecked.",
    ],
    analogy:
      "In a long campaign, the team does not only need powerful abilities; it also needs a map, a quest log, checkpoints, and rules for when to retreat. The same is true for agents: raw model intelligence helps, but the surrounding process decides whether the system stays aligned with the mission.",
    matters:
      "This matters for product teams because agents are most attractive in exactly the places where mistakes compound: research, operations, coding, analysis, and decision support. A reliable agent therefore needs observability, intervention points, and a clear definition of what counts as success before it is trusted with longer workflows.",
    accuracy:
      "SciBite simplifies the provided text and adds explanatory framing. For formal academic use, check the original paper, verify whether each mechanism is actually supported by the source, and be careful not to treat this simplified explanation as a substitute for the paper's evidence.",
  },
}

const traditionalChineseLengthCopy: Record<ReadingLength, MockLengthCopy> = {
  "Quick Bite, 3 minutes": {
    problem: "",
    method: "",
    takeaways: [
      "AI 代理人需要可檢查的計畫，而不只是流暢回答。",
      "工具與記憶能支援長任務，但也可能把錯誤帶到後面。",
      "驗證是防止錯誤在流程中擴大的主要保護。",
    ],
    analogy: "",
    matters: "",
    accuracy:
      "SciBite 會簡化你提供的文字。正式學術使用時，請查核原始論文。",
  },
  "Standard Bite, 5 minutes": {
    problem:
      "這比一般聊天更困難，因為後續步驟會依賴前面規劃、工具選擇與記憶是否正確。",
    method:
      "這種拆分讓代理人的行為更容易檢查，因為每個階段都有明確功能，也有可以追蹤的失敗點。",
    takeaways: [
      "這個長度會在速度與團隊討論需要的細節之間取得平衡。",
      "強代理人需要規劃，也需要驗證。",
      "記憶能支援長任務，但也可能保留錯誤。",
      "幻覺、錯誤傳遞與長流程驗證仍是限制。",
    ],
    analogy:
      "重點不是跑得快，而是每一段任務都要有檢查點，避免看似順利但方向已經偏掉。",
    matters:
      "因此，代理人設計同時是能力問題，也是風險控制問題。",
    accuracy:
      "SciBite 會簡化你提供的文字。正式學術使用時，請查核原始論文，並把細節與來源對照。",
  },
  "Deep Bite, 10 minutes": {
    problem:
      "任務越長，風險越容易累積：一次不好的拆解、錯誤工具呼叫，或未驗證的記憶，都可能影響後續每一步。核心挑戰不只是產生合理文字，而是讓一連串決策在時間中保持可靠。",
    method:
      "這可以被理解成一個控制迴路。代理人提出計畫、使用工具、記錄狀態、檢查證據，接著選擇繼續、修正或交給人類處理。這也讓評估更具體，因為錯誤可以追到規劃、工具、記憶或最後驗證的某個環節。",
    takeaways: [
      "代理人有用之處在於把模糊目標拆成可以檢查的具體步驟。",
      "工具使用擴大了系統能力，但也會帶來誤解工具輸出或過度信任工具的新風險。",
      "記憶提供長任務的連續性，但錯誤或過期記憶會讓代理人一路偏下去。",
      "反思與評估迴路可以在錯誤擴大前發現偏移。",
      "高風險流程更適合人機協作，讓人類檢查不確定的關鍵步驟。",
    ],
    analogy:
      "在長任務裡，隊伍不只需要強技能，也需要地圖、任務紀錄、檢查點，以及什麼時候撤退的規則。代理人也是如此，模型能力很重要，但外層流程決定它能不能持續對準目標。",
    matters:
      "這對產品與研究團隊很重要，因為代理人最常被期待處理研究、營運、程式、分析與決策支援等錯誤會累積的工作。若要信任長流程代理人，就需要可觀察性、介入點，以及事先定義清楚的成功標準。",
    accuracy:
      "SciBite 會簡化你提供的文字並加入解釋框架。正式學術使用時，請查核原始論文，確認每個機制是否真的由來源支持，不要把這份簡化說明當成論文本身的證據。",
  },
}

const indonesianLengthCopy: Record<ReadingLength, MockLengthCopy> = {
  "Quick Bite, 3 minutes": {
    problem: "",
    method: "",
    takeaways: [
      "Agen AI membutuhkan rencana yang bisa diperiksa, bukan hanya jawaban yang lancar.",
      "Alat dan memori membantu tugas panjang, tetapi juga bisa membawa kesalahan ke tahap berikutnya.",
      "Verifikasi adalah pelindung utama agar error tidak menyebar sepanjang workflow.",
    ],
    analogy: "",
    matters: "",
    accuracy:
      "SciBite menyederhanakan teks yang diberikan. Untuk penggunaan akademik formal, periksa paper aslinya.",
  },
  "Standard Bite, 5 minutes": {
    problem:
      "Ini lebih sulit daripada chatbot biasa karena langkah berikutnya bergantung pada kualitas rencana, pemilihan alat, dan memori di langkah sebelumnya.",
    method:
      "Struktur ini membuat perilaku agen lebih mudah diaudit karena setiap tahap punya fungsi dan titik kegagalan yang bisa dilacak.",
    takeaways: [
      "Panjang bacaan ini menyeimbangkan kecepatan dengan detail yang cukup untuk diskusi tim.",
      "Agen yang kuat perlu perencanaan dan verifikasi.",
      "Memori membantu tugas panjang, tetapi bisa menyimpan kesalahan.",
      "Halusinasi, penyebaran error, dan verifikasi jangka panjang masih menjadi batasan.",
    ],
    analogy:
      "Intinya bukan hanya bergerak cepat, tetapi memiliki checkpoint agar alur yang terlihat rapi tidak diam-diam menjauh dari tujuan.",
    matters:
      "Karena itu, desain agen adalah masalah kemampuan sekaligus masalah kontrol risiko.",
    accuracy:
      "SciBite menyederhanakan teks yang diberikan. Untuk penggunaan akademik formal, periksa paper asli dan cocokkan detailnya dengan sumber.",
  },
  "Deep Bite, 10 minutes": {
    problem:
      "Semakin panjang tugas, semakin mudah risiko menumpuk: satu pemecahan tujuan yang buruk, pemanggilan alat yang salah, atau memori yang belum diverifikasi dapat memengaruhi semua langkah setelahnya. Tantangannya bukan hanya membuat penalaran terdengar masuk akal, tetapi menjaga rantai keputusan tetap andal.",
    method:
      "Workflow ini dapat dibaca sebagai loop kontrol. Agen membuat rencana, bertindak dengan alat, mencatat keadaan, memeriksa bukti, lalu memilih untuk lanjut, merevisi, atau meminta bantuan manusia. Ini juga membuat evaluasi lebih praktis karena kegagalan bisa ditelusuri ke kualitas rencana, pemilihan alat, penggunaan memori, atau verifikasi akhir.",
    takeaways: [
      "Agen otonom berguna ketika dapat mengubah tujuan yang kabur menjadi langkah konkret yang bisa diperiksa.",
      "Akses alat memperluas kemampuan sistem, tetapi menciptakan risiko baru ketika output alat disalahpahami atau terlalu dipercaya.",
      "Memori memberi kontinuitas untuk tugas panjang, namun memori yang salah atau usang dapat membuat agen konsisten keliru.",
      "Refleksi dan evaluator membantu menangkap penyimpangan sebelum error menjadi dasar untuk pekerjaan berikutnya.",
      "Untuk workflow berisiko tinggi, paper ini mengarah pada sistem hibrida di mana manusia meninjau langkah yang tidak pasti.",
    ],
    analogy:
      "Dalam misi panjang, tim tidak hanya butuh kemampuan kuat; mereka juga butuh peta, catatan quest, checkpoint, dan aturan kapan harus mundur. Hal yang sama berlaku untuk agen: kecerdasan model membantu, tetapi proses di sekelilingnya menentukan apakah sistem tetap selaras dengan misi.",
    matters:
      "Ini penting bagi tim produk karena agen paling menarik justru pada pekerjaan seperti riset, operasi, coding, analisis, dan dukungan keputusan, tempat kesalahan dapat menumpuk. Agen yang andal membutuhkan observability, titik intervensi, dan definisi keberhasilan yang jelas sebelum dipercaya menjalankan workflow panjang.",
    accuracy:
      "SciBite menyederhanakan teks yang diberikan dan menambahkan framing penjelasan. Untuk penggunaan akademik formal, periksa paper asli, pastikan setiap mekanisme didukung oleh sumber, dan jangan memperlakukan ringkasan ini sebagai pengganti bukti dari paper.",
  },
}

function englishSections(input: SciBiteInput): Omit<SciBiteSection, "title">[] {
  const title = paperName(input)
  const lengthCopy = englishLengthCopy[input.length]

  const lensContent: Record<
    ExplanationLens,
    {
      bite: string
      analogy: string
      matters: string
    }
  > = {
    "Game Style": {
      bite: `${title} explains how AI agents can turn a big mission into smaller quests, choose tools from their inventory, remember progress, and check whether the run is going off track.`,
      analogy:
        "Imagine an RPG party taking on a long quest. The agent is the player character, planning is the quest log, tools are inventory items, memory is the map, reflection is a checkpoint save, and hallucination is a misleading NPC rumor. The strongest agents know when to use a skill, when a cooldown matters, and when to verify the mission objective before running too far.",
      matters:
        "Better agent planning can make AI systems more useful for multi-step work, but the paper also warns that unchecked errors can snowball across the whole mission.",
    },
    "Daily Life Style": {
      bite: `${title} shows how AI agents can break a messy errand list into a practical plan, pick the right helpers, remember what is already done, and review the final outcome.`,
      analogy:
        "Think of preparing a weekly bento plan. You split meals into ingredients, check the grocery list, use the right kitchen tools, keep track of what is already cooked, and taste-test before serving. If one ingredient is wrong early, the whole meal can drift, which is why checking matters.",
      matters:
        "The paper matters because everyday users need AI that can handle real sequences of work, not just answer one neat question at a time.",
    },
    "Executive Style": {
      bite: `${title} frames AI agents as workflow operators that divide goals, delegate tool use, maintain working memory, and monitor execution risk.`,
      analogy:
        "Picture a decision dashboard for a cross-functional project. Planning defines workstreams, tool use assigns specialist resources, memory keeps the operating history, and reflection acts like a risk review. Hallucination and error propagation are escalation risks that need controls before the workflow scales.",
      matters:
        "This is useful for leaders evaluating where autonomous systems can create leverage and where governance, verification, and human review still need to sit in the process.",
    },
    "Pop Culture Style": {
      bite: `${title} presents AI agents like a story team that breaks a large plot into scenes, assigns roles, remembers continuity, and checks whether the ending still makes sense.`,
      analogy:
        "Imagine a series writers' room building a season arc. The goal becomes episodes, tools become specialists on set, memory keeps continuity notes, and reflection is the table read that catches plot holes. If a false detail sneaks in early, later scenes can amplify it.",
      matters:
        "The paper matters because agent systems need both imagination and continuity control before they can reliably carry a long storyline of actions.",
    },
  }

  const current = lensContent[input.lens]

  return [
    {
      key: "bite",
      content: current.bite,
    },
    {
      key: "problem",
      content: joinCopy(
        "AI systems are getting better at isolated tasks, but complex goals require planning, memory, tool selection, and repeated self-checks across many steps.",
        lengthCopy.problem
      ),
    },
    {
      key: "method",
      content: joinCopy(
        "The paper organizes agent behavior into a pipeline: decompose the goal, select tools, use memory, reflect on progress, and evaluate whether the outcome matches the original task.",
        lengthCopy.method
      ),
    },
    {
      key: "takeaways",
      content: lengthCopy.takeaways,
    },
    {
      key: "analogy",
      content: joinCopy(current.analogy, lengthCopy.analogy),
    },
    {
      key: "matters",
      content: joinCopy(current.matters, lengthCopy.matters),
    },
    {
      key: "accuracy",
      content: lengthCopy.accuracy,
    },
  ]
}

function traditionalChineseSections(
  input: SciBiteInput
): Omit<SciBiteSection, "title">[] {
  const title = paperName(input)
  const lengthCopy = traditionalChineseLengthCopy[input.length]

  const analogy: Record<ExplanationLens, string> = {
    "Game Style":
      "可以把它想成一個 RPG 任務。代理人先把大任務拆成小任務，再從道具欄選工具，用記憶保存地圖與進度，並在檢查點反思是否走錯方向。幻覺就像錯誤的 NPC 提示，若不驗證，後面任務會越跑越偏。",
    "Daily Life Style":
      "可以把它想成準備一週便當。先拆解菜單，整理購物清單，挑選廚房工具，記住哪些步驟已完成，最後試吃檢查。如果前面材料拿錯，後面整份餐點都會受影響。",
    "Executive Style":
      "可以把它想成主管的工作儀表板。規劃負責拆工作流，工具使用像委派資源，記憶保存執行紀錄，反思則像風險審查，避免錯誤在流程中擴大。",
    "Pop Culture Style":
      "可以把它想成一個故事團隊在安排一季劇情。大目標拆成場景，工具像不同專長的工作人員，記憶保存連貫性，反思負責抓出情節漏洞。",
  }

  return [
    {
      key: "bite",
      content: `${title} 說明 AI 代理人如何把複雜目標拆成小步驟、選工具、保留記憶，並檢查長流程是否偏離目標。`,
    },
    {
      key: "problem",
      content: joinCopy(
        "AI 不只需要回答單一問題，還需要處理多步驟任務。困難在於規劃、記憶、工具使用與驗證都可能出錯。",
        lengthCopy.problem
      ),
    },
    {
      key: "method",
      content: joinCopy(
        "研究把代理人流程整理成幾個部分：拆解目標、選擇工具、維持記憶、反思進度，並評估結果是否符合原本任務。",
        lengthCopy.method
      ),
    },
    {
      key: "takeaways",
      content: lengthCopy.takeaways,
    },
    {
      key: "analogy",
      content: joinCopy(analogy[input.lens], lengthCopy.analogy),
    },
    {
      key: "matters",
      content: joinCopy(
        "這篇研究重要，因為未來 AI 若要協助真實工作，就必須能可靠地管理流程，而不是只產生看似流暢的回答。",
        lengthCopy.matters
      ),
    },
    {
      key: "accuracy",
      content: lengthCopy.accuracy,
    },
  ]
}

function indonesianSections(input: SciBiteInput): Omit<SciBiteSection, "title">[] {
  const title = paperName(input)
  const lengthCopy = indonesianLengthCopy[input.length]

  const analogy: Record<ExplanationLens, string> = {
    "Game Style":
      "Bayangkan sebuah quest RPG. Agen memecah misi besar menjadi quest kecil, memilih alat dari inventory, memakai memori seperti peta, lalu melakukan checkpoint untuk memastikan arah masih benar.",
    "Daily Life Style":
      "Bayangkan menyiapkan bento mingguan. Kita membagi menu, membuat daftar belanja, memilih alat dapur, mengingat apa yang sudah selesai, lalu mencicipi hasilnya sebelum disajikan.",
    "Executive Style":
      "Bayangkan dashboard keputusan untuk proyek lintas tim. Perencanaan membagi alur kerja, penggunaan alat seperti delegasi sumber daya, memori menyimpan riwayat, dan refleksi menjadi kontrol risiko.",
    "Pop Culture Style":
      "Bayangkan tim cerita menyusun satu musim serial. Tujuan besar dibagi menjadi adegan, alat menjadi peran pendukung, memori menjaga kesinambungan, dan refleksi menangkap lubang cerita.",
  }

  return [
    {
      key: "bite",
      content: `${title} menjelaskan bagaimana agen AI memecah tujuan besar, memilih alat, menjaga memori, dan mengevaluasi kemajuan dalam tugas panjang.`,
    },
    {
      key: "problem",
      content: joinCopy(
        "Masalah utamanya adalah AI perlu menangani pekerjaan multi-langkah, bukan hanya menjawab satu pertanyaan. Perencanaan, memori, pemakaian alat, dan verifikasi semuanya bisa gagal.",
        lengthCopy.problem
      ),
    },
    {
      key: "method",
      content: joinCopy(
        "Paper ini menyusun proses agen menjadi beberapa tahap: memecah tujuan, memilih alat, memakai memori, merefleksikan kemajuan, dan mengevaluasi hasil akhir.",
        lengthCopy.method
      ),
    },
    {
      key: "takeaways",
      content: lengthCopy.takeaways,
    },
    {
      key: "analogy",
      content: joinCopy(analogy[input.lens], lengthCopy.analogy),
    },
    {
      key: "matters",
      content: joinCopy(
        "Ini penting karena sistem AI yang benar-benar berguna harus bisa menjalankan alur kerja panjang dengan lebih aman dan dapat diperiksa.",
        lengthCopy.matters
      ),
    },
    {
      key: "accuracy",
      content: lengthCopy.accuracy,
    },
  ]
}

export function generateMockSciBite(input: SciBiteInput): SciBiteResult {
  const sectionsByLanguage = {
    English: englishSections,
    "Traditional Chinese": traditionalChineseSections,
    Indonesian: indonesianSections,
  } satisfies Record<
    OutputLanguage,
    (input: SciBiteInput) => Omit<SciBiteSection, "title">[]
  >

  const sections = sectionsByLanguage[input.language](input).map((section) => ({
    ...section,
    title: sectionTitles[input.language][section.key],
  }))

  return {
    title: paperName(input),
    meta: {
      language: input.language,
      lens: input.lens,
      length: input.length,
    },
    sections,
  }
}

export function formatSciBiteForCopy(result: SciBiteResult) {
  const header = `${result.title}\n${result.meta.lens} - ${result.meta.length} - ${result.meta.language}`
  const body = result.sections
    .map((section) => {
      const content = Array.isArray(section.content)
        ? section.content.map((item) => `- ${item}`).join("\n")
        : section.content

      return `${section.title}\n${content}`
    })
    .join("\n\n")

  return `${header}\n\n${body}`
}
