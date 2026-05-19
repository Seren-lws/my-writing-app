export type WritingDNA = {
  languageStyle?: string;
  preferences?: string;
  taboos?: string;
  references?: string;
  relationshipTension?: string;
};

export type BookSoul = {
  bookId: string;
  tone?: string;
  relationship?: string;
  worldRules?: string;
  mustNotBreak?: string;
  keywords?: string;
  aiReminder?: string;
};

export type AdultSettings = {
  enabled: boolean;
  rating: string;
  writingStyle: string;
  relationBoundary: string;
  preferences: string;
  taboos: string;
};

export type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
};

export type PromptContext = {
  bookTitle: string;
  writingDNA: WritingDNA;
  soul?: BookSoul;
  adultSettings: AdultSettings | null;
  inspirations: Inspiration[];
};

export type ChapterContext = {
  title: string;
  content: string;
  outline: string;
  aiInstruction: string;
};

export function buildSystemPrompt(ctx: PromptContext): string {
  const { bookTitle, writingDNA, soul, adultSettings, inspirations } = ctx;

  const sections: string[] = [
    `你是作者的写作搭子。你输出的内容永远是草稿态，供作者参考修改，不会直接成为正式章节。请严格遵循作者的语言风格和设定，不要自作主张改变人物性格或剧情走向。`,

    `【第一层：我的写作 DNA】
语言风格：${writingDNA.languageStyle || "暂无"}
写作偏好：${writingDNA.preferences || "暂无"}
禁忌清单：${writingDNA.taboos || "暂无"}
参考作品 / 参考作者：${writingDNA.references || "暂无"}
常用人物关系与张力：${writingDNA.relationshipTension || "暂无"}`,

    `【第二层：这本书的灵魂】
书名：${bookTitle}
核心基调：${soul?.tone || "暂无"}
主角关系与张力：${soul?.relationship || "暂无"}
世界观 / 背景规则：${soul?.worldRules || "暂无"}
绝对不能写崩的地方：${soul?.mustNotBreak || "暂无"}
本书关键词：${soul?.keywords || "暂无"}
AI 写作时要记住的提醒：${soul?.aiReminder || "暂无"}`,
  ];

  if (adultSettings?.enabled) {
    sections.push(`【成人向创作设置】
作品分级：${adultSettings.rating || "暂无"}
关系边界：${adultSettings.relationBoundary || "暂无"}
描写风格：${adultSettings.writingStyle || "暂无"}
偏好说明：${adultSettings.preferences || "暂无"}
禁忌清单：${adultSettings.taboos || "暂无"}`);
  }

  if (inspirations.length > 0) {
    const list = inspirations
      .slice(0, 5)
      .map((item, i) => `${i + 1}. ${item.content}`)
      .join("\n");
    sections.push(`【近期灵感（供参考）】\n${list}`);
  }

  return sections.join("\n\n");
}

export function buildUserMessage(chapter: ChapterContext): string {
  const lines: string[] = [`章节：${chapter.title}`];

  if (chapter.content.trim()) {
    lines.push(`\n已有正文：\n${chapter.content}`);
  }

  if (chapter.outline.trim()) {
    lines.push(`\n本章大纲：\n${chapter.outline}`);
  }

  if (chapter.aiInstruction.trim()) {
    lines.push(`\n本次指令：\n${chapter.aiInstruction}`);
  } else {
    lines.push(`\n请根据大纲续写，保持文风一致。`);
  }

  return lines.join("\n");
}
