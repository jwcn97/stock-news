import { DefaultApi } from 'finnhub-ts';

const finnhubClient = new DefaultApi({
  apiKey: process.env.FINNHUB_API_KEY ?? '',
  isJsonMime: (input) => {
    try {
      JSON.parse(input)
      return true
    } catch (error) {}
    return false
  },
});

export const getCompanyNews = async (symbol: string, from: string, to: string) => {
  const response = await finnhubClient.companyNews(symbol, from, to);
  return response?.data ?? [];
}
