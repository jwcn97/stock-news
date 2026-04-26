import * as dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import { getCompanyNews } from './finnhub';

const bot = new TelegramBot(process.env.BOT_TOKEN ?? '');
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TOP_ITEMS_LEN = 10;
const COMPANY_NAME_BY_SYMBOL: Record<string, string> = {
  MSFT: 'Microsoft',
  MCO: 'Moody',
  V: 'Visa',
  KO: 'Coca Cola',
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFilteredNewsItems = (symbol: string, items: any[]) => {
  const companyName = COMPANY_NAME_BY_SYMBOL[symbol] ?? '';
  const companyNamePossessive = companyName ? `${companyName}'s` : '';
  const keywords = [symbol, companyName, companyNamePossessive]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return items.filter((item) => {
    const content = `${item.headline ?? ''} ${item.summary ?? ''}`.toLowerCase();
    return keywords.some((keyword) => {
      const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      return pattern.test(content);
    });
  });
};

const formatNewsMessage = (symbol: string, items: any[]) => {
  const filteredItems = getFilteredNewsItems(symbol, items);
  if (!filteredItems.length) {
    return '';
  }

  const topItems = filteredItems.slice(0, TOP_ITEMS_LEN);
  const lines = topItems.map((item) => {
    const time = new Date(item.datetime * 1000).toLocaleString('en-US', {
      hour12: false,
    });
    const headline = escapeHtml(item.headline ?? 'No headline');
    const summary = escapeHtml(item.summary ?? 'No summary available.');
    const source = escapeHtml(item.source ?? 'Unknown');
    const url = item.url ?? '';

    return `• <b>${headline}</b>\n${summary}\n<i>${source}</i> | ${escapeHtml(
      time
    )}\n<a href="${url}">Read more</a>`;
  });

  return `📈 <b>${escapeHtml(symbol)}</b>\n\n${lines.join('\n\n')}`;
};

const formatCombinedNewsMessage = (
  newsBySymbol: Array<{ symbol: string; news: any[] }>
): string | null => {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const sections = newsBySymbol
    .map(({ symbol, news }) => formatNewsMessage(symbol, news))
    .filter(Boolean);

  if (!sections.length) {
    return null;
  }

  return `🗞️ <b>Daily Stock News</b>\n<i>${escapeHtml(dateLabel)}</i>\n\n${sections.join(
    '\n\n--------------------\n\n'
  )}`;
};

const sendDailyNews = async () => {
  if (!TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_CHAT_ID is not set, skipping daily news send.');
    return;
  }

  const today = toDateString(new Date());
  const symbols = Object.keys(COMPANY_NAME_BY_SYMBOL);
  const newsBySymbol = await Promise.all(
    symbols.map(async (symbol) => {
      const news = await getCompanyNews(symbol, today, today);
      return { symbol, news };
    })
  );

  const combinedText = formatCombinedNewsMessage(newsBySymbol);
  if (!combinedText) {
    return;
  }

  await bot.sendMessage(TELEGRAM_CHAT_ID, combinedText, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
};

cron.schedule(
  '30 9 * * *',
  async () => {
    await sendDailyNews();
  },
  { timezone: 'Asia/Singapore' }
);

bot.getMe().then((me) => {
  console.log(`Bot started: @${me.username}`);
});
